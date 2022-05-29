const DB = require('../db.js')
const log = require('../log.js')
const lib = require('../lib.js')
const Persistent = require('./Persistent.js')
const Anchor = require('./Anchor.js')
// const uuid = require('uuid').v4
const SOCKETS = require('../SOCKETS.js')
const PUBLIC = require('../data/PUBLIC.js')
const User = require('./User.js')
// const { BOARDS } = require('../data/PUBLIC.js')


const RANDO_NAMES = [
	'Tinkerbell',
	'Galadriel',
	'Celeborn',
	'Bombadil',
	'Gondor',
	'The Shire',
	'Yamato',
	'Moonbeam',
	'Prancer',
	'Rudolph',
	'Milky Way',
	'Alpha',
	'Beta',
	'Omega',
]

	// reflect


class Board extends Persistent {

	constructor( init ){
		super( init )
		init = init || {}
		this._table = 'boards'
		this.name = ( typeof init.name === 'string' && init.name ) ? init.name : lib.random_entry( RANDO_NAMES )
		// 'board#' + lib.random_hex(4)
		this.uuid = lib.validate_string( init.uuid, lib.random_hex(12) )
		this._user_key = init.user_key || init._user_key
		this.content = lib.validate_string( init.content, undefined )
		this.is_public = init.is_public
		this.fg_color = lib.validate_string( init.fg_color, '#96fa96' )
		this.bg_color = lib.validate_string( init.bg_color, '#232323' )

		// instantiated
		this.created_hash = init.created_hash
		this._USERS = {}
		this._ANCHORS = {}

	}


	async bring_online( BOARDS ){
		BOARDS[ this.uuid ] = this
		const pool = DB.getPool()
		const sql = 'SELECT * FROM board_anchors WHERE board_key=?'
		const res = await pool.queryPromise( sql, this._id )
		if( res.error ){
			log('flag', 'error hydrating board anchors', res.error )
		}
		for( const result of res.results ){
			this._ANCHORS[ result.uuid ] = new Anchor( result )
		}
		return true
	}

	
	add_user( user ){

		// log('flag', 'board add user', user.handle )
		this._USERS[ user.uuid ] = user
		this.broadcast({
			type: 'pong_user',
			board: this.publish(),
			user: user.publish(),
		})

		// if logged, add to perm user history
		if( user._id ){

			if( !this._id ){
				log('flag', ' --- somehow trying to save a board with no id --- ', this )
				return
			}

			// log('flag', 'DOTH NOT THIS BOARD EXIST??', this._id )

			const join = new Join({
				board_key: this._id,
				user_key: user._id,
			})

			// log('flag', 'attempted join save', join )

			join.save()
			.catch( err => {
				log('flag', 'err saving user join', err )
			})
		}

	}


	pong_user( socket, uuid ){
		const user = this._USERS[ uuid ]
		if( !user ) return
		socket.send(JSON.stringify({
			type: 'pong_user',
			board: this.publish(),
			user: user.publish()
		}))
	}


	remove_user( uuid, type ){
		if( typeof uuid !== 'string' ){
			log('flag', 'invalid remove_user', uuid)
			return
		}

		// log('flag', 'remove user', uuid, type )

		const user = this._USERS[ uuid ]
		const is_owner = user?._id && this._user_key === user._id
		
		const socket = SOCKETS[ uuid ]
		if( socket ){
			if( is_owner ){
				log('flag', 'proceeding with request to remove owner from own board', uuid, this.uuid )
			}
			socket.send(JSON.stringify({
				type: 'remove_user',
				board: this.publish(),
			}))
		}else{
			log('flag', 'missing socket for user: ', user.handle )
		}
		delete this._USERS[ uuid ]

		// log('flag', 'remove user', Object.keys( this._USERS ) )
		this.broadcast({
			type: 'board_users',
			all_users: Object.keys( this._USERS ),
		})
	}


	broadcast( packet ){
		for( const uuid in this._USERS ){
			const socket = SOCKETS[ uuid ]
			if( socket ){
				socket.send(JSON.stringify( packet ))
			}else{
				log('flag', 'user with no socket: ', uuid )
			}
		}
	}


	save_content( socket, user_uuid, content ){
		const user = this._USERS[ user_uuid ]
		if( !user ) return lib.return_fail_socket( socket, 'invalid user for save', 3000, 'no user: ' + user_uuid.substr(0,6) )

		if( typeof content !== 'string' ) return lib.return_fail_socket( socket, 'invalid content passed', 5000 )
		if( content.length > PUBLIC.BOARDS.CONTENT_LIMIT ) return lib.return_fail_socket( socket, 'content max chars: ' + PUBLIC.BOARDS.CONTENT_LIMIT, 5000 )

		this.content = content

		this.save()
		.catch( err => {
			log('flag', 'err saving board', err )
		})
		// .then( res => { // just in case...
		// 	const{ datetime } = res
		// })

		const b = this.publish()

		const l = Object.assign( {}, b )
		l.content = '(trimmed)'

		// log('flag', 'saved board', l )

		this.broadcast({
			type: 'pong_board',
			board: b,
			user_uuid: user_uuid,
		})

	}


	close( BOARDS ){
		log('flag', 'board going offline', BOARDS[ this.uuid ]?.name )
		for( const uuid in this._USERS ){
			// remove any references to board... 
			// usually will be no users because that is the close condition
			this.remove_user( uuid )
		}
		delete BOARDS[ this.uuid ]
	}


	can_edit( socket ){
		if( !lib.is_logged( socket?.request )) return false
			// lib.return_fail_socket( socket, 'must be logged in', 5000)
		const user = socket.request.session.USER
		if( this._user_key !== user._id ) return false
		return true
			// lib.return_fail_socket( socket, 'you are not the owner of this board', 5000)
	}

	publish_anchors( is_private, deep ){
		/*
			is_private == '_fields', etc
			deep == include / dont 'content' - because it could be massive packets
		*/
		const anchors = {}
		for( const uuid in this._ANCHORS ){
			anchors[ uuid ] = Object.assign({}, ( is_private ? this._ANCHORS[ uuid ] : this._ANCHORS[ uuid ].publish() ) )
			if( !deep ) delete anchors[ uuid ].content
		}
		return anchors
	}


	async handle_options( socket, option, state ){

		switch( option ){
			case 'is_public':
				this.is_public = state
				if( !this.is_public ){
					// const board = BOARDS[ this.uui]
					for( const uuid in this._USERS ){
						if( this._USERS[ uuid ]._id !== this._user_key ){
							this.remove_user( uuid )
						}
					}
				}
				break;

			case 'name':
				if( typeof state !=='string' ) return lib.return_fail_socket( socket, 'invalid name', 5000 )
				this.name = state.trim()
				break;

			case 'fg_color':
			case 'bg_color':
				if( typeof state !=='string' ) return lib.return_fail_socket( socket, 'invalid color', 5000 )
				this[ option ] = state.trim()
				break;

			default:
				return lib.return_fail_socket(socket, 'unrecognized board option', 5000, 'unknown option for edit board: ' + option)
		}

		this.save()
		.then( async( res ) => {
			const allowed_users = await this.get_allowed_users( socket )
			this.broadcast({
				type: 'reflect_options',
				board: this.publish(),
				allowed_users: allowed_users,
			})
		})
		.catch(err => {
			lib.return_fail_socket( socket, 'failed to save options', 5000, err )
		})

	}


	async get_allowed_users( socket ){
		const users =	[]
		const pool = DB.getPool()
		const sql = 'SELECT * FROM board_permits WHERE board_key=?'
		if( typeof this._id !== 'number'){
			log('flag', 'no id found')
		}
		const res = await pool.queryPromise( sql, this._id )
		if( res.error ) log('flag', 'err looking up allowed users', res.error )
			// return lib.return_fail_socket( socket, 'error looking up user permits', 5000, res.error )
		for( const result of ( res?.results || [] ) ){
			users.push( new User( result ).publish() )
		}
		return users
	}


	get_online_users( socket ){
		const users = []
		for( const uuid in this._USERS ){
			users.push( new User( this._USERS[ uuid ] ).publish() )
		}
		// log('flag', 'online: ', users )
		return users
	}


	async save(){

		const update_fields = [
			'user_key',
			'content',
			'name',
			'uuid',
			'is_public',
			'fg_color',
			'bg_color',
		]

		const update_vals = [ 
			this._user_key,
			this.content,
			this.name,
			this.uuid,
			this.is_public,
			this.fg_color,
			this.bg_color,
		]

		const res = await DB.update( this, update_fields, update_vals )

		return res

	}

}





class Join extends Persistent {

	constructor( init ){
		init = init || {}
		super( init )
		this._table = 'board_joins'
		this._user_key = lib.validate_number( init.user_key, init._user_key, undefined )
		this._board_key = lib.validate_number( init.board_key, init._board_key, undefined )
	}

	async save(){

		const update_fields = [
			'user_key',
			'board_key',
		]

		const update_vals = [ 
			this._user_key,
			this._board_key,
		]

		const res = await DB.update( this, update_fields, update_vals )

		return res

	}

}






module.exports = Board