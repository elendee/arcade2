const env = require('./.env.js')
const log = require('./log.js')
const lib = require('./lib.js')
const DB = require('./db.js')
const SETTINGS = require('./SETTINGS.js')









const clean_db = () => {

	const some_interval = 1000 * 60 * 60 * 24

	const delete_time = Date.now() - some_interval

	// delete from mem ...
	
	// ... which SHOULD line up with db boards
	
	return

}


const bump_cron = async() => {
	SETTINGS.set('last_cron', Date.now())
	return true
}


const BUMP_TIME = 1000 * 60 * 60 * 24 // time to send
const TICK_TIME = 1000 * 60 * 60 // time to check for send

const cron = async( caller ) => {

	// ensure last tick
	if( typeof last_tick !== 'number'){
		const pool = DB.getPool()
		const sql = `SELECT * FROM settings WHERE setting=?`
		const res = await pool.queryPromise( sql, 'last_cron' )
		if( res.error ) return lib.return_fail( res.error, false )
		const num = Number( res?.results?.[0]?.value )
		// log('flag', res.results )
		if( typeof num !== 'number' || isNaN( num ) ) return lib.return_fail( 'invalid last tick ' + res?.results?.[0], false )
		last_tick = num
	}

	log('arc_cron', caller )

	// do cron
	if( Date.now() - last_tick > BUMP_TIME ){
		clean_db()
		bump_cron()		
	}

}

// init

let initialized = false
let last_tick

module.exports = () => {

	if( initialized ) return
	initialized = true

	cron('init')

	let ARC_CRON = setInterval(() => {
		cron('tick')
	}, TICK_TIME )

}