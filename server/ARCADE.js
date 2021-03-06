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
	/*
		get or instantiate game
	*/

	if( GAMES[ name ] ) return GAMES[ name ]

	const game = new Chirpy({
		name: name,
	})

	await game.bring_online( GAMES )

	if( !game._is_valid ) throw new Error('invalid game: ' + name )

	return game

}


const get_user_game  = user => {
	if( !user ) return
	for( const name in GAMES ){
		for( const uuid in GAMES[ name ]._USERS ){
			if( uuid === user.uuid ) return GAMES[ name ]
		}
	}
	return false
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
		const { subtype, values, create } = packet

		let board

		switch( subtype ){

			case 'join':
				board = GAMES.chirpy._BOARDS[ values.uuid ]
				if( !board ) return lib.return_fail_socket( socket, 'board not found', 5000, 'no board join: ' + values.uuid )
				break;

			case 'create':
				board = await GAMES.chirpy.init_board( values.type, values.size, user, create )
				break;

			default:
				return lib.return_fail_socket(socket, 'invalid type', 5000, false )
		}

		const p = {
			type: 'chr_init_board',
			// subtype: subtype,
			// user_uuid: user.uuid,
			board: board.get_listing(),
		}

		socket.send( JSON.stringify( p ))

	}catch( err ){
		const msg = typeof err.message === 'string' && err.message.match(/invalid .*/i) ? err.message : 'error initializing game'
		return lib.return_fail_socket(socket, msg, 10 * 1000, err )
	}

}


const chr_pong_board = async( event ) => {

	const { socket, packet } = event 

	const user = socket.request?.session?.USER

	// standard
	if( GAMES.chirpy ){
		let board = GAMES.chirpy.get_user_board( user.uuid )
		if( board ){
			board.pong_board_state( socket )
			return true
		}
	}

	if( env.PRODUCTION ){  // no board was found

		return lib.return_fail_socket( socket, 'no boards online', 15000 )

	}else{ // go ahead and spoof 

		log('flag', 'spoofing non-production board')

		GAMES.chirpy = await touch_game('chirpy')
		board = await GAMES.chirpy.init_board('desert', 5, user, false )
		board.pong_board_state( socket )

	}
}


const disconnect_user = event => {
	const { socket} = event
	const user = socket?.request?.session?.USER
	if( !user ) return lib.return_fail( 'no user for socket disconnect_user', false )

	log('ARCADE', 'user logout: init ', user.handle )

	const uuid = user.uuid

	delete SOCKETS[ uuid ]
	delete USERS[ uuid ]

	setTimeout(() => {
		for( const name in GAMES ){
			GAMES[ name ].remove_user( user.uuid )
		}
		let msg = 'user logout: '
		if( !USERS[ uuid ] && !SOCKETS[ uuid ] ){
			GAMES[ name ].check_active( GAMES )
			msg += 'complete'
		}else{ // most likely a page reload or game load
			msg += 'skipping'
		}
		log('ARCADE', msg, user.handle )
	}, 3000 )
}








// ---------------------------------------------
// BROKER
// ---------------------------------------------

BROKER.subscribe('ARCADE_INIT_USER', init_user )
BROKER.subscribe('ARCADE_JOIN_GAME', join_game )
BROKER.subscribe('CHR_PONG_BOARDS', pong_game )
BROKER.subscribe('CHR_INIT_BOARD', chr_init_board )
BROKER.subscribe('CHR_PONG_BOARD', chr_pong_board )

BROKER.subscribe('SOCKET_DISCONNECT', disconnect_user )






// ---------------------------------------------
// export
// ---------------------------------------------

module.exports = {
	// init,
	// sweeping,
	init_user,
}