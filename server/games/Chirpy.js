const Game = require('./Game.js')


class Chirpy extends Game {
	constructor( init ){
		super( init )
		init = init || {}
	}

	extend_init(){
		this._is_valid = true // ( deafult bool for all Game extends )

	}

}

module.exports = Chirpy