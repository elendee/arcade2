const log = require('./log.js')
const env = require('./.env.js')
const lib = require('./lib.js')
const User = require('./persistent/User.js')
const auth = require('./auth.js')
const BROKER = require('./BROKER.js')




function heartbeat(){
	// DO NOT convert to arrow function or else your sockets will silently disconnect ( no "this" )
	this.isAlive = Date.now()
	// log('flag', 'heartbeat')
}






const bind_user = async( socket ) => { // , CHAT

	// handle sessions without http requests

	let packet, USER

	USER = socket?.request?.session?.USER

	// log('flag', 'BIND: proceeding')

	socket.request.session.USER = USER = new User( USER )

	socket.on('pong', heartbeat )

	socket.isAlive = true

	socket.on('message',  ( data ) => {

		try{ 

			packet = lib.sanitize_packet( JSON.parse( data ) )

			USER = socket.request.session.USER

			// packet logger:
			// if( packet.type !== 'ping' ){
			// 	log('flag', 'packet log:', packet )
			// }

			switch( packet.type ){

				case 'ping':
					socket.send( JSON.stringify({ type: 'pong' }))
					break;

				case 'join_game':
					BROKER.publish('ARCADE_JOIN_GAME', {
						socket: socket,
						packet: packet,
					})
					break;

				case 'chr_ping_boards':
					BROKER.publish('CHR_PONG_BOARDS', {
						socket: socket,
						packet: packet,
					})
					break;

				case 'chr_init_board':
					BROKER.publish('CHR_INIT_BOARD', {
						socket: socket,
						packet: packet,
						user: USER,
					})
					break;

				case 'chr_ping_board':
					BROKER.publish('CHR_PONG_BOARD', {
						socket: socket,
						packet: packet,
						// user: USER,
					})
					break;

				// case 'chat':
				// 	CHAT.handle_chat( socket, packet, USER )
				// 	break;

				// case 'delete_chat':
				// 	CHAT.delete_chat( socket, packet, USER )
				// 	break

				// case 'dm':
				// 	CHAT.handle_dm( socket, packet, USER )
				// 	break;

				default: 
					log('flag', 'unknown packet: ', packet )
					break;

			}

		}catch( err ){
			log('flag', err)
		}

	})

	socket.on('close', e => {
		log('wss', 'socket close: native ws event:', Object.keys( e ) )
		BROKER.publish('SOCKET_DISCONNECT', {
			socket: socket,
		})
	})

	return {
		success: true,
	}

}










module.exports = {
	bind_user,
}
