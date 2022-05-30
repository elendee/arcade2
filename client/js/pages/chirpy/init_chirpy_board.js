import BROKER from '../../EventBroker.js?v=28'
import WS from '../../WS.js?v=28'
import SCENE from '../three/SCENE.js?v=28'
import RENDERER from '../three/RENDERER.js?v=28'
import {
	init_animate,
	animate,
} from '../three/animate.js?v=28'
import CAMERA from '../three/CAMERA.js?v=28'
import * as LIGHT from '../three/LIGHT.js?v=28'
import {
	Vector3,
} from '/three-patch/build/three.module.js'

import BOARD from './BOARD.js?v=28'



// const chirpy_board = board => {
// 	console.log( 'chirpy_board: ', board )
// }


const init_user = event => {
	// const { socket, packet } = event
	console.log( event )

	SCENE.add( BOARD.GROUP )
	SCENE.add( CAMERA )
	SCENE.add( LIGHT.hemispherical )

	CAMERA.position.set(50, 50, 50)
	CAMERA.lookAt( new Vector3(0,0,0) )

	init_animate()

	animate()

	BROKER.publish('SOCKET_SEND', {
		type: 'chr_ping_board'
	})

}


const remove_user = event => {
	const { game, user_uuid } = event
	console.log('unhandled remove', 'event ')
}







// init

const socket = window.SOCKET = WS.init()








BROKER.subscribe('ARCADE_INITIALIZED_USER', init_user )
BROKER.subscribe('ARCADE_REMOVE_USER', remove_user )

// export default {}