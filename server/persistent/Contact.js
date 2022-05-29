const DB = require('../db.js')
const log = require('../log.js')
const lib = require('../lib.js')
const Persistent = require('./Persistent.js')


class Contact extends Persistent {

	constructor( init ){
		super( init )
		init = init || {}
		this._table = 'contacts'
		this._user_key = init.user_key || init._user_key
		this.fname = init.fname
		this.lname = init.lname
		this.email = init.email
		this.phone = init.phone ? String( init.phone ).replace(/[^0-9]/g, '') : undefined
		this.addr1 = init.addr1
		this.addr2 = init.addr2
		this.addr3 = init.addr3
		this.notes = init.notes
	}


	async save(){

		// if( !lib.is_valid_email( this.email ) ){
		// 	return lib.return_fail( 'invalid Contact email: ' + this.email, 'invalid contact email')
		// }

		log('Contact', 'saving: ', this )

		const update_fields = [
			'user_key',
			'fname',
			'lname',
			'email',
			'phone',
			'addr1',
			'addr2',
			'addr3',
			'notes',
		]

		const update_vals = [ 
			this._user_key,
			this.fname,
			this.lname,
			this.email,
			this.phone,
			this.addr1,
			this.addr2,
			this.addr3,
			this.notes,
		]

		const res = await DB.update( this, update_fields, update_vals )

		return res

	}

}

module.exports = Contact