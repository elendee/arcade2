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















// ---------------------------------------------
// lib
// ---------------------------------------------

const touch_game = async( name ) => {

	if( GAMES[ name ] ) return GAMES[ name ]

	const game = new Chirpy({
		name: name,
	})

	await game.bring_online( GAMES )

	if( !game._is_valid ) throw new Error('invalid game: ' + name )

	return game

}






// ---------------------------------------------
// socket handlers
// ---------------------------------------------

const init_user = async( event ) => {
	/*
		init user only, not location or game aware
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



const join_game = async( event ) => {
	const { socket, packet } = event
	const { name } = packet

	try{

		const user = socket.request?.session?.USER

		const game = await touch_game( name )

		await game.add_user( socket )

		socket.send(JSON.stringify({
			type: 'init_game',
			state: game.get_start( user ),
		}))

	}catch( err ){
		return lib.return_fail_socket( socket, 'server encountered an error joining game', 10 * 1000, err )
	}

}

const pong_game = event => {
	const { socket, packet } = event

	const p = {
		type: 'chr_pong_boards',
		boards: []
	}

	if( GAMES.chirpy ){
		for( const uuid in GAMES.chirpy._BOARDS ){
			const g = GAMES.chirpy._BOARDS[ uuid ].get_listing()
			p.boards.push( g )
		}
	}

	socket.send( JSON.stringify( p ) )

}

const chr_init_board = async( event ) => {

	const { socket, packet, user } = event

	try {
		const { subtype, choice } = packet

		let board

		switch( subtype ){

			case 'join':
				break;

			case 'create':
				board = await GAMES.chirpy.init_board( choice )
				break;

			default:
				return lib.return_fail_socket(socket, 'invalid type', 5000, false )
		}

		GAMES.chirpy.broadcast({
			type: 'chr_init_board',
			subtype: subtype,
			user_uuid: user.uuid,
			board: board.get_listing(),
		})

	}catch( err ){
		return lib.return_fail_socket(socket, 'error initializing game', 5000, err )
	}

}






// ---------------------------------------------
// BROKER
// ---------------------------------------------

BROKER.subscribe('ARCADE_INIT_USER', init_user )
BROKER.subscribe('ARCADE_JOIN_GAME', join_game )
BROKER.subscribe('CHR_PONG_BOARDS', pong_game )
BROKER.subscribe('CHR_INIT_BOARD', chr_init_board )






// ---------------------------------------------
// export
// ---------------------------------------------

module.exports = {
	// init,
	// sweeping,
	init_user,
}