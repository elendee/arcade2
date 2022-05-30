import BROKER from '../../EventBroker.js?v=27'
import WS from '../../WS.js?v=27'
import BOARD from './BOARD.js?v=27'
import SCENE from '../three/SCENE.js?v=27'
import RENDERER from '../three/RENDERER.js?v=27'
import {
	init_animate,
	animate,
} from '../three/animate.js?v=27'
import CAMERA from '../three/CAMERA.js?v=27'
import * as LIGHT from '../three/LIGHT.js?v=27'

import {
	Vector3,
} from '/three-patch/build/three.module.js'


// const chirpy_board = board => {
// 	console.log( 'chirpy_board: ', board )
// }


const init_user = event => {
	// const { socket, packet } = event
	console.log( event )

	SCENE.add( BOARD.GROUND )
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