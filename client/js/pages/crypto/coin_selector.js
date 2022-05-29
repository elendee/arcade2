import hal from '../../hal.js?v=24'
import env from '../../env.js?v=24'
import { Modal } from '../../Modal.js?v=24'
import {
	COINLIST,
} from '../../lib.js?v=24'
import fetch_wrap from '../../fetch_wrap.js?v=24'
import build_coin_button from './build_coin_button.js?v=24'


// watchlist popup..

const pop = ( result_areas, button_area ) => {

	if( !env.LOCAL && header.getAttribute('data-auth') !== 'true' ){
		hal('error', 'must be logged in to edit watchlist', 3 * 1000 )
		return
	}

	const modal = new Modal({
		type: 'add-coin',
	})
	const title = document.createElement('h4')
	title.innerHTML = 'add coin'
	modal.content.appendChild( title )

	const search = document.createElement('input')
	search.type = 'text'
	search.classList.add('emu-input')
	search.placeholder = 'start typing either symbol or name - over 10k coins available'
	let waiting = false
	search.addEventListener('keyup', e => {
		if( waiting ) clearTimeout( waiting )
		waiting = setTimeout(() => {
			render_filtered_coin_list( list, search, result_areas, button_area )
		}, 1000 )
	})
	modal.content.appendChild( search )

	const list = document.createElement('div')
	list.id = 'coin-results-list'
	modal.content.appendChild( list )

	document.body.appendChild( modal.ele )

}








// watchlist dropdown

const render_filtered_coin_list = ( list, search, result_areas, button_area ) => {

	list.innerHTML = ''

	if( !search.value || search.value.length < 3 ){
		hal('error', 'need 3 or more characters', 3 * 1000 )
		return
	}

	const results = {}
	const regex = new RegExp( search.value, 'i' )
	for( const coin of COINLIST.coins ){
		if( !results[ coin.id ] ){
			if( coin.id.match( regex ) || coin.name.match( regex ) || coin.symbol.match( regex ) ){
				results[ coin.id ] = coin
			}
		}
	}

	for( const id in results ){
		list.appendChild( build_watch_option( results[ id ], result_areas, button_area ))
	}

}







// watchlist dropdown row / result builder 

const build_watch_option = ( coin, result_areas, button_area ) => {

	const option = document.createElement('div')
	option.classList.add('watch-option')
	option.innerHTML = coin.symbol + ': ' + coin.name
	option.addEventListener('click', () => {
		const modal = document.querySelector('.modal.add-coin')
		fetch_wrap('/action', 'post', {
			action: 'save_watch',
			data: {
				cg_id: coin.id,
				name: coin.name,
				symbol: coin.symbol,
				subtype: 'gecko',
			}
		})
		.then( res => {
			if( res && res.success ){
				hal('success', 'saved', 3 * 1000 )
				const btn = build_coin_button( coin.symbol, result_areas, true )
				button_area.appendChild( btn )

			}else{
				hal('error', res.msg || 'error saving', 8 * 1000 )
				console.log( res )
			}
			if( modal ) modal.remove()
		})
		.catch( err => {
			hal('error', err.msg || 'error saving', 8 * 1000 )
			console.log( err )
			if( modal ) modal.remove()
		})
	})
	return option
}






export default {
	pop,
}