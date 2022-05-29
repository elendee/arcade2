import hal from '../../hal.js?v=24'

const acceptable_lengths = {
	week: 150, // ( 168 )
	month: 600, // ( 673 )
	year: 350, // ( 364 )
}


const process_deviations = ( histories, timespan ) => {

	if( timespan == 'day' ){
		hal('error', 'day not supported', 5 * 1000 )
		return
	}

	const deviations = {}

	let history
	for( const id in histories ){
		history = histories[ id ]
		const { from, granularity, result, success } = history
		const { data, code, message } = result
		const { prices } = data
		let low = 9999999999
		let high = 0
		let sum = 0
		for( const price of prices ){ // 0 = timestamp , 1 = price
			if( price[1] < low ) low = price[1]
			if( price[1] > high ) high = price[1]
			sum += price[1]
		}
		let avg = sum / prices.length
		// console.log( id, prices.length )
		if( prices.length < acceptable_lengths[ timespan ] ){
			console.log('skipping ' + id + ' for too short price history (' + prices.length + ')')
			low = high = avg = 0
			// continue
		}

		deviations[ id ] = {
			low: low,
			high: high,
			avg: avg,
			prices: prices,
		}

	}

	let low_deviant = 9999999
	let high_deviant = 0
	let d
	for( const id in deviations ){

		d = deviations[ id ]
		
		const magnitude = d.high - d.low
		const base = ( d.avg - d.low ) / magnitude
		const crnt = ( d.prices[ d.prices.length - 1 ][1] - d.low ) / magnitude

		// debugger

		d.base_point = base
		d.current_point = crnt
		d.deviation_point = crnt / base

		delete d.prices 

		// const high = 100 / ( d.high - d.low )
		// const low = 0
		// const avg = 100 / ( d.avg - d.low )
		// const crnt = prices[ prices.length - 1 ]

	}

	return deviations

}


const build_deviation = ( data, name ) => {

	const { low, high, avg, base_point, current_point, deviation_point } = data

	const row = document.createElement('div')
	row.classList.add('deviation-row', 'row')
	row.setAttribute('data-name', name )

	const header = document.createElement('h3')
	header.innerHTML = name

	const left = document.createElement('div')
	left.classList.add('left', 'column')

	const right = document.createElement('div')
	right.classList.add('right', 'column')
	
	row.appendChild( header )
	row.appendChild( left )
	row.appendChild( right )

	const graph = document.createElement('div')
	graph.classList.add('dev-graph')
	right.appendChild( graph )

	const low_row = document.createElement('div')
	low_row.classList.add('dev-marker', 'dev-low')
	graph.appendChild( low_row )

	const high_row = document.createElement('div')
	high_row.classList.add('dev-marker', 'dev-high')
	graph.appendChild( high_row )

	const avg_row = document.createElement('div')
	avg_row.classList.add('dev-marker', 'dev-avg')
	avg_row.style.bottom = ( ( ( avg - low ) / ( high - low ) ) * 100 ) + '%'
	graph.appendChild( avg_row )

	const current_row = document.createElement('div')
	current_row.classList.add('dev-marker', 'dev-current')
	current_row.style.bottom = ( current_point * 100 ) + '%'
	graph.appendChild( current_row )

	const hover = document.createElement('div')
	hover.classList.add('dev-hover')
	hover.appendChild(  build_hover( data ) )
	right.appendChild( hover )

	return row

}



const build_hover = data => {

	const { low, high, avg, base_point, current_point, deviation_point } = data

	const wrapper = document.createElement('div')

	const l = build_key( 'low', low )
	const h = build_key( 'high', high )
	const a = build_key( 'avg', avg )
	const cp = build_key( 'cp', current_point * ( ( high - low ) ) + low )

	wrapper.appendChild( h )
	wrapper.appendChild( a )
	wrapper.appendChild( l )
	wrapper.appendChild( cp )

	return wrapper

}



const build_key = ( type, data ) => {
	const row = document.createElement('div')
	row.classList.add('key')
	let bg_color
	switch( type ){
		case 'low':
			bg_color = '#48488f'
			break;
		case 'high':
			bg_color = 'lightblue'
			break;
		case 'avg':
			bg_color = '#9f9fe8'
			break;
		case 'cp':
			bg_color = 'orange'
			break;
		default: 
			console.log('unknown key type', type, data )
			break;
	}
	row.style.background = bg_color
	row.innerHTML = type + ': ' + data
	return row 
}




export {
	process_deviations,
	build_deviation,
}