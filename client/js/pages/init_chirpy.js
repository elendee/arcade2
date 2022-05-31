import env from '../env.js?v=30'
import WS from '../WS.js?v=30'
import BROKER from '../EventBroker.js?v=30'
import {
	pretty_pre,
	build_input,
	create,
} from '../lib.js?v=30'
import ui from '../ui.js?v=30'
import { Modal } from '../Modal.js?v=30'
import hal from '../hal.js?v=30'
import User from '../classes/User.js?v=30'
import USER from '../USER.js?v=30'
import USERS from '../registers/USERS.js?v=30'
import GLOBAL from '../GLOBAL.js?v=30'
// import chirpy_board from './chirpy_board.js?v=30'


	

const content = document.querySelector('#content')





// DOM builders








// client handlers 

const pop_option = type => {
	/*
		modal: Join or Create a board
	*/

	const modal = new Modal({
		type: type,
	})

	const header = document.createElement('h3')
	header.innerHTML = type
	modal.content.appendChild( header )

	let select

	switch( type ){

		case 'create':
			select = build_input('select', 'board type', 'type', null, {
				options: GLOBAL.CHR_BOARD_TYPES,
			})
			select.classList.add('chr-selection')
			modal.content.appendChild( select )
			const size = build_input('select', 'board size', 'size', null, {
				options: GLOBAL.CHR_BOARD_SIZES,
			})
			modal.content.appendChild( size )
			break;

		case 'join':
			// join gets its values async, also gets the 'chr-selection' class added to select
			const area = create('div', false, 'selection-area')
			modal.content.appendChild( area )
			BROKER.publish('SOCKET_SEND', {
				type: 'chr_ping_boards',
			})
			break;

		default:
			hal('error', 'invalid option type', 3000 )
			return;

	}

	const submit = document.createElement('div')
	submit.classList.add('button')
	submit.innerText = 'ok'
	submit.addEventListener('click', () => {

		const values = {}

		const modal = document.querySelector('.modal')
		if( type === 'join' ){
			values.uuid = modal.querySelector('select[name=board_join]')?.value
		}else if( type === 'create' ){
			values.type = modal.querySelector('select[name=type]')?.value
			values.size = modal.querySelector('select[name=size]')?.value
		}

		ui.spinner.show()
		setTimeout(() => {
			ui.spinner.hide() // ( lots of fail conditions will leave this hanging )
		}, 3000 )

		BROKER.publish('SOCKET_SEND', {
			type: 'chr_init_board',
			subtype: type,
			values: values,
			create: type === 'create',
		})
	})
	modal.content.appendChild( submit )

	document.body.appendChild( modal.ele )

}




















// server handlers

const got_user = event => {
	/*
		player1 initial connection with user data
	*/

	BROKER.publish('SOCKET_SEND', {
		type: 'join_game',
		name: 'chirpy',
	})
}

const handle_user = event => {
	/*
		handler for 'pong user'
		player1 WILL be included, so:
		---use uuid--- to cross reference and access USER[ _private data ] when needed
	*/
	const { user } = event

	// console.log('got user')

	if( USERS[ user.uuid ]){ // redundant sends

		USERS[ user.uuid ].hydrate( user, true )

	}else{ // standard join

		USERS[ user.uuid ] =  new User( user )

	}

}

const init_game = event => {
	const { state } = event

	// console.log('initializing game')

	hal('standard', `init ${ state.name }<br>${ pretty_pre( state ) }`, 5000 )

	show_lobby()

}


const show_lobby = () => {

	// console.log('showing lobby')

	const join = document.createElement('div')
	join.classList.add('option', 'button')
	join.innerHTML = 'join a board'
	join.addEventListener('click', () => {
		pop_option('join')
	})

	const create = document.createElement('div')
	create.classList.add('option', 'button')
	create.innerHTML = 'create a board'
	create.addEventListener('click', () => {
		pop_option('create')
	})

	content.appendChild( join )
	content.appendChild( create )

}


const handle_board_listing = event => {
	/*
		handler for Join game modal pong back
	*/

	ui.spinner.hide()

	// ( type, label, name, placeholder, data ) => {
	const { boards } = event
	const reformat = []
	let b
	for( const uuid in boards ){
		b = boards[ uuid ]
		reformat.push({
			name: b.name,
			label: b.name,
			value: b.uuid,
		})
	}
	const board_select = build_input('select', 'Chirpy boards', 'board_join', false, {
		options: reformat,
	})

	const modal = document.querySelector('.modal.join')
	if( modal ){
		modal.querySelector('.modal-content .selection-area').appendChild( board_select )
		board_select.classList.add('chr-selection')
	}

}



const handle_board = event => {
	const { subtype, user_uuid, board } = event
	// console.log('woohoo ', event )
	ui.spinner.hide()

	location.assign( '/chirpy_board/' + board.uuid )

}














// init

const socket = window.SOCKET = WS.init()




BROKER.subscribe('ARCADE_INITIALIZED_USER', got_user )
BROKER.subscribe('PONG_USER', handle_user )
BROKER.subscribe('INIT_GAME', init_game )
BROKER.subscribe('CHR_PONG_BOARDS', handle_board_listing )
BROKER.subscribe('CHR_INIT_BOARD', handle_board )