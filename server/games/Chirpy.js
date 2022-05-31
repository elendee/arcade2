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
		this.uuid = init.uuid || arc_uuid()
		this.number = init.number
		this.x = init.x
		this.z = init.z
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

		this.init_tiles()

		add_publish( this )
	}

	init_tiles(){
		/* 
			one time
		*/
		for( let x = 0; x < this.size; x++ ){
			this._TILES[x] = []
			for( let z = 0; z < this.size; z++ ){
				this._TILES[x][z] = new Tile({
					number: Math.random(),
					x: x,
					z: z,
				})
			}
		}
	}

	add_user( user ){
		/*
			main add user
		*/
		this._USERS[ user.uuid ] = user
		// this._manager.broadcast({
		this.broadcast({
			type: 'chr_pong_user',
			user: user.publish(),
		})
	}

	broadcast( packet ){
		for( const uuid in this._USERS ){
			if( !SOCKETS[ uuid ] ){
				log('flag', 'missing socket for user : ' + uuid )
				continue
			}
			SOCKETS[ uuid ].send(JSON.stringify( packet ))
		}
	}

	get_listing(){
		/*
			for lobby page
		*/
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

	pong_board_state( socket ){
		/*
			pong board 
		*/
		const self = {
			uuid: this.uuid,
			founder_uuid: this.founder_uuid,
			size: this.size,
			tiles: this._TILES.map( tile => { return tile } ),
			type: this.type,
		}
		socket.send(JSON.stringify({
			type: 'chr_pong_board',
			board: self,
		}))
	}

	pong_player_state( socket ){

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
			size: 15,
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