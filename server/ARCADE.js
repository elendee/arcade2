const env = require('./.env.js')
const log = require('./log.js')
const lib = require('./lib.js')
const BROKER = require('./BROKER.js')
const User = require('./persistent/User.js')
const SOCKETS = require("./registers/SOCKETS.js")
const ROUTER = require("./ROUTER.js")
const USERS = require("./registers/USERS.js")
const Chirpy = require('./games/Chirpy.js')









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






const touch_game = async( name ) => {

	if( GAMES[ name ] ) return GAMES[ name ]

	const game = new Chirpy({
		name: name,
	})

	await game.bring_online( GAMES )

	if( !game._is_valid ) throw new Error('invalid game: ' + name )

	return game

}







const join_game = async( event ) => {
	const { socket, packet } = event
	const { name } = packet

	try{

		const game = await touch_game( name )

		await game.add_user( socket )

	}catch( err ){
		return lib.return_fail_socket( socket, 'server encountered an error joining game', 10 * 1000, err )
	}

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
BROKER.subscribe('ARCADE_JOIN_GAME', join_game )

module.exports = {
	// init,
	// sweeping,
	init_user,
}