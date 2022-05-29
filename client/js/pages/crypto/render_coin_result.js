import env from '../../env.js?v=24'
import fetch_wrap from '../../fetch_wrap.js?v=24'
import build_graph from './build_graph.js?v=24'
import {
	MAPS,
	coin_holding_form,
} from '../../lib.js?v=24' 
import {
	render_trade,
} from './lib.js?v=24' // ( ^^ NOT the same )

import trades from './trades.js?v=24'



const header = document.querySelector('#header')
const is_logged = header.getAttribute('data-auth') === 'true' || env.LOCAL


// build result row for symbol

const row = symbol => {

	// console.log( 'coin row: ', symbol )

	// row
	const info = document.createElement('div')
	info.classList.add('info-row', 'row')
	info.setAttribute('data-symbol', symbol )

	// column elements
	const img = document.createElement('img')
	img.classList.add('ticker-image')

	// left / info
	const left = document.createElement('div')
	left.classList.add('column', 'symbol')
	left.appendChild( img )

	// right / the chart
	const right = document.createElement('div')
	right.classList.add('column', 'chart')

	info.appendChild( left )
	info.appendChild( right )

	return { row: info, img: img }

}


const data = async( row, img, timespan, coin, res ) => {

	const {
		symbol,
	} = coin

	// console.log( 'coin data: ', row, timespan, symbol, res )

	timespan = timespan || 'day'

	let data

	const left = row.querySelector('.column.symbol')
	const right = row.querySelector('.column.chart')

	const { success, result, granularity, from } = res

	try{

		const DATE = {
			unix: Number( from ),
			js: Number( from ) * 1000,
		}

		if( timespan === 'day' ){

			data = JSON.parse( result )[0]
			img.src = data.image

			for( const key in MAPS.interest_keys24 ){
				right.appendChild( render_coin_key_values( key, data, MAPS.interest_keys24[ key ] ) )
			}

			left.innerHTML = symbol + ' from yesterday'

		}else{ // building a graph

			const fCanvas = await build_graph( right, symbol, from, granularity, result.data )

			// right.appendChild( container )

			left.innerHTML = symbol + ' since ' + new Date( DATE.js ).toLocaleDateString()
			left.appendChild( trades.build_button( symbol, timespan, fCanvas ) )

			if( is_logged ){
				fetch_wrap('/action', 'post', {
					action: 'get_transactions',
					data: {
						timespan: timespan,
						symbol: symbol,
					}
				})
				.then( res => {
					// console.log( res )
					if( res && res.success ){
						for( let transact of res.results ){
							render_trade( fCanvas, transact )
						}
					}else{
						console.log( 'failed to add transactions: ', res )
					}
				})
				.catch( err => {
					console.log( 'failed to add transactions: ', err )
				})
			}

		}

		if( is_logged ){

			const { element, usd } = await coin_holding_form( coin, is_logged ) // 

			left.appendChild( element )

		}

	}catch( e ){
		row.innerHTML = 'invalid data'
		console.log( e )
	}

	return row

}










// add individual data points to rows

const render_coin_key_values = ( key, data, colloquial ) => {
	const left = document.createElement('div')
	left.classList.add('key')
	left.innerHTML = colloquial
	const right = document.createElement('div')
	right.classList.add('value')
	right.innerHTML = data[ key ]
	if( key === 'price_change_24h'){
		if( data[ key ] < 0 ){
			right.classList.add('negative')
		}else if( data[ key ] > 0 ){
			right.classList.add('positive')
		}
	}
	const row = document.createElement('div')
	row.classList.add('data-row')
	row.appendChild( left )
	row.appendChild( right )
	return row
}









export default {
	row,
	data,
}