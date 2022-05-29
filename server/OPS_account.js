const env = require('./.env.js')
// const bcrypt = require('bcryptjs')
const DB = require('./db.js')
const log = require('./log.js')
// const got = require('got')
const lib = require('./lib.js')
// const auth = require('./auth.js')
// const PUBLIC = require('./data/PUBLIC.js')
// const BROKER = require('./BROKER.js')



// const SALT_ROUNDS= 10

const action = async( request ) => {

	if( !lib.is_logged( request )) return lib.return_fail( 'unlogged account request', 'unlogged account request')

	const user = request.session.USER

	const pool = DB.getPool()

	const { action, data } = request.body

	let sql, res //, sql2, res2, results, gotten

	switch( action ){

		case 'get_account':
			return {
				success: true,
				user: user,
			}

		case 'set_field':
			res = await user.set_field( data, true )
			// BROKER.publish('BOARDS_UPDATE_USER', {
			// 	data: data,
			// 	persist: false,
			// 	uuid: user.uuid,
			// })
			return res

		default: 
			return lib.return_fail( 'unhandled action: ' + action, 'unhandled action')

	}

}



module.exports = {
	action,
}