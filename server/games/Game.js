const log = require('../log.js')
const lib = require('../lib.js')
const SOCKETS = require('../registers/SOCKETS.js')
const User = require('../persistent/User.js')
const USERS = require('../registers/USERS.js')








class Game {

	constructor( init ){

		init = init || {}
		this.name = init.name

		this._USERS = {}

		this.extend_init()

	}

	extend_init(){ /* extend */ this._is_valid = false }
	
	get_start(){ /* extend */ return false }


	add_user( socket ){
		const user = socket?.request?.session?.USER
		if( !user ) return lib.return_fail_socket( socket, 'no user to add to game: ' + this.name, 5000, 'no user given for join')

		if( this._USERS[ user.uuid ]){
			return log('flag', 'user is already in game')
			// lib.return_fail_socket(  socket, 'user is already in game', 5000, 'user probably reloaded page.. apply a penalty here' )
		}

		// touch from global registry
		let u
		if( USERS[ user.uuid ] ){ // unlikely case of existing globally but not in game
			u = USERS[ user.uuid ]
		}else{
			u = new User( user )
			USERS[ u.uuid ] = u				
		}

		this._USERS[ u.uuid ] = u

		this.broadcast({
			type: 'pong_user',
			user: u.publish(),
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

		// registry
		GAMES[ this.name ] = this

	}

	close( GAMES ){
		log('flag', 'closing: ' + this.name )
		clearInterval( this._pulse)
		delete this._pulse
		delete GAMES[ this.name ]
	}


}


module.exports = Game