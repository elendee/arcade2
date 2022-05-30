import ui from './ui.js?v=28'
import env from './env.js?v=28'
import hal from './hal.js?v=28'
import BROKER from './EventBroker.js?v=28'
import USER from './USER.js?v=28'
import {
	pretty_pre,
} from './lib.js?v=28'
// import USERS from './registers/USERS.js?v=28'




let packet, SOCKET 


const init = () => {

	ui.spinner.show()

	console.log('initting websocket', env.WS_URL )

	SOCKET = new WebSocket( env.WS_URL )

	SOCKET.onopen = function( event ){

		ui.spinner.hide()

		console.log('connected ws' )

	}


	SOCKET.onmessage = function( msg ){

		packet = sanitize_packet( msg )
		if( !packet ) return

		// console.log( packet )

		switch( packet.type ){

			case 'init_user':
				USER.hydrate( packet.user )
				// hal('system', `user:<br>${ pretty_pre( USER ) }`, 10 * 1000 )
				BROKER.publish('ARCADE_INITIALIZED_USER')
				break;

			case 'pong':
				BROKER.publish('PONG')
				break;

			case 'pong_user':
				BROKER.publish('PONG_USER', packet )
				break;

			case 'init_game':
				BROKER.publish('INIT_GAME', packet )
				break;

			case 'chr_pong_boards':
				BROKER.publish('CHR_PONG_BOARDS', packet )
				break;

			case 'chr_init_board':
				BROKER.publish('CHR_INIT_BOARD', packet )
				break;

			case 'chr_pong_board':
				BROKER.publish('CHR_PONG_BOARD', packet )
				break;

			case 'remove_user':
				BROKER.publish('ARCADE_REMOVE_USER', packet )
				break;
			
			// case 'chat':
			// 	BROKER.publish('ROOM_HANDLE_CHAT', packet )
			// 	break;

			// case 'dm':
			// 	BROKER.publish('ROOM_HANDLE_DM', packet )
			// 	break;

			// case 'inc_chats':
			// 	console.log('deprecated inc_chats', packet )
			// 	// BROKER.publish('ROOM_INC_CHATS', packet )
			// 	break;
				
			case 'hal':
				hal( packet.msg_type, packet.msg, packet.time || 10 * 1000 )
				// console.log( packet )
				break;

			// case 'clear_chats':
			// 	BROKER.publish('CLEAR_CATEGORY', packet )
			// 	break;

			// case 'delete_chat':
			// 	BROKER.publish('DELETE_CHAT', packet )
			// 	break;

			// case 'update_user':
			// 	BROKER.publish('UPDATE_USER', packet )
			// 	break;

			// case 'disconnect_user':
			// 	BROKER.publish('DISCONNECT_USER', packet )
			// 	break;

			// case 'reply_notice':
			// 	BROKER.publish('CHAT_REPLY_NOTICE', packet )
			// 	break;

			default: 
				console.log('unknown packet: ', packet )
				if( env.LOCAL ){
					hal('standard', `unknown packet<br>${ pretty_pre( packet ) }`, 10 * 1000 )
				}
				break
		}

	}

	SOCKET.onerror = function( data ){
		console.log('ERROR', data)
		hal('error', 'server error')
	}

	SOCKET.onclose = function( event ){
		if( !env.PRODUCTION ) console.log( 'CLOSE', event )
		hal('error', 'connection closed by server')
	}

	return SOCKET

}





// packet santizing
const sanitize_packet = msg => {

	let packet

	try{

		packet = JSON.parse( msg.data )

	}catch( e ){

		SOCKET.bad_messages++
		if( SOCKET.bad_messages > 100 ) {
			console.log('100+ faulty socket messages', msg )
			SOCKET.bad_messages = 0
		}
		console.log('failed to parse server msg: ', msg )
		return false	

	}

	if( !env.LOG_WS_RECEIVE_EXCLUDES.includes( packet.type ) ){
		console.log( packet )
	}

	return packet

}



// heartbeats
let last_ping = Date.now()
let last_ping_call = 0
let ping = () => {

	// returning idle browser tabs may fire this a ton
	if( Date.now() - last_ping_call < 100 ){ 
		hal('error', 'blocke multiple ping calls - you may need to refresh page', 5000 ) 
		return
	}

	last_ping_call = Date.now()

	// proceed with ping
	setTimeout(() => {
		if( !last_ping ){
			hal('error', 'server not responding; try refreshing page')
			return
		}
		BROKER.publish('SOCKET_SEND', {
			type: 'ping',
		})
		last_ping = false
		ping()

	}, 10 * 1000)

}
ping()

const pong = event => {
	last_ping = Date.now()
}





// send callback
let send_packet

const send = event => {

	send_packet = event 

	if( SOCKET.readyState === 1 ) SOCKET.send( JSON.stringify( send_packet ))

}


BROKER.subscribe('SOCKET_SEND', send )
BROKER.subscribe('PONG', pong )

export default {
	init: init,
}

