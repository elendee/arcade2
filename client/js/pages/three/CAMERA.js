import env from '../../env.js?v=30'
import BROKER from '../../EventBroker.js?v=30'

// import GLOBAL from '../../GLOBAL.js?v=30'
import { 
	PerspectiveCamera,
	Group,
} from '/three-patch/build/three.module.js'




const camera = new PerspectiveCamera( 
	30, 
	window.innerWidth / window.innerHeight, 
	1, 
	10000,
	// GLOBAL.RENDER.VIEW 
)
// camera.position.set( 0, 300, -40 );

camera.yaw = {}

camera.fixture = new Group()

if( env.EXPOSE ){
	window.CAMERA = camera
}


// camera.setFocalLength( env.LOCAL ? 20 : 25 )
// camera.original_focal_length = camera.getFocalLength()

// camera.up = new THREE.Vector3(0, 0, 1)

// controls.maxPolarAngle = Math.PI / 1.97;
// controls.maxPolarAngle = Math.PI / 2;
// const update = event => {
// 	const { 
// 		focal_length,
// 	} = event

// 	if( focal_length ){
// 		if( focal_length == 'out' ){
// 			camera.setFocalLength( Math.max( 1, camera.getFocalLength() * .95 ) )
// 		}else if( focal_length == 'pico_out' ){
// 			camera.setFocalLength( Math.max( 10, camera.getFocalLength() * .97 ) )
// 		}else if( focal_length === 'in'){
// 			camera.setFocalLength( Math.min( 1000, camera.getFocalLength() * 1.02 ) )
// 		}else if( focal_length === 'restore' ){
// 			camera.setFocalLength( camera.original_focal_length )
// 		}else if( typeof focal_length === 'number' ){
// 			camera.setFocalLength( focal_length )
// 		}
// 	}

// }


// BROKER.subscribe('CAMERA_UPDATE', update )


export default camera

