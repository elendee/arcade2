import WS from '../WS.js?v=24'
import BROKER from '../EventBroker.js?v=24'

import User from '../classes/User.js?v=24'
import USER from '../USER.js?v=24'
import USERS from '../registers/USERS.js?v=24'








// handlers

const init_game = event => {
	BROKER.publish('SOCKET_SEND', {
		type: 'join_game',
		name: 'chirpy',
	})
}

const handle_user = event => {
	/*
		player1 USER is NOT added to USERS registry.
		when player1 joins a game USERS will get a 'new User()' like everyone else.
		---use uuid--- to cross reference and access USER[ _private data ] when needed
	*/
	const { user } = event

	if( USERS[ user.uuid ]){ // redundant sends

		USERS[ user.uuid ].hydrate( user, true )

	}else{ // standard join

		USERS[ user.uuid ] =  new User( user )

	}

}




// init

const socket = window.SOCKET = WS.init()




BROKER.subscribe('ARCADE_INITIALIZED_USER', init_game )
BROKER.subscribe('PONG_USER', handle_user )