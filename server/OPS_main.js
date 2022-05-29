const env = require('./.env.js')
const lib = require('./lib.js')
const log = require('./log.js')
const DB = require('./db.js')
const PUBLIC = require('./data/PUBLIC.js')
const got = require('got')
const Coin = require('./persistent/Coin.js')
const Transaction = require('./persistent/Transaction.js')
const Holding = require('./persistent/Holding.js')
const CoinGecko = require('coingecko-api')
// const date = require('./date.js')


const gecko = new CoinGecko()
// calls return: {
// 	success
// 	message
// 	code
// 	data
// }



const week = ( 60 * 60 * 24 * 7 ) // * 1000

const spans = {
	week: week,
	month: week * 4,
	year: week * 52,
}


const action = async( request ) => {

	const { action, data } = request.body

	const pool = DB.getPool()

	let sql, res, sql1, res1, sql2, res2

	let cg_id, name, symbol, timespan

	let response

	const now = String( new Date().getTime() ).substr(0, 10)

	switch( action ){

		case 'symbol_current':
			response = await got( 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=' + data.id )
			// response = await gecko( 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=' + data.id )

			return {
				success: true,
				result: response.body,
				from: Number( now ) - ( 60 * 60 * 24 ),
			}

		case 'symbol_history':

			const from = now - spans[ data.timespan ] // unix / seconds

			const params = {
				from: from, // unix / seconds
				to: now, // unix / seconds
				vs_currency: 'usd',
			}
			const granularity = get_granularity_minutes( data.timespan, from )
			// log('flag', 'req params: ', params )
			response = await gecko.coins.fetchMarketChartRange( data.id, params )
			return {
				success: true,
				result: response,
				granularity: granularity,
				from: from,
			}

		case 'save_watch':

			if( !env.LOCAL && !lib.is_logged( request )) return lib.return_fail( 'unlogged save_watch', 'must be logged in')

			cg_id = data.cg_id
			name = data.name
			const this_symbol = data.symbol
			subtype = data.subtype

			let coin_id

			// find coin
			sql = 'SELECT * FROM coins WHERE cg_id=?'
			res = await pool.queryPromise( sql, cg_id )
			if( res.error ) return lib.return_fail( res.error, 'coin lookup err')

			// insert if new
			if( !res.results || !res.results.length ){

				const coin = new Coin({
					cg_id: cg_id,
					name: name,
					symbol: this_symbol,
					subtype: subtype,
				})
				const { success, msg, id } = await coin.save()
				if( !success ) return lib.return_fail( msg, 'err saving coin')

				coin_id = id

			}else{
				coin_id = res.results[0].id
			}

			sql2 = 'SELECT COUNT(id) FROM user_watches WHERE user_id=?'
			res2 = await pool.queryPromise( sql2, request.session.USER._id )
			if( res2.error ) return lib.return_fail( res2.error, 'error looking up user watches')
			if( res2.results && res2.results[0]['COUNT(id)'] > PUBLIC.WATCH_CAP ) return lib.return_fail( 'too many watches: ' + request.session.USER._email, 'you can only have ' + PUBLIC.WATCH_CAP + ' coins watched at a time.')

			sql1 = 'INSERT INTO user_watches ( user_id, coin_id ) VALUES (?, ?)'
			res1 = await pool.queryPromise( sql1, [ request.session.USER._id, coin_id ])
			if( res1.error ) return lib.return_fail( res1.error, 'coin watch err')
			return {
				success: true,
			}

		case 'remove_watch':

			if( !env.LOCAL && !lib.is_logged( request )) return lib.return_fail( 'unlogged save_watch', 'must be logged in')

			cg_id = data.cg_id

			sql = 'SELECT * FROM coins WHERE cg_id=?'
			res = await pool.queryPromise( sql, cg_id )
			if( res.error || !res.results || !res.results[0] ) return lib.return_fail( res.error, 'could not find coin' )

			sql1 = 'DELETE FROM user_watches WHERE coin_id=?'
			res1 = await pool.queryPromise( sql1, res.results[0].id )
			if( res1.error ) return lib.return_fail( res1.error, 'failed to remove user watch' )

			return { success: true }

		case 'save_trade':

			if( !env.LOCAL && !lib.is_logged( request )) return lib.return_fail( 'unlogged add_trade', 'must be logged in')

			let { notes, price, timestamp, buy } = data
			timespan = data.timespan
			symbol = data.symbol
			const t = new Transaction({
				user_key: env.LOCAL ? request.session.USER._id || env.ADMIN_ID || 1 : request.session.USER._id,
				symbol: symbol, 
				timespan: timespan,
				timestamp: timestamp,
				notes: notes,
				price: price,
				buy: buy,
			})
			const { success, id, msg } = await t.save()

			// log('flag', 'party', symbol, timespan, timestamp, buy )

			return {
				success: success,
				transaction: t.publish(),
			}

		case 'remove_trade':

			if( !env.LOCAL && !lib.is_logged( request )) return lib.return_fail( 'unlogged remove_trade', 'must be logged in')

			const { transaction } = data

			// log('flag', 'tx: ', transaction )

			sql = 'DELETE FROM transactions WHERE ( symbol=? AND timestamp=? AND timespan=? AND user_key=? )'
			res = await pool.queryPromise( sql, [ transaction.symbol, transaction.timestamp, transaction.timespan, request.session.USER._id || env.ADMIN_ID ] )
			if( res.error ) return lib.return_fail( res.error, 'failed to remove trade')
			if( !res.results || !res.results.affectedRows ){
				return lib.return_fail( 'no affected transacts to delete: ' + JSON.stringify( transaction ), 'no transaction found to delete')
			}

			return {
				success: true,
			}

		case 'get_transactions':
			// let { symbol } = data
			timespan = data.timespan
			symbol = data.symbol
			sql = 'SELECT * FROM transactions WHERE user_key=? AND timespan=? AND symbol=?'
			res = await pool.queryPromise( sql, [ request.session.USER._id || env.ADMIN_ID, timespan, symbol ] )
			if( res.error ) return lib.return_fail( res.error, 'error getting transactions')
			results = []
			for( let t of res.results ){
				results.push( new Transaction( t ).publish() )
			}
			return {
				success: true,
				results: results,
			}

		case 'coin_holding':

			const { crud, amount_coin } = data
			cg_id = data.cg_id

			switch( crud ){
				case 'read':

					if( !lib.is_logged( request ) && env.PRODUCTION ) return lib.return_fail('unlogged coin_holding', 'must be logged in')

					if( !cg_id ) return lib.return_fail('cg_id reads only', 'coin gecko coins only')
					sql = `SELECT * FROM coin_holdings WHERE user_key=? AND cg_id=?`,
					res = await pool.queryPromise( sql, [ request.session.USER._id, cg_id ] )
					if( !res || res.error ) return lib.return_fail( res.error, 'failed to read coin holding')

					gotten = await got( 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=' + cg_id )

					return {
						success: true,
						coins: gotten.body,
						results: res.results,
					}

				case 'update':

					if( !lib.is_logged( request )) return lib.return_fail('unlogged coin_holding', 'must be logged in')

					if( !cg_id ) return lib.return_fail( 'no non-coin gecko updates ', 'only coin gecko listings allowed currently')

					const psql = 'SELECT * FROM coin_holdings WHERE user_key=? AND cg_id=?'
					const pres = await pool.queryPromise( psql, [ request.session.USER._id, cg_id ])
					if( !pres || pres.error ) return lib.return_fail( pres.error, 'error updating holding')

					const holding = new Holding( pres.results[0] )
					holding.amount_coin = amount_coin
					holding.cg_id = cg_id
					holding._user_key = request.session.USER._id
					const { success, id } = await holding.save()

					// const 
					// sql = 'UPDATE coin_holdings SET amount_coin=? WHERE user_key=? AND coin_key=?'
					// res = await pool.queryPromise( sql, [ holding, request.session.USER._id, coin_id ] )
					// if( !res || res.error ) return lib.return_fail( res.error, 'failed coin holding update')
					return {
						success: success,
					}

				default: 
					break;

			}
			break;

		default: 
			log('flag', 'unrecognized action type: ', action )
			break;

	}

	return {
		success: false,
		msg: 'failed action'
	}

}





const get_data = async( request ) => {

	const { type } = request.params

	const pool = DB.getPool()

	switch( type ){

		case 'watch':

			if( !lib.is_logged( request )) return lib.return_fail( 'unlogged watch', 'must be logged in')
			const sql = {
				sql: 'SELECT * FROM user_watches LEFT JOIN coins ON coins.id=user_watches.coin_id WHERE user_id=?',
				nestTables: true,
			}
			const res = await pool.queryPromise( sql, request.session.USER._id )
			if( res.error ) return lib.return_fail( res.error, 'error getting user watch')
			return {
				success: true,
				results: res.results,
			}

		default: 
			log('flag', 'unrecognized get request: ', params )
			return {
				success: false,
				msg: 'unrecognized watch type'
			}

	}

}




const get_granularity_minutes = ( timespan, from_seconds ) => {
// 1 day from query time = 5 minute interval data
// 1 - 90 days from query time = hourly data
// above 90 days from query time = daily data (00:00 UTC)
	const days = from_seconds / 60 / 60 / 24

	if( days <= 1 ){
		return 5
	}else if( days <= 90 ){
		return 60
	}else{
		return 60 * 24
	}

}





const coin_reader = async( timespan ) => {

	if( !env.COIN_ADMIN ) return lib.return_fail( 'missing coin admin for read', '')

	const pool = DB.getPool()

	const sql1 = 'SELECT id FROM users WHERE email=?'
	const res1 = await pool.queryPromise( sql1, env.COIN_ADMIN )
	if( res1.error ) throw new Error( res1.error )

	const admin_id = res1.results[0].id

	const sql = 'SELECT cg_id FROM user_watches LEFT JOIN coins ON coins.id=user_watches.coin_id WHERE user_id=?'
	const res = await pool.queryPromise( sql, admin_id )
	if( res.error ) throw new Error( res.error )

	// the result object
	const r = {}


	const all_res = await new Promise((resolve, reject) => {

		let all = {}

		// call back as results come in
		let rcvd = 0

		const now = String( new Date().getTime() ).substr(0, 10)

		// iterate all coins and call callbacks ^^
		for( const c of res.results ){

			const from = now - spans[ timespan ] // unix / seconds

			const params = {
				from: from, // unix / seconds
				to: now, // unix / seconds
				vs_currency: 'usd',
			}

			// const granularity = get_granularity_minutes( timespan, from )
			gecko.coins.fetchMarketChartRange( c.cg_id, params )
			.then( result => {
				rcvd++
				all[ c.cg_id ] = result.data
				if( rcvd === res.results.length ){
					resolve({
						all: all,
						timespan: timespan,
					})
				}
			})
			.catch( err => {
				log('flag', 'err fetch fetch', err )
				rcvd++
				all[ c.cg_id ] = {}
				if( rcvd === res.results.length ){
					resolve({
						all: all,
						timespan: timespan,
					})
				}
			})

		}

		setTimeout(() => {
			reject('too long')
		}, 10 * 1000 )

	})

	return all_res

}



// ensure coin has sufficient history
const acceptable_lengths = {
	week: 150, // ( 168 )
	month: 600, // ( 673 )
	year: 350, // ( 364 )
}




const interpret_deviations = all => {

	let d
	for( const cg_id in all ){

		d = all[ cg_id ]
		
		const magnitude = d.high - d.low
		const base = ( d.avg - d.low ) / magnitude
		const crnt = ( d.prices[ d.prices.length - 1 ][1] - d.low ) / magnitude

		d.base_point = base
		d.current_point = crnt
		d.deviation_point = crnt / base

		delete d.prices // for easier logging

	}

	return all

}

const process_deviation_results = ( all, timespan ) => {

	const r = {}

	for( const cg_id in all ){

		const { prices } = all[ cg_id ]

		let low = 9999999999
		let high = 0
		let sum = 0
		for( const price of prices ){ // 0 = timestamp , 1 = price
			if( price[1] < low ) low = price[1]
			if( price[1] > high ) high = price[1]
			sum += price[1]
		}

		let avg = sum / prices.length
		// console.log( id, prices.length )
		if( prices.length < acceptable_lengths[ timespan ] ){
			log('flag', 'skipping ' + cg_id + ' for too short price history (' + prices.length + ')')
			low = high = avg = 0
			// continue
		}

		r[ cg_id ] = {
			low: low,
			high: high,
			sum: sum,
			avg: avg,
			prices: prices,
		}

	}

	return r

}






module.exports = {
	action,
	get_data,
	coin_reader,
	process_deviation_results,
	interpret_deviations,
}