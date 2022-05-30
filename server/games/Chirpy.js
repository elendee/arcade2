const Game = require('./Game.js')




class Tile {
	constructor( init ){
		init = init || {}

	}
}



class Board {

	constructor( init ){
		init = init || {}
		this._TILES = []
	}

	init_tiles( n ){
		for( let x = 0; x < n; x++ ){
			this._TILES[x] = []
			for( let z = 0; z < n; z++ ){
				this._TILES[x][z] = new Tile({
					number: Math.random(),
				})
			}
		}
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