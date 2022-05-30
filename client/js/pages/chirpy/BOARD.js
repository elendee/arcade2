import env from '../../env.js?v=27'
import {
	Vector3,
	PlaneGeometry,
	MeshLambertMaterial,
	Mesh,
	DoubleSide,
} from '/three-patch/build/three.module.js'


const board = {}

const ground_mesh = new PlaneGeometry(1,1,1)
const ground_mat = new MeshLambertMaterial({
	color: 'brown',
	side: DoubleSide,
})

if( env.EXPOSE ) window.BOARD = board


board.GROUND = new Mesh( ground_mesh, ground_mat )

board.GROUND.scale.multiplyScalar( 100 )
board.GROUND.rotation.x = -Math.PI / 2





export default board