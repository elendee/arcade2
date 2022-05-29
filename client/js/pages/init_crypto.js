// import ui from '../ui.js?v=24'
// import env from '../env.js?v=24'
// import * as lib from '../lib.js?v=24'
// import { Modal } from '../Modal.js?v=24'

import hal from '../hal.js?v=24'
import fetch_wrap from '../fetch_wrap.js?v=24'
import coin_selector from './crypto/coin_selector.js?v=24'
import build_coin_button from './crypto/build_coin_button.js?v=24'
import { 
	process_deviations,
	build_deviation,
}from './crypto/process_deviations.js?v=24'
import {
	MAPS,
	COINLIST,
	coin_holding_form,
} from '../lib.js?v=24'




const is_logged = document.querySelector('#header').getAttribute('data-auth') === 'true'

const standard_coins = ['bitcoin', 'litecoin', 'ethereum'] 
// 'matic', 'qnt', 'axs', 'poly', 'auction'


const result_areas = {
	day: document.createElement('div'),
	week: document.createElement('div'),
	month: document.createElement('div'),
	year: document.createElement('div'),
}








// extract DOM

const header = document.querySelector('#header')
const content = document.querySelector('#content')







// build DOM

const build_search_span_button = type => {

	const button = document.createElement('div')
	button.classList.add('button', 'listing-span')
	button.setAttribute('data-span', type )
	button.innerHTML = type
	button.addEventListener('click', () => {
		
		localStorage.setItem('emu-time-window', type )

		for( const btn of document.querySelectorAll('.listing-span')){
			btn.classList.remove('selected')
		}
		button.classList.add('selected')

		for( const key in result_areas ){
			result_areas[ key ].classList.add('hidden')
		}
		result_areas[ type ].classList.remove('hidden')

		hal('success', 'viewing ' + MAPS.timespans[ type ] + ' results', 3 * 1000 )

	})

	return button

}

// build search types
const search_type_chooser = document.createElement('div')
search_type_chooser.appendChild( build_search_span_button('day') )
search_type_chooser.appendChild( build_search_span_button('week') )
search_type_chooser.appendChild( build_search_span_button('month') )
search_type_chooser.appendChild( build_search_span_button('year') )

const button_area = document.createElement('div')
content.appendChild( search_type_chooser )
content.appendChild( button_area )

// build // add result areas
for( const key in result_areas ){
	result_areas[ key ].classList.add('result-area')
	result_areas[ key ].classList.add('hidden')
	result_areas[ key ].setAttribute('data-timespan', key )
	content.appendChild( result_areas[ key ] )
}
















// init 

;(async() => {	

	let user_watch
	if( header.getAttribute('data-auth') === 'true' ){
		user_watch = await fetch_wrap('/data/watch', 'get')
		// console.log( user_watch )
	}

	const res = await fetch_wrap( 'https://api.coingecko.com/api/v3/coins/list', 'get' )

	COINLIST.coins = res

	// new coin button
	const add_coin = document.createElement('div')
	add_coin.classList.add('button')
	add_coin.id = 'add-coin'
	add_coin.innerHTML = '+'
	add_coin.addEventListener('click', () => {
		coin_selector.pop( result_areas, button_area )
	})
	button_area.prepend( add_coin )

	let coin, btn

	// standard coins
	let i = 0
	for( const id of standard_coins ){
		coin = COINLIST.get( 'id', id )
		if( !coin ) continue
		btn = build_coin_button( coin, result_areas, false )
		button_area.appendChild( btn )
		if( i == standard_coins.length-1 ) btn.classList.add('coin-divide')
		i++
	}

	// user coins
	const user_coins = []
	if( user_watch ){
		for( const res of user_watch.results ){
			coin = COINLIST.get('id', res.coins.cg_id )
			user_coins.push( coin )
			btn = build_coin_button( coin, result_areas, true )
			button_area.appendChild( btn )
		}
	}

	// localStorage timespan init
	const timespan = localStorage.getItem('emu-time-window') || 'day'
	for( const btn of document.querySelectorAll('.listing-span')){
		if( btn.getAttribute('data-span') === timespan ) btn.click()
	}


	// Biggest Deviators

	if( user_coins.length ){

		// button
		const load_deviators = document.createElement('div')
		load_deviators.classList.add("button")
		load_deviators.innerHTML = 'biggest deviators'

		// output area
		const deviators_results = document.createElement('div')
		deviators_results.id = 'deviators-results'

		content.appendChild( load_deviators )
		content.appendChild( deviators_results )

		// hold pending promises
		let deviation_results = {}
		// 
		load_deviators.addEventListener('click', async() => {
			console.log( user_watch )
			const timespan = document.querySelector('.listing-span.selected').getAttribute('data-span')
			if( typeof timespan !== 'string' ){
				console.log('invalid timespan: ', timespan )
				return
			}
			if( deviation_results[ timespan ]){
				hal('error', 'already loaded ' + timespan )
				return
			}
			deviators_results.innerHTML = ''
			deviation_results[ timespan ] = true
			// console.log( user_coins )
			const fetches = {}
			for( const coin of user_coins ){
				fetches[ coin.id ] = 'awaiting'
			}
			const scope_coin = {}
			for( const coin of user_coins ){

				scope_coin[ coin.id ] = coin

				fetch_wrap('/action', 'post', {
					action: MAPS.actions[ timespan ],
					data: {
						id: coin.id, // coin.
						timespan: timespan,
					}
				})
				.then( res => {
					fetches[ coin.id ] = res
					let done = true
					for( const id in fetches ){
						if( fetches[id] === 'awaiting' ) done = false
					}
					if( done ){
						const deviations = process_deviations( fetches, timespan )
						const dev_rows = []
						for( const coin_name in deviations ){

							const dev = build_deviation( deviations[ coin_name ], coin_name )
							deviators_results.appendChild( dev )

							const obj = {
								ele: dev,
								usd: undefined,
							}
							dev_rows.push( obj )

							coin_holding_form( scope_coin[ coin_name ], is_logged )
							.then( res => {
								const { element, usd } = res

								obj.usd = Number( usd || 0 )

								dev.querySelector('.left').appendChild( element )

								scope_coin[ coin_name ].dev_rcvd = true

								let all_devs = true
								for( const key in scope_coin ){
									if( !scope_coin[ key ].dev_rcvd ){
										all_devs = false
									}
								}
								if( all_devs ){

									console.log('usd pre: ', dev_rows.map( ele => { return ele.usd }))

									dev_rows.sort(( x, y ) => {
										return y.usd - x.usd
									})

									console.log('usd post: ', dev_rows.map( ele => { return ele.usd }))


									for( const obj of dev_rows ){
										deviators_results.appendChild( obj.ele )
									}

								}
								// console.log( Object.keys( scope_coin ) )
								// console.log('-----')
								// for( const name in scope_coin ){
								// 	console.log( name + ': ' + scope_coin[ name ].dev_rcvd )
								// }
								// console.log('*****')

							})
							.catch( err => {
								console.log( err )
							})

						}
					}
				})
				.catch( err => {
					fetches[ coin.id ] = {}
					console.log( err )
				})
			}


		})
	}

	hal('success', 'woot', 500 )

})();
