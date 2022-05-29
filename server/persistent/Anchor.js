const DB = require('../db.js')
// const log = require('../log.js')
const lib = require('../lib.js')
const Persistent = require('./Persistent.js')
// const SOCKETS = require('../SOCKETS.js')
// const PUBLIC = require('../data/PUBLIC.js')
// const User = require('./User.js')




class Anchor extends Persistent {

	constructor( init ){
		super( init )
		init = init || {}
		this._table = 'board_anchors'
		this.uuid = init.uuid || lib.random_hex( 12 )
		this._board_key = lib.validate_number( init.board_key, init._board_key, undefined )
		this.content = lib.validate_string( init.content, undefined )

	}


	async save(){

		const update_fields = [
			'content',
			'board_key',
			'uuid'
		]

		const update_vals = [ 
			this.content,
			this._board_key,
			this.uuid,
		]

		const res = await DB.update( this, update_fields, update_vals )

		return res

	}

}

module.exports = Anchor