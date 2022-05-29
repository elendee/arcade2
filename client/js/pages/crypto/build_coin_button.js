import hal from '../../hal.js?v=24'
import render_coin_result from './render_coin_result.js?v=24'
import fetch_wrap from '../../fetch_wrap.js?v=24'
import {
	COINLIST,
	MAPS,
} from '../../lib.js?v=24'


export default ( coin, result_areas, user_coin ) => {

	const {
		symbol,
		cg_id,
		subtype,
		name,
		created,
		edited,
		id,
		_id,
	} = coin

	// const coin = COINLIST.get('symbol', symbol)
	// if( !coin ){
	// 	hal('error', 'coin not found', 3 * 1000 )
	// 	return 
	// }

	const btn = document.createElement('div')
	btn.innerHTML = symbol // + '<img src="' + coin.image + '">'
	btn.title = name // + ' ' + id
	btn.classList.add('button', 'coin-button')
	btn.addEventListener('click', async( e ) => {

		const timespan = localStorage.getItem('emu-time-window')
		const action = MAPS.actions[ timespan ] // 'symbol_current' etc...

		// iterate here , prevent doubles
		for( const row of content.querySelectorAll('.result-area[data-timespan="' + timespan + '"] .row') ){
			if( row.getAttribute('data-symbol') === symbol ){
				hal('error', 'already selected ' + symbol, 3 * 1000 )
				return
			}
		}

		// fetch data
		const res = await fetch_wrap('/action', 'post', {
			action: action,
			data: {
				id: id, // coin.
				timespan: timespan,
			}
		})
		// err handle
		if( !res || !res.success ){
			hal('error', res ? res.msg : undefined || 'error fetching symbol', 5 * 1000 )
			console.log( res )
			return
		}

		// build DOM row
		const { row, img } = render_coin_result.row( symbol )
		result_areas[ timespan ].prepend( row )

		// const row_again = 

		await render_coin_result.data( row, img, timespan, coin, res ) 


		// what to return here.......


	})

	if( user_coin ){
		const remove = document.createElement('button')
		remove.classList.add('button', 'remove-button')
		remove.innerHTML = '&times;'
		remove.addEventListener('click', e => {
			// e.preventDefault()
			e.stopPropagation()

			if( confirm('remove ' + symbol + '?')){
				fetch_wrap('/action', 'post', {
					action: 'remove_watch',
					data: {
						cg_id: id, // coin
					}
				})
				.then( res => {
					if( res && res.success ){
						hal('success', symbol + ' removed', 3 * 1000 )
						btn.remove()
					}else{
						hal('error', res.msg || 'err removing', 5 * 1000 )
					}
				})
			}
		})
		btn.appendChild( remove )
	}

	return btn

}
