
import env from '../../env.js?v=24'
import hal from '../../hal.js?v=24'
import STATE from '../../STATE.js?v=24'
import fetch_wrap from '../../fetch_wrap.js?v=24'
import * as lib from '../../lib.js?v=24'
import {
	DataPoint,
} from './lib.js?v=24'


const content = document.querySelector('#content')
let content_width = content.getBoundingClientRect().width

export default async( container_column, symbol, from_unix, granularity, data ) => {

	// console.log( symbol, from_unix, granularity, data )

	if( !lib.is_unix_timestamp( from_unix ) ){
		hal('error', 'invalid "from" date for ' + symbol + ': ' + from_unix )
		return
	}

	const canvas = document.createElement('canvas')
	canvas.id = 'coin-graph-' + symbol

	container_column.appendChild( canvas )

	const fCanvas = await new Promise( resolve => {
		setTimeout(() => { // fabric needs canvas ^^ to be in DOM; hasn't been initialized / synced yet
			resolve( init_graph( container_column, symbol, from_unix, granularity, data ) )
		}, 300 )
	})

	return fCanvas

}





const tool_tip = document.createElement('div')
tool_tip.id = 'mouse-tooltip'
tool_tip.classList.add('hidden')
tool_tip.innerHTML = ''
document.body.appendChild( tool_tip )





const init_graph = ( container_column, symbol, from_unix, granularity, data ) => {

	const fCanvas = new fabric.Canvas('coin-graph-' + symbol, {
 		// renderOnAddition: true,
 		renderOnAddRemove: false, // performance gains; many functions need this though
 		preserveObjectStacking: true,
 		// width: 500,
 		// isDrawingMode: true
 	}) 

 	if( !window.fCanvas ) window.fCanvas = fCanvas

	// just a 2nd canvas example:
 	// CANVAS.temp_canvas = new fabric.Canvas('temp-canvas', {
 	// 	// renderOnAddition: true,
 	// 	renderOnAddRemove: false, // performance gains; many functions need this though
 	// 	preserveObjectStacking: true
 	// 	// isDrawingMode: true
 	// }) 

 	// fCanvas.freeDrawingBrush.width = CANVAS.settings.brush.width 
	// fCanvas.freeDrawingCursor = 'url("/static/media/icons/pencil7.png") 2 32, auto'

	fCanvas.on({
		// primary
		'object:modified': objModified,  // socket event
		'object:added': objAdded,  // socket event
		'object:removed': objRemoved, // socket event

		// 'object:rotating': cnvSetRotate, // socket mod
		// 'object:moving': cnvSetMove, // socket mod
		// 'object:scaling': cnvSetScale, // socket mod

		'selection:created' : selectionCreated, 
		'selection:updated' : selectionUpdated, 
		'selection:cleared' : selectionCleared, 
		'text:editing:entered' : text_listener_on,
		'text:editing:exited' : text_listener_off ,
		'mouse:over': canvas_hover,
		'mouse:out': canvas_out,
		'mouse:up': canvas_mouseup,
	})

	fCanvas.requestRenderAll()

	fCanvas.fit_canvas = () => {
		const width = container_column.getBoundingClientRect().width
		fCanvas.setWidth( width );
		fCanvas.setHeight( 300 ); // parentElement.getBoundingClientRect().height
		fCanvas.calcOffset();
	}

	fCanvas.fit_canvas() // > .canvas-container > parent

	render_prices( fCanvas, data.prices, granularity, from_unix )

	return fCanvas

}




const render_prices = ( fCanvas, prices, granularity, from_unix ) => {

	// prices = [ js_timestamp, price ]

	const point_width = fCanvas.width / prices.length

	let min = 999999999
	let max = 0
	for( const price of prices ){
		if( typeof price[1] !== 'number' ) continue
		if( price[1] < min ) min = price[1]
		if( price[1] > max ) max = price[1]
	}

	let x = 0
	let y = 0
	const range = max - min

	for( const price of prices ){

		if( typeof price[1] !== 'number' ) continue

		y = ( ( price[1] - min ) / range ) * fCanvas.height

		const point = DataPoint( new fabric.Circle({
			radius: Math.max( 2, Math.min( 5, point_width * 3 ) ),
			fill: 'grey',
			top: fCanvas.height - y,
			left: point_width * x,
			originX: 'center',
			originY: 'center',
			selectable: env.LOCAL,
		}), { // myProps
			hover: `<b>${ price[1] }</b><br><span style='color: blue;'>${ new Date( price[0] ).toLocaleDateString() }</span> ${ new Date( price[0] ).toLocaleTimeString() }`,
			initial_fill: undefined,
			timestamp: price[0], // blorb
			price: price[1],
		})

		x++
		fCanvas.add( point )

	}

	fCanvas.requestRenderAll()

}




// let blocking_hover = false

const canvas_hover = event => {
	const fabricObj = event.target
	if( fabricObj ){
		tool_tip.innerHTML = fabricObj.myProps.hover
		if( STATE.trade ){
			tool_tip.innerHTML += '<br><div class="clarification"><b>click</b> to mark purchase<br><b>shift + click</b> to mark sell</div>'
			STATE.trade.timestamp = fabricObj.myProps.timestamp // also denotes there is a valid node for save
			STATE.trade.price = fabricObj.myProps.price // also denotes there is a valid node for save
		}
		document.addEventListener('mousemove', move_hover )
		tool_tip.classList.remove('hidden')
		fabricObj.myProps.initial_scale = fabricObj.scaleX

		switch(fabricObj.myProps.type){
			case 'datapoint':
				fabricObj.myProps.initial_fill = fabricObj.get('fill')
				fabricObj.set('fill', 'salmon')
				fabricObj.scaleX = fabricObj.scaleY = 1.5
				break;

			case 'transaction':
				fabricObj.getObjects().forEach( obj => {
					if( obj.type ==='circle'){
						fabricObj.myProps.initial_fill = obj.get('fill')
						obj.set('fill', fabricObj.myProps.transaction.buy ? 'orange' : 'yellow' )
					}
				})
				break;

			default: 
				console.log('unknown hover: ', fabricObj.myProps.type )
				break;
		}

		fabricObj.bringToFront()
		fCanvas.requestRenderAll()

	}

}




const canvas_out = event => {
	// console.log( 'c out', event )
	// return

	tool_tip.innerHTML = ''
	tool_tip.classList.add('hidden')

	document.removeEventListener('mousemove', move_hover )

	const t = event.target

	if( t ){
		switch(t.myProps.type){
			case 'datapoint':
				t.scaleX = t.scaleX = t.myProps.initial_scale
				t.set('fill', t.myProps.initial_fill)
				break;

			case 'transaction':
				t.getObjects().forEach( obj => {
					if( obj.type === 'circle' ){
						obj.set('fill', t.myProps.initial_fill )
					}
				})
				break;

			default: 
				console.log('unknown hover: ', t.myProps.type )
				break;
		}
		fCanvas.requestRenderAll()
	}
	if( STATE.trade ) delete STATE.trade.timestamp // used ALSO as flag of whether a node is selected for save
}



const move_hover = e => {
	if( e.clientX > content_width - 200 ){
		tool_tip.style.left = ( e.clientX - 250 ) + 'px'
		tool_tip.style.top = ( e.clientY + 20 ) + 'px'
	}else{
		tool_tip.style.left = ( e.clientX + 20 ) + 'px'
		tool_tip.style.top = ( e.clientY - 20 ) + 'px'
	}
}




const canvas_mouseup = e => {
	if( e.currentTarget ){
		if( e.currentTarget.myProps.type === 'transaction' ){
			if( e.e.ctrlKey ){
				fetch_wrap('/action', 'post', {
					action: 'remove_trade',
					data: {
						transaction: e.currentTarget.myProps.transaction,
					}
				})
				.then( res => {
					if( res && res.success ){
						hal('success', 'trade removed', 2 * 1000 )
						const canvas = e.currentTarget.canvas
						canvas.remove( e.currentTarget )
						canvas.requestRenderAll()
					}else{
						hal('error', res.msg || 'failed to remove', 5 * 1000 )
					}
				})
			}
		}
	}
	// console.log( e )
}







const objModified = event => {
	console.log( 'modified: ', event )
}
const objAdded = event => {
	// console.log( 'added: ', event )
}
const objRemoved = event => {
	console.log( 'removed: ', event )
}
const selectionCreated = event => {
	console.log( 'selectionCreated', event )
}
const selectionUpdated = event => {
	console.log( 'selectionUpdated', event )
}
const selectionCleared = event => {
	console.log( 'selectionCleared', event )
}
const text_listener_on = event => {
	console.log( 'text_listener_on', event )
}
const text_listener_off = event => {
	console.log( 'text_listener_off', event )
}


window.addEventListener('resize', e => {
	content_width = content.getBoundingClientRect().width
})

