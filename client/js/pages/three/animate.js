import BROKER from '../../EventBroker.js?v=28'
import CAMERA from './CAMERA.js?v=28'
import RENDERER from './RENDERER.js?v=28'
import SCENE from './SCENE.js?v=28'
import {
	composeAnimate,
} from './ComposerSelectiveBloom.js?v=28'
import {
	OrbitControls,
} from '/three-patch/examples/jsm/controls/OrbitControls.js'





let controls 





let then, now, delta, delta_seconds = 0

let animate

// const stats = window.stats = new Stats()
// stats.showPanel( 0 ); // 0: fps, 1: ms, 2: mb, 3+: custom

let settings = localStorage.getItem('arc-settings') || '{}'
try{
	settings = JSON.parse( settings )
}catch(e){
	console.log('invalid settings', e )
}

const set_animate = event => {

	const settings = event 

	if( settings?.show_fps ){

		debugger

		// document.body.appendChild( stats.dom );	

		// animate = () => {

		// 	stats.begin()

		// 	now = performance.now()

		// 	delta = now - then

		// 	delta_seconds = delta / 1000

		// 	then = now 

		// 	player1_update( delta_seconds )

		// 	for( const uuid in ENTROPICS ){
		// 		ENTROPICS[ uuid ].update( delta_seconds )
		// 	}

		// 	for( const uuid in PROJECTILES ){
		// 		PROJECTILES[ uuid ].update( delta_seconds )
		// 	}

		// 	environment_update()

		// 	stats.end()

		// 	if( STATE.animating )  requestAnimationFrame( animate )

		// 	// RENDERER.render( SCENE, CAMERA )
		// 	composeAnimate()

		// }

	}else{ // ( no stats )

		// stats.end()

		// stats.dom.remove()

		animate = () => {

			now = performance.now()

			delta = now - then

			delta_seconds = delta / 1000

			then = now 

			// if( STATE.animating )  
			requestAnimationFrame( animate )

			// console.log('ya...')
			controls.update()

			RENDERER.render( SCENE, CAMERA )
			// composeAnimate()

		}

	}

}





const init_animate = () => {
	/*
		because init sequence is weird..
	*/

	controls = new OrbitControls( CAMERA, RENDERER.domElement )
	set_animate( settings )
}





BROKER.subscribe('SETTINGS_UPDATE', set_animate )




export {
	animate,
	init_animate,
}