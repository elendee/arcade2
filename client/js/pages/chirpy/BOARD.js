import env from '../../env.js?v=28'
import {
	Group,
	Vector3,
	PlaneGeometry,
	MeshLambertMaterial,
	Mesh,
	DoubleSide,
} from '/three-patch/build/three.module.js'
import SCENE from '../three/SCENE.js?v=28'






const BOARD = {
	GROUP: new Group(),
	tiles: {},
	hydrate: data => {
		BOARD.type = data.type
	}
}
if( env.EXPOSE ) window.BOARD = BOARD

const tile_geo = new PlaneGeometry(1,1,1)
const tile_mats = {
	desert: new MeshLambertMaterial({
		color: 'blue',
	}),
}
for( const type in tile_mats ){ tile_mats[ type ].side = DoubleSide }










class Tile {
	constructor( init ){
		this.GROUP = init.GROUP || new Group()
		const mat = tile_mats[ init.type ]
		this.MODEL = init.MODEL || new Mesh( tile_geo, mat )
		this.GROUP.add( this.MODEL )
		this.MODEL.rotation.x = -Math.PI / 2
		this.scale = init.scale || 1
		this.uuid = init.uuid
		this.x = init.x
		this.z = init.z
	}
	render(){
		this.MODEL.scale.multiplyScalar( this.scale )
	}
}










const SCALAR = 10

// tile CRUD

const remove_tile = tile => {
	SCENE.remove( BOARD.tiles[ tile.uuid ] )
	delete BOARD.tiles[ tile.uuid ]
}

const add_tile = tile_data => {
	tile_data.type = BOARD.type
	tile_data.scale = SCALAR * .95
	const t = new Tile( tile_data )
	t.render()
	SCENE.add( t.GROUP )
	t.GROUP.position.set( tile_data.x * SCALAR, 0, tile_data.z * SCALAR )
	BOARD.tiles[ t.uuid ] = t
	// debugger
}

const update_tile = ( existing, newtile ) => {
	console.log('update tile..')
}









// ------------
// listeners
// ------------

const update_board = event => {
	const { board } = event

	BOARD.hydrate( board )

	// add and update new data
	let t, tile
	// for( const tile of board.tiles ){
	for( let x = 0; x < board.tiles.length; x++ ){
		for( let z = 0; z < board.tiles.length; z++ ){
			tile= board.tiles[x][z]
			t = BOARD.tiles[ tile.uuid ]
			if( !t ){
				add_tile( tile )
			}else{
				if( tile.last_updated !== t.last_updated ){
					update_tile( t, tile )
				}
			}
		}
	}

	// clear existing unused
	for( const uuid in BOARD.tiles ){
		tile = BOARD.tiles[ uuid ]
		let found = false
		for( let x = 0; x < board.tiles.length; x++ ){
			for( let z = 0; z < board.tiles.length; z++ ){
				if( board.tiles[x][z].uuid === tile.uuid ){
					found = true
					break;
				}
			}
		}
		if( !found ) remove_tile( tile )
	}

	if( !BOARD.GROUP.parent ) SCENE.add( BOARD.GROUP )

}





BROKER.subscribe('CHR_PONG_BOARD', update_board )


export default BOARD