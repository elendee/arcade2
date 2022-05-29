const DB = require('../db.js')
const Persistent = require('./Persistent.js')

class Coin extends Persistent {

	constructor( init ){
		super( init )
		init = init || {}
		this._table = 'coins'
		this.subtype = init.subtype || 'generic'
		this.name = init.name
		this.cg_id = init.cg_id // coin gecko
		this.symbol = init.symbol
	}



	async save(){

		const update_fields = [
			'subtype',
			'name',
			'cg_id',
			'symbol',
		]

		const update_vals = [ 
			this.subtype,
			this.name,
			this.cg_id,
			this.symbol,
		]

		const res = await DB.update( this, update_fields, update_vals )

		return res

	}

}

module.exports = Coin