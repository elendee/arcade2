import env from '../../env.js?v=28'
import GLOBAL from '../../GLOBAL.js?v=28'

import SCENE from './SCENE.js?v=28'
import RENDERER from './RENDERER.js?v=28'

import { 
	// MeshBasicMaterial, 
	// BackSide, 
	// BoxBufferGeometry,
	// // CubeGeometry, 
	// TextureLoader,
	// Mesh,

	// hdr
    ACESFilmicToneMapping,
    // UnsignedByteType,
	// LinearFilter,
	PMREMGenerator,
	CubeTextureLoader,
	sRGBEncoding,

} from '/three-patch/build/three.module.js'

// import { HDRCubeTextureLoader } from '/inc/HDRCubeTextureLoader.js?v=28';




const init_skybox = skybox_url => {

	if( 0 &&  env.LOCAL ){
		console.log('skipping skybox')
		return
	}

	const hdrImgUrls = GLOBAL.SKYBOXES[ skybox_url ]

	if( !hdrImgUrls ){
		console.log('missing urls for ' + skybox_url )
		return
	}

	let hdrCubeRenderTarget

	console.log('initting: ', skybox_url )

	let pmremGenerator
	if( env.HDR_SKYBOX ){

		RENDERER.physicallyCorrectLights = true
		RENDERER.toneMapping = ACESFilmicToneMapping;

		pmremGenerator = new PMREMGenerator( RENDERER ); 
		pmremGenerator.compileCubemapShader();
		
	}else{
		console.log('skipping hdr skybox')
	}

	const cubeMap = new CubeTextureLoader()
	.setPath('/resource/textures/skybox/' + skybox_url + '/' ) 
	.load( hdrImgUrls, () => {

		if( env.HDR_SKYBOX ){

			hdrCubeRenderTarget = pmremGenerator.fromCubemap( cubeMap );

			cubeMap.encoding = sRGBEncoding;

			// envMap = hdrCubeRenderTarget.texture

			SCENE.environment = hdrCubeRenderTarget.texture
		}

		SCENE.background = cubeMap;
		
		// envMap

	})


}


export {
	init_skybox,
}
