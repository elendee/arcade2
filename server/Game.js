const log = require('./log.js')
const lib = require('./lib.js')
const SOCKETS = require('./SOCKETS.js')








class Game {

	constructor( init ){

		init = init || {}
		this.name = init.name

		this._USERS = {}

		this.init()

	}


	init(){
		/*
			Games must extend this class 
			then overwrite this function to make _is_valid to be true
		*/

		this._is_valid = false

	}


	add_user( socket ){
		const user = socket?.request?.session?.USER
		if( !user ) return log('flag', 'no user to add to game: ' + this.name )

		this._USERS[ user.uuid ] = user

		this.broadcast({
			type: 'pong_user',
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

	bring_online( GAMES ){

		// pulse
		if( !this._pulse ){
			this._pulse = setInterval(() => {
				if( !Object.keys( this._USERS )){
					this.close( GAMES )
				}
			}, 5000 )
		}

		// any other stuff..

	}

	close( GAMES ){
		log('flag', 'closing: ' + this.name )
		clearInterval( this._pulse)
		delete this._pulse
		delete GAMES[ this.name ]
	}


}


module.exports = Game