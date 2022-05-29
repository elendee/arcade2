import env from '../../env.js?v=24'
import hal from '../../hal.js?v=24'
import STATE from '../../STATE.js?v=24'
import fetch_wrap from '../../fetch_wrap.js?v=24'
import {
	// Transaction,
	render_trade,
} from './lib.js?v=24'


const is_logged = document.querySelector('#header').getAttribute('data-auth') === 'true'

// trade button

const build_button = ( symbol, timespan, fCanvas ) => {

	const btn = document.createElement('div')
	btn.classList.add('button', 'add-trade')
	btn.innerHTML = 'add trade'
	btn.addEventListener('click', () => {
		if( !is_logged && !env.LOCAL ){
			hal('error', 'must be logged in', 5 * 1000 )
			return
		}

		if( !STATE.trade ){

			STATE.trade = {
				symbol: symbol,
				fabricCanvas: fCanvas,
				// upperCanvas: fCanvas.upperCanvasEl,
				timespan: timespan,
				btn: btn,
			}

			fCanvas.wrapperEl.classList.add('adding-trade')
			btn.classList.add('adding-trade')

			setTimeout(() => { // listener fires immediately unless delayed...

				window.addEventListener('click', handle_add_trade_click )			

			}, 50 ) 

		}

	})

	return btn

}




const handle_add_trade_click = e => {

	if( e.target.classList.contains('add-trade') && STATE.trade ){
		unset_trading(1)
		return
	}

	if( STATE.trade && STATE.trade.fabricCanvas.upperCanvasEl === e.target ){	

		if( !STATE.trade.timestamp ){
			hal('error', 'must click a trade node to save', 4 * 1000 )
			return
		}

		// const pendingTrade = {
		// 	e: e,
		// 	canvas: STATE.trade.upperCanvas,
		// }
		const pendingCanvas = STATE.trade.fabricCanvas

		const notes = prompt('Add any notes about this transaction here:')

		fetch_wrap('/action', 'post', {
			action: 'save_trade',
			data: {
				symbol: STATE.trade.symbol, // the trade
				timespan: STATE.trade.timespan, // current timespan view
				timestamp: STATE.trade.timestamp, // time in trade-units .... the trickiest bit
				price: STATE.trade.price,
				notes: notes,
				buy: !e.shiftKey, // bool 
			}
		})
		.then( res => {
			if( res && res.success ){
				hal('success', 'saved', 4 * 1000 )
				render_trade( pendingCanvas, res.transaction )
			}else{
				hal('error', res.msg || 'error saving trade', 5 * 1000 )
				console.log( res )
			}
		})
		.catch( err => {
			hal('error', err.msg || 'error saving trade', 5 * 1000 )
			console.log( err )
		})

	}

	unset_trading(2)

}



const unset_trading = source => {

	if( !STATE.trade ) return

	if( STATE.trade.fabricCanvas ){
		STATE.trade.fabricCanvas.wrapperEl.classList.remove('adding-trade')
		STATE.trade.btn.classList.remove('adding-trade')
	}
	
	window.removeEventListener('click', handle_add_trade_click )

	for( const key in STATE.trade ) delete STATE.trade[ key ]
	delete STATE.trade

}















export default {
	build_button,
}