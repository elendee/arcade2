
import ui from './ui.js?v=24'
import env from './env.js?v=24'
import hal from './hal.js?v=24'
import BROKER from './EventBroker.js?v=24'
import USER from './USER.js?v=24'



let bound = 0
let packet, SOCKET 


const init = () => {

	ui.spinner.show()

	SOCKET = new WebSocket( env.WS_URL )

	SOCKET.onopen = function( event ){

		ui.spinner.hide()

		console.log('connected ws' )

	}


	SOCKET.onmessage = function( msg ){

		packet = false

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

		if( 1 && env.LOCAL && !env.LOG_WS_RECEIVE_EXCLUDES.includes( packet.type ) ){
			console.log( packet )
		}

		switch( packet.type ){

			case 'init_user':
				// console.log( packet )
				USER.hydrate( packet.user )
				if( env.LOCAL ) hal('system', `user:<br><pre>${ JSON.stringify( USER, false, 2 ) }</pre>`)
				break;

			case 'pong':
				BROKER.publish('PONG')
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


let send_packet

const send = event => {

	send_packet = event 

	if( SOCKET.readyState === 1 ) SOCKET.send( JSON.stringify( send_packet ))

}


BROKER.subscribe('SOCKET_SEND', send )

export default {
	init: init,
}

