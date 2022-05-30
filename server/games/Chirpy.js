const Game = require('./Game.js')
const PUBLIC = require('../data/PUBLIC.js')
const {
	arc_uuid,
} = require('../lib.js')
const SOCKETS = require('../registers/SOCKETS.js')





const add_publish = obj => {

	obj.publish = ( ...excepted ) => {
		excepted = excepted || []
		let r = {}
		for( const key of Object.keys( this )){
			if( ( typeof( key ) === 'string' && key[0] !== '_' ) || excepted.includes( key ) ){
				if( this[ key ] && typeof this[ key ].publish === 'function' ){
					r[ key ] = this[ key ].publish()
				}else{
					r[ key ] = this[ key ]
				}
			}
		}
		return r
	}

}




class Tile {
	constructor( init ){
		init = init || {}
		this.number = init.number
	}
}



class Board {

	constructor( init ){
		init = init || {}
		this.type = init.type
		this.size = init.size
		this.uuid = init.uuid || arc_uuid()
		this.founder_uuid = init.founder_uuid
		this._manager = init._manager // parent Chirpy

		this._TILES = []
		this._USERS = {}

		add_publish( this )
	}

	init_tiles(){
		for( let x = 0; x < this.size; x++ ){
			this._TILES[x] = []
			for( let z = 0; z < this.size; z++ ){
				this._TILES[x][z] = new Tile({
					number: Math.random(),
				})
			}
		}
	}

	add_user( user ){
		this._USERS[ user.uuid ] = user
		this._manager.broadcast({
			type: 'chr_add_user',
			user: user.publish(),
		})
	}

	get_listing(){
		const listing  = {
			name: this.name,
			uuid: this.uuid,
			type: this.type,
			size: this.size,
			users: [],
		}
		for( const uuid in this._USERS ){
			listing.users.push({
				name: this._USERS[ uuid ].name,
				handle: this._USERS[ uuid ].handle,
			})
		}
		return listing
	}

	pong( socket ){
		const self = {
			uuid: this.uuid,
			founder_uuid: this.founder_uuid,
			size: this.size
		}
		socket.send(JSON.stringify({
			type: 'chr_pong_board',
			board: self,
		}))
	}


}



class Chirpy extends Game {
	/*
		manager class for all Chirpy Boards in play
	*/

	constructor( init ){
		super( init )
		init = init || {}

		this._BOARDS = {}

	}

	extend_init(){
		this._is_valid = true // ( deafult bool for all Game extends )
	}

	async init_board( choice, user ){
		const keys = PUBLIC.CHR_BOARD_TYPES.map( ele => { return ele.name })
		if( !keys.includes( choice )) throw new Error('invalid board choice', choice )

		const board = new Board({
			type: choice,
			size: 10,
			founder_uuid: user.uuid,
			_manager: this,
		})

		this._BOARDS[ board.uuid ] = board

		board.add_user( user )

		return board

	}

	get_user_board( user_uuid ){
		if( !user_uuid ) return false
		let b
		for( const uuid in this._BOARDS ){
			b = this._BOARDS[ uuid ]
			for( const uid in b._USERS ){
				if( uid === user_uuid ) return b
			}
		}
		return false
	}

	get_start( user ){
		const board_uuids = Object.keys( this._BOARDS )
		const user_uuids = Object.keys( this._USERS )
		return {
			name: this.name,
			board_uuids: board_uuids,
			user_uuids: user_uuids,
		}
	}

	remove_user( uuid ){
		if( SOCKETS[ uuid ]){
			delete SOCKETS[ uuid ]
		}
		delete this._USERS[ uuid ]
		this.broadcast({
			type: 'remove_user',
			game: this.name,
			user_uuid: uuid,
		})
	}

}

module.exports = Chirpy