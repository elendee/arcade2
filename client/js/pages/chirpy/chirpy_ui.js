import BROKER from '../../EventBroker.js?v=30'
import {
	create,
} from '../../lib.js?v=30'
import STATE from './STATE.js?v=30'



// builders

const btn = text => {
	const wrapper = create('div', false, 'button')
	wrapper.innerText = text
	return wrapper
}

const build_player = user => {
	const wrapper = create('div', false, 'player')
	wrapper.innerText = user.handle 
	return wrapper
}





// init

const status = create('div', true, 'player-status' )
document.body.appendChild( status )
const header = create('div', false, 'header')
header.innerText = 'players:'
status.appendChild( header )
const listing = create('div', false, 'player-listing')
status.appendChild( listing )

const p1ready = btn('ready')
p1ready.id = 'p1ready'
p1ready.addEventListener('click', () => {
	if( !STATE.begun ){
		return hal('error', 'game has not started yet!<br>use this to end each of your turns', 3000)
	}
	BROKER.publish('SOCKET_SEND', {
		type: 'chr_p1ready'
	})
	p1ready.classList.add('disabled')
})
document.body.appendChild( p1ready )





// handlers

const pong_user = event => {
	const { user } = event

	let entry = listing.querySelector('.player[data-uuid="' + user.uuid + '"]')
	if( !entry ){
		entry = build_player( user )
		listing.appendChild( entry )
	}

	// set any more data on player button....

}







BROKER.subscribe('CHR_PONG_USER', pong_user )


export default {}