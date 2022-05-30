import WS from '../WS.js?v=25'
import BROKER from '../EventBroker.js?v=25'
import {
	pretty_pre,
} from '../lib.js?v=25'
import User from '../classes/User.js?v=25'
import USER from '../USER.js?v=25'
import USERS from '../registers/USERS.js?v=25'




const content = document.querySelector('#content')



// handlers

const got_user = event => {
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

const init_game = event => {
	const { state } = event

	hal('standard', `init ${ state.name }<br>${ pretty_pre( state ) }`, 5000 )

	show_lobby()

}


const show_lobby = () => {

	const join = document.createElement('div')
	join.classList.add('option', 'button')
	join.innerHTML = 'join a board'
	join.addEventListener('click', () => {
		hal('error', 'in development', 5 * 1000 )
	})

	const create = document.createElement('div')
	create.classList.add('option', 'button')
	create.innerHTML = 'create a board'
	create.addEventListener('click', () => {
		hal('error', 'in development', 5 * 1000 )
	})

	content.appendChild( join )
	content.appendChild( create )

}



// init

const socket = window.SOCKET = WS.init()




BROKER.subscribe('ARCADE_INITIALIZED_USER', got_user )
BROKER.subscribe('PONG_USER', handle_user )
BROKER.subscribe('INIT_GAME', init_game )