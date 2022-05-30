import env from '../../env.js?v=30'
import GLOBAL from '../../GLOBAL.js?v=30'
import { 
	Scene, 
	Color, 
	AxesHelper,
} from '/three-patch/build/three.module.js'


const scene = new Scene()

if( env.EXPOSE ) window.SCENE = scene

if( env.AXES ){
	let axesHelper = new AxesHelper( 5 )
	scene.add( axesHelper )
}

// scene.needs_render = false

export default scene

