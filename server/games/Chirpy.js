const Game = require('./Game.js')
const PUBLIC = require('../data/PUBLIC.js')
const {
	arc_uuid,
} = require('../lib.js')




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
		this._TILES = []
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

	async init_board( choice ){
		const keys = PUBLIC.BOARD_TYPES.map( ele => { return ele.name })
		if( !keys.includes( choice )) throw new Error('invalid board choice', choice )

		const board = new Board({
			type: choice,
			size: 10,
		})

		this._BOARDS[ board.uuid ] = board

		return board

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

}

module.exports = Chirpy