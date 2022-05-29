const DB = require('../db.js')
const log = require('../log.js')
const lib = require('../lib.js')
const Persistent = require('./Persistent.js')


class Transaction extends Persistent {

	constructor( init ){
		super( init )
		init = init || {}
		this._table = 'transactions'
		this._user_key = init.user_key || init._user_key
		this.symbol = init.symbol
		this.timespan = init.timespan
		this.timestamp = init.timestamp
		this.buy = init.buy
		this.notes = init.notes
		this.price = init.price
	}

	async save(){

		log('Transaction', 'saving: ', this )

		const update_fields = [
			'user_key',
			'symbol',
			'timespan',
			'timestamp',
			'buy',
			'notes',
			'price',
		]

		const update_vals = [ 
			this._user_key,
			this.symbol,
			this.timespan,
			this.timestamp,
			this.buy,
			this.notes,
			this.price,
		]

		const res = await DB.update( this, update_fields, update_vals )

		return res

	}

}

module.exports = Transaction