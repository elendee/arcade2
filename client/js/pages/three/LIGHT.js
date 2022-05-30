
// import GLOBAL from '../../GLOBAL.js?v=30'

import { 
	Lensflare, 
	LensflareElement 
} from '/three-patch/examples/jsm/objects/Lensflare.js?v=30'

import env from '../../env.js?v=30'

// import { removeBloom } from './ComposerSelectiveBloom.js?v=30'

import { 
	Mesh,
	DirectionalLight, 
	// DirectionalLightHelper,
	HemisphereLight,
	TextureLoader,
	SpriteMaterial,
	Sprite,
	Color,
	Group,
	Vector3,
	PlaneGeometry,
	MeshLambertMaterial,
} from '/three-patch/build/three.module.js'


const textureLoader = new TextureLoader()

// const textureFlare0 = textureLoader.load( '/resource/textures/flare.gif' ) //lensflare/lensflare0.png' )
// const sun_tex = textureLoader.load( '/resource/textures/sun.png' )


// const flare0 = textureLoader.load('/resource/textures/lensflare0.png')
// const flare1 = textureLoader.load('/resource/textures/lensflare1.png')




const offset = new Vector3( 500, 500, 500 )






class Sun {

	constructor( init ){
		
		init = init || {}

	}


	initialize( init ){

		const sun = this

		//////////////// sun / flare
		sun.color = new Color( init.color || 'rgb(255, 255, 255)' )
		sun.scale = 2000

		sun.texture = sun_tex
		sun.material = new SpriteMaterial({
			map: sun.texture,
			color: sun.color,
			// fog: false,
		})

		sun.layer1 = new Sprite( sun.material )
		sun.layer1.bloom = true
		sun.layer1.scale.set( sun.scale, sun.scale, sun.scale )

		// sun.layer2 = new Sprite( sun.material )
		// sun.layer3 = new Sprite( sun.material )
		// sun.layer2.scale.multiplyScalar( 1.1 )

		// const plane = new PlaneGeometry(1,1)
		// sun.layer1.material = 
		// const plane_mat  = new MeshLambertMaterial({
		// 	mat: sun.texture,
		// 	color: sun.color,
		// })
		// sun.layer1 = new Mesh( plane, plane_mat )
		sun.layer1.bloom = true
		// sun.scale *= 10
		sun.layer1.scale.set( sun.scale, sun.scale, sun.scale )

		sun.flares = [
			// {
			// 	texture: flare0,
			// 	size: 100,
			// 	distance: .05,
			// 	color: sun.color,
			// },
			// {
			// 	texture: flare0,
			// 	size: 70,
			// 	distance: .1,
			// 	color: sun.color,
			// },
			// {
			// 	texture: flare0,
			// 	size: 170,
			// 	distance: .15,
			// 	color: sun.color,
			// },
			// {
			// 	texture: flare1,
			// 	size: 270,
			// 	distance: .2,
			// 	color: sun.color,
			// },
			{
				texture: flare1,
				size: 70,
				distance: .25,
				color: sun.color,
			},
			// {
			// 	texture: flare0,
			// 	size: 100,
			// 	distance: .6,
			// 	color: new Color(0xccbbcc),
			// },
			{
				texture: flare1,
				size: 250,
				distance: .65,
				color: new Color(0xccaaff),
			},
		]

		if( init.is_fog ){ // use a sprite for sun when fog obscures standard mesh
			sun.flares.push({
				texture: flare1,
				size: 270,
				distance: .01,
				color: sun.color,
			})
		}

		sun.lensflare = new Lensflare()
		let element
		for( const flare of sun.flares ){
			element = new LensflareElement( flare.texture, flare.size, flare.distance, flare.color )
			// removeBloom( element )
			// console.log( element )
			sun.lensflare.addElement( element )
		}

		sun.ele = new Group()
		sun.ele.type = 'sun'
		sun.ele.add( sun.layer1 )
		// sun.ele.add( sun.layer2 )

		sun.ele.userData.type = 'sun'

		sun.ele.add( sun.lensflare )

		// sun.ele.add( sun.layer3 )
		// sun.ele.add( sun.directional )

		// sun.ele.position.copy( offset ).multiplyScalar( 10 )

		//////////////// Light

		sun.directional = new DirectionalLight( sun.color, 1 )

		sun.directional.position.copy( offset )
		sun.directional.castShadow = true
		sun.directional.shadow.camera.near = 10;
		sun.directional.shadow.camera.far = 30200;

		// bounds
		sun.directional.shadow.camera.left = -500;
		sun.directional.shadow.camera.right = 500;
		sun.directional.shadow.camera.top = 500;
		sun.directional.shadow.camera.bottom = -500;
		// resolution
		sun.directional.shadow.mapSize.width = 2000;
		sun.directional.shadow.mapSize.height = 2000;
		sun.directional.intensity = init.intensity || 1

		this.tracking = false
	}



	hydrate( init ){

		init = init || {}

		// console.log( init )

		this.color = new Color( init.color || 'rgb(255, 255, 255)')
		this.material.color = this.color

		// (linked)
		this.directional.intensity = ( init.sun_scale || 1 ) * 3
		this.ele.scale.multiplyScalar( init.sun_scale || 2 )
		
	}




	track( object3d, state ){ 

		const directional = this.directional

		if( state ){

			this.tracking = setInterval( () => {

				directional.position.copy( object3d.position ).add( offset ) // .multiplyScalar( -30 )
				directional.target.position.copy( directional.position ).sub( offset )

			}, 2000 )

		}else{

			clearInterval( this.tracking )
			this.tracking = false

		}

	}




}

// const SUN = new Sun()

// PointLight
// color - (optional) hexadecimal color of the light. Default is 0xffffff (white).
// intensity - (optional) numeric value of the light's strength/intensity. Default is 1.
// distance - Maximum range of the light. Default is 0 (no limit).
// decay - The amount the light dims along the distance of the light. Default is 1. For physically correct lighting, set this to 2.

const hemispherical = new HemisphereLight( 0x5599cc, 0xffffff, 1 )

if( env.EXPOSE ){
	window.LIGHT = {
		hemispherical: hemispherical,
		// SUN: SUN,
	}
}

export { 
	hemispherical,
	// SUN,
}