const env = require('./.env.js')
const log = require('./log.js')
const BROKER = require('./BROKER.js')
const User = require('./persistent/User.js')
const SOCKETS = require("./SOCKETS.js")
const ROUTER = require("./ROUTER.js")
const USERS = require("./USERS.js")
const Game = require('./Game.js')









const GAMES = {}









const init_user = async( event ) => {
	/*
		init user only, not location aware
	*/

	const { socket } = event

	let user = new User( socket.request?.session?.USER )

	USERS[ user.uuid ] = user

	SOCKETS[ user.uuid ] = socket

	await ROUTER.bind_user( socket )

	socket.send(JSON.stringify({
		type: 'init_user',
		user: user.publish('_email', '_created', '_edited', '_confirmed')
	}))

	return true
}






const init_game = async( event ) => {
	const { socket, packet } = event
	const { name } = packet



	if( GAMES[ name ]){
		return log('flag', 'game already initted: ' + name )
	}

	const game = new Game({
		name: name,
	})

	if( !game._is_valid ){
		return log('flag', 'invalid game init', packet )
	}

	await game.bring_online( GAMES )

	await game.add_user( socket )

	log('flag','init game', name )
}





// let sweeping = false

// const init = async() => {
// 	/*
// 		init master sweep
// 	*/
// 	sweeping = setInterval(() => {

// 		// sweep games
// 		for( const name in GAMES ){
// 			if( !GAMES[ name ].pulse ){
// 				GAMES[ name ].close( GAMES )
// 				.catch( err => {
// 					log('flag', 'err game close', err )
// 				})
// 			}
// 		}

// 		// sweep arcade
// 		if( !Object.keys( GAMES )){
// 			log('flag', 'no games online')
// 			close()
// 		}

// 	}, env.LOCAL ? 2000 : 10 * 1000 )
// }




// const close = () => {
// 	/*
// 		force close (or close) entire arcade
// 	*/

// 	// just in case
// 	for( const name in GAMES ){
// 		GAMES[ name ].close()
// 		.catch( err => {
// 			log('flag', 'err game close', err )
// 		})
// 	}

// 	// stop sweeping
// 	log('flag', 'arcade closing')
// 	clearInterval( sweeping )
// 	sweeping = false

// 	return true

// }





BROKER.subscribe('ARCADE_INIT_USER', init_user )
BROKER.subscribe('ARCADE_INIT_GAME', init_game )

module.exports = {
	// init,
	// sweeping,
	init_user,
}