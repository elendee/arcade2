const log = require('../log.js')
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
		this._is_create = init.is_create || init._is_create
		// this._manager = init._manager // parent Chirpy

		this._TILES = []
		this._USERS = {}

		this.init_tiles()

		add_publish( this )

		setTimeout(() => {
			this._is_create = false
		}, 10 * 1000 )

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

	add_user( user, manager ){ // Board
		/*
			main add user
		*/
		this._USERS[ user.uuid ] = user
		manager._USERS[ user.uuid ] = user
		// this._manager.broadcast({
		this.broadcast({
			type: 'chr_pong_user',
			user: user.publish(),
		})
	}

	remove_user( uuid ){
		delete this._USERS[ uuid ]
		this.broadcast({
			type: 'chr_remove_user',
			uuid: uuid,
		})
	}

	broadcast( packet ){ // Board
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

	check_active( manager ){
		const keys = Object.keys( this._USERS )
		if( !keys.length ){
			if( this._is_create ){
				log('flag', 'skipping board close for opening time')
			}else{
				this.close( this )
			}
		}
		log('Board', 'board users: ', keys.length )
	}

	// pong_player_state( socket ){

	// }

	close( manager ){
		for( const uuid in this._USERS ){
			this.remove_user( uuid )
		}
		clearInterval( this._clock )
		delete this._clock
		delete manager._BOARDS[ this.uuid ]
		log('status', 'board close: ', this.name )
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

	async init_board( type, size, user, is_create ){

		const keys = PUBLIC.CHR_BOARD_TYPES.map( ele => { return ele.name })
		if( !keys.includes( type )) throw new Error('invalid board type' )

		const n = Number( size )

		if( typeof n !== 'number' && IsNaN( n ) ) throw new Error('invalid board size')

		const init = {
			type: type,
			size: n,
			founder_uuid: user.uuid,
			is_create: is_create, // whether to hold board open through page reload or not
			// _manager: this,
		}

		log('Chirpy', 'new board: ', init )

		const board = new Board( init )

		this._BOARDS[ board.uuid ] = board

		board.add_user( user, this )

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


	check_active( GAMES ){
		let b 
		const bkeys = Object.keys( this._BOARDS )
		for( const uuid in this._BOARDS ){
			b = this._BOARDS[ uuid ]
			b.check_active( this )
		}

		const keys = Object.keys( this._USERS )
		if( !keys.length ){
			this.close( GAMES ) // ( in Game class )
		}

		log('Chirpy', 'boards active: ', bkeys.length )			
		log('Chirpy', 'users active: ', keys.length )			
	}

}

module.exports = Chirpy