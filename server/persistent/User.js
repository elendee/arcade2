const log = require('../log.js')
// const env = require('../.env.js')
const lib = require('../lib.js')
const bcrypt = require('bcryptjs')

// const DATA_PRIVATE = require('../data/PRIVATE.js')

const uuid = require('uuid').v4
const DB = require('../db.js')
const Persistent = require('./Persistent.js')

const SALT_ROUNDS = 10


const SAVE_MAP = {
	values: {
		_password: '_password',
		handle:  '_handle_store',
		color:  'color',		
	},
	filters: {
		_password: ( value, user ) => {
			let salt = bcrypt.genSaltSync( SALT_ROUNDS )
			let hash = bcrypt.hashSync( value, salt )
			return hash
		}
	},
	callbacks: {
		_handle_store: ( value, user ) => {
			user.handle = value
		}
	}

}


class User extends Persistent {

	constructor( init ){

		super( init )

		init = init || {}

		this._table = 'users'

		this.uuid = init.uuid || uuid()

		this._handle_store = lib.validate_string( init.handle_store, init._handle_store, undefined )
		this.handle = lib.validate_string( this._handle_store, 'user#' + this.uuid.substr(0,4) )

		this.color = lib.validate_string( init.color, '#' + lib.random_bar_color( 6 ) )

		this._email = lib.validate_string( init.email, init._email, undefined )

		this._password = lib.validate_string( init._password, init.password, undefined )

		this._confirmed = init._confirmed || init.confirmed || false

		this._confirm_code = lib.validate_string( init.confirm_code, init._confirm_code, undefined )

		this._reset_time = lib.validate_date( init.reset_time, init._reset_time, undefined )

		this._last_log = lib.validate_string( init.last_log, init._last_log, undefined )

		// instantiated

		// unlogged users only:
		this._joined_boards = this._id ? false : ( init._joined_boards || [] )

	}



	async set_field( data, persist ){
		log('flag', 'set field: ', data )
		/*
			safely update a field given from client
			optionally save to database as well
		*/
		const { field, value } = data
		if( !SAVE_MAP.values[ field ] ) return lib.return_fail({ msg: 'bad save', packet: data }, 'invalid save')

		// update
		// filters
		this[ SAVE_MAP.values[ field ] ] = SAVE_MAP.filters[ field ] ? SAVE_MAP.filters[ field ]( value, this ) : value
		// callbacks
		if( SAVE_MAP.callbacks[ field ] ) SAVE_MAP.callbacks[ field ]( value, this )

		// save
		if( persist ) await this.save()

		return {
			success: true,
		}
	}


	refresh_joined_boards( socket ){
		/*
			triggered when unlogged users hit max boards
			session boards can get stale if db is updated but sessions are not
			so this makes sure session boards actually exist still
		*/
		// dumb validate
		if( !this._joined_boards || this._joined_boards.length > 10 ){
			return lib.return_fail({
				msg: `unlogged user ${ this.uuid.substr(0,6) } has messed up session boards`,
				boards: this._joined_boards,
			})
		}
		// clean
		const pool = DB.getPool()
		let sql
		let c
		for( let i = 0; i < this._joined_boards.length; i++ ){
			sql = 'SELECT * FROM boards WHERE id=?'
			const id = this._joined_boards[i]
			setTimeout(() => {
				pool.queryPromise( sql, id )
				.then( res => {
					if( res.error  ){
						log('flag', res.error )
					}else{
						if( !res?.results?.length ){ // db board not found; so delete from mem
							this._joined_boards.splice( this._joined_boards.indexOf(id), 1 )
							log('flag', `removing ${ id }, boards now: ${ this._joined_boards }`)
						}
					}
				})
				.catch( err => {
					log('flag', err )
				})
			}, i * 1000 )
			c = i
		}
		setTimeout(() => {
			if( !socket ){
				log('flag', 'socket deleted before save', this.uuid.substr(0,4))
				return
			}
			socket.request.session.save()
		}, c * 1000 )
	}


	async save(){

		const update_fields = [
			'email',
			'handle_store',
			'color',
			'password',
			'confirmed',
			'confirm_code',
			'reset_time',
		]

		const update_vals = [ 
			this._email,
			this._handle_store,
			this.color,
			this._password,
			this._confirmed,
			this._confirm_code,
			this._reset_time,
		]

		const res = await DB.update( this, update_fields, update_vals )

		return res

	}



}

  
module.exports = User
