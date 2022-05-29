const log = require('../log.js')
const DB = require('../db.js')
const Persistent = require('./Persistent.js')

class Holding extends Persistent {

	constructor( init ){
		super( init )
		init = init || {}
		this._table = 'coin_holdings'
		this._user_key = init.user_key
		this.cg_id = init.cg_id
		this.amount_coin = init.amount_coin
	}

	async save(){

		log('flag', 'saving holding: ', this )

		const update_fields = [
			'user_key',
			'cg_id',
			'amount_coin',
		]

		const update_vals = [ 
			this._user_key,
			this.cg_id,
			this.amount_coin,
		]

		const res = await DB.update( this, update_fields, update_vals )

		return res

	}


}

module.exports = Holding