import env from './env.js?v=30'
import fetch_wrap from './fetch_wrap.js?v=30'
import hal from './hal.js?v=30'

import { 
	Object3D, 
	Vector3,
	// Quaternion,
	// Euler,
	// WireframeGeometry,
	// LineSegments,
	// Group,
	// SpriteMaterial,
	// TextureLoader,
	// Color,
} from '/node_modules/three/build/three.module.js'





Object3D.prototype.lookAwayFrom = function( target ){
	const v = new Vector3()
    v.subVectors( this.position, target.position ).add( this.position )
    source.lookAt( v )
}


const colors = {
	cred: 'rgb(255, 210, 100)',
}




function ensureHex(recvd_color){

	if(recvd_color == undefined || recvd_color == null || recvd_color == '' || recvd_color=='white'){ 
		return '#ffffff' 
	}
	if(recvd_color.match(/#/)){
		return recvd_color
	}
	if(recvd_color.length == 6 || recvd_color.length == 8){
		return '#' + recvd_color
	}
	if(recvd_color.match(/rgb/)){ // should always be hex
		var the_numbers = recvd_color.split('(')[1].split(')')[0]
		the_numbers = the_numbers.split(',')
		var b = the_numbers.map(function(x){						 
			x = parseInt(x).toString(16)	
			return (x.length==1) ? '0'+x : x 
		})
		b = b.join('')
		return b
	}else{
		return '#ffffff'
	}
	
}


function capitalize( word ){

	if( typeof( word ) !== 'string' ) return false

	let v = word.substr( 1 )

	word = word[0].toUpperCase() + v

	return word

}



function random_hex( len ){

	//	let r = '#' + Math.floor( Math.random() * 16777215 ).toString(16)
	let s = ''
	
	for( let i = 0; i < len; i++){
		s += Math.floor( Math.random() * 16 ).toString( 16 )
	}
	
	return s

}

function iso_to_ms( iso ){

	let isoTest = new RegExp( /(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))/ )

    if( isoTest.test( str ) ){
    	return new Date( iso ).getTime()
    }
    return false 

}

function ms_to_iso( ms ){

	if( typeof( ms ) !=  'number' )  return false

	return new Date( ms ).toISOString()

}


function is_valid_uuid( data ){

	if( typeof( data === 'string' ) && data.length > 10 ) return true
	return false

}


function getBaseLog(x, y) {

	return Math.log(y) / Math.log(x)

}

function scry( x, old_min, old_max, new_min, new_max ){

	const first_ratio = ( x - old_min ) / ( old_max - old_min )
	const result = ( first_ratio * ( new_max - new_min ) ) + new_min
	return result
}



const ORIGIN = window.ORIGIN =  new Vector3(0, 0, 0)






// selection.add( this.mesh )





function validate_number( ...vals ){

	for( const num of vals ){
		if( typeof num === 'number' || ( num && typeof Number( num ) === 'number' ) ) return Number( num )
	}
	return vals[ vals.length - 1 ]

}



const random_range = ( low, high, int ) => {

	if( low >= high ) return low

	return int ? Math.floor( low + ( Math.random() * ( high - low ) ) ) : low + ( Math.random() * ( high - low ) )

}

const random_entry = source => {

	if( Array.isArray( source )){
		return source[ random_range( 0, source.length - 1, true ) ]
	}else if( source && typeof source === 'object'){
		return source[ random_entry( Object.keys( source ) ) ]
	}
	return ''
}




const button = ( message, callback ) => {
	const ele = document.createElement('div')
	ele.innerHTML = message
	ele.classList.add('button')
	ele.addEventListener('click', () => {
		callback()
	})
	return ele
}






const return_fail = ( console_msg, hal_msg, hal_type ) => {
	console.log( console_msg )
	if( hal_msg ) hal( hal_type || 'error', hal_msg, 4000 )
	return false
}



const to_alphanum = ( value, loose ) => {
	if( typeof value !== 'string' ) return false
	if( loose ){
		return value.replace(/([^a-zA-Z0-9 _-|.|\n|!])/g, '')
	}else{
		return value.replace(/([^a-zA-Z0-9 _-])/g, '')
	}
}



const is_unix_timestamp = timestamp => { // returns true if correct string or number length
	if( typeof timestamp === 'number' ){
		return String( timestamp ).length === 10
	}else if( typeof timestamp === 'string' && timestamp.length === 10 && typeof Number( timestamp ) === 'number' ){
		return true
	}
	return false
}



const MAPS = {
	interest_keys24: {
		ath: 'all time high',
		current_price: 'current price',
		high_24h: '24 hour high',
		low_24h: '24 hour low',
		price_change_24h: '24 hour price change',
	},
	timespans: {
		day: 'daily',
		week: 'weekly',
		month: 'monthly',
		year: 'annual',
	},
	actions: {
		day: 'symbol_current',
		week: 'symbol_history',
		month: 'symbol_history',
		year: 'symbol_history',
	}
}


const serialize  = form => { // = window.emu_serialize
	return new URLSearchParams( new FormData( form ) ).toString()
}


const is_valid_email = email => {
	return typeof email === 'string' && email.match(/.*@..*\..*/)
}


const build_spreadsheet_column = ( innerHTML, count ) => {

	const column = document.createElement('div')
	column.classList.add('column' )
	if( count ){
		column.classList.add('column-' + count )
	}
	column.innerHTML = innerHTML
	return column

}


const build_spreadsheet_row = ( data, params ) => {

	const { 
		column_count,
		is_header_row,
		display_keys,
		dropdown_content,
		can_edit,
		edit_form,
		close,
		delete_button,
		// dropdown_assembler,
	} = params

	const row = document.createElement('div')
	row.classList.add('spreadsheet-row')
	row.setAttribute('data-id', data.id )
	if( is_header_row ){
		row.classList.add('header-row')
	}

	const keys = display_keys ? display_keys : Object.keys( data )
	if( column_count ){
		for( let i = 0; i < column_count; i++ ){
			row.appendChild( build_spreadsheet_column( data[ keys[ i ] ], column_count ) )
		}
	}else{
		for( const key of keys ){
			row.appendChild( build_spreadsheet_column( data[ key ] ) )
		}			
	}

	if( dropdown_content ){
		row.classList.add('has-dropdown')
		dropdown_content.classList.add('dropdown-content')
		row.appendChild( dropdown_content )
		row.addEventListener('click', e => {
			// if( !e.target.classList.contains('close') ){
			row.classList.add('dropped')
			// dropdown_content.classList.remove('hidden')
			// }
		})
		const close = document.createElement('div')
		close.classList.add('close', 'button')
		close.innerHTML = '&times;'
		close.addEventListener('click', e => {
			e.stopPropagation()
			row.classList.remove('dropped')
			// dropdown_content.classList.add('hidden')
		})
		dropdown_content.appendChild( close )
	}

	if( can_edit && edit_form ){
		const edit = document.createElement('div')
		edit.innerHTML = 'edit'
		edit.classList.add('button', 'edit-button')
		edit.addEventListener('click', () => {
			// console.log('repopulating edit form', edit_form )
			let has_data = false
			// console.log('with', data )
			for( const key in data ){
				for( const input of edit_form.querySelectorAll('input')){
					if( key === input.name ){
						input.value = data[ key ]
						has_data = true
					}
				}
				for( const textarea of edit_form.querySelectorAll('textarea')){
					if( key === textarea.name ){
						textarea.value = data[ key ]
						has_data = true
					}
				}
			}
			if( has_data ){
				edit_form.classList.add('editing')
				edit_form.classList.remove('hidden')
				edit_form.setAttribute('data-id', data.id )
				window.scroll( 0, ( window.pageYOffset + edit_form.getBoundingClientRect().top ) - 50 )
			}
		})
		dropdown_content.appendChild( edit )
	}

	if( delete_button ){
		const delete_contact = document.createElement('div')
		delete_contact.innerHTML = 'delete'
		delete_contact.classList.add('close', 'delete-button', 'button')
		delete_contact.addEventListener('click', () => {
			if( !confirm(('delete ' + ( data.email || 'unknown email' ) + '?' ) ) ) return
			fetch_wrap('/account_action', 'post', {
				action: 'delete_contact',
				data: {
					id: data.id,
				}
			})
			.then( res => {
				if( res && res.success ){
					hal('success', 'contact removed', 5 * 1000 )
					row.remove()
				}else{
					hal('error', res.msg || 'failed to remove contact', 10 * 1000 )
				}
			})
			.catch( err => {
				hal('error', err.msg || 'failed to remove contact', 10 * 1000 )
			})
		})
		dropdown_content.appendChild( delete_contact )
	}

	return row 

}



const COINLIST = {
	coins: [],
	get: ( type, key ) => {
		for( const coin of COINLIST.coins ){
			if( coin[ type ] === key ) return coin
		}
		return false
	}
}
if( env.EXPOSE ) window.COINLIST = COINLIST




const coin_holding_form = async( coin, is_logged ) => {

	let usd_price

	const wrapper = document.createElement('div')
	wrapper.classList.add('coin-holding-form')

	const label = document.createElement('label')
	label.innerHTML = coin.name + ' holding<br><span>(unit coin):<span>'

	const input = document.createElement('input')
	input.type = 'number'
	input.addEventListener('keyup', () => {
		if( typeof usd_price === 'number' ){
			output.innerHTML = '<span>$</span>' + ( usd_price * input.value ).toFixed(2)
		}
	})

	const output = document.createElement('div')
	output.classList.add('value-output')

	const update = document.createElement('div')
	update.classList.add('button')
	update.innerText = 'update'
	update.addEventListener('click', () => {
		fetch_wrap('/action', 'post', {
			action: 'coin_holding',
			data: {
				crud: 'update',
				cg_id: coin.id,
				amount_coin: input.value,
			}
		})
		.then( res => {
			if( res && res.success ){
				hal('success', 'coin updated', 5 * 1000 )
			}else{
				hal('error', res.msg || 'error updating', 5 * 1000 )
			}
		})
	})

	wrapper.appendChild( label )
	wrapper.appendChild( input )
	wrapper.appendChild( output )
	wrapper.appendChild( update )

	if( is_logged ){

		const res = await fetch_wrap('/action', 'post', {
			action: 'coin_holding',
			data: {
				crud: 'read',
				cg_id: coin.id,
			}
		})
		// console.log( res )
		if( res && res.success ){

			if( res.coins){
				try{
					const parsed = JSON.parse( res.coins )
					usd_price = parsed[0].current_price
				}catch(e){
					console.log( e )
				}
			}

			input.value = res.results[0] ? res.results[0].amount_coin : 0

			if( usd_price ){
				output.innerHTML = '<span>$</span>' + ( input.value * usd_price ).toFixed(2)
			}else{
				output.innerHTML = '(missing current USD price)'
			}

		}

	}

	return {
		element: wrapper,
		usd: ( input.value || 0 ) * ( usd_price || 0 ),
	}

}




const trimStrict = string => {
    // Remove leading spaces
    while(string.indexOf(' ') === 0) {
        string = string.substr(1);
    }
    // Remove trailing spaces
    while(string[string.length-1] === ' ') {
        string = string.substr(0, string.length-1);
    }
    return string;
}


let cap_store = {}
const over_cap = ( key, limit ) => {
	/*
		true = over cap
		false = still ok
	*/
	if( !cap_store[ key] ) cap_store[ key] = 0
	if( !limit ) return false
	cap_store[ key]++
	return cap_store[ key ] > limit
}


const generate_content = len => {
	len = len || 50
	const lorem = `Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.`
	return lorem.substr(0, len ) + '....'
}


const pretty_pre = content => {
	return `<pre>${ JSON.stringify( content, false, 2 ) }</pre>`
}



const build_input = ( type, label, name, placeholder, data ) => {

	const wrapper = document.createElement('div')
	wrapper.classList.add('arc-input')

	let ele

	const label_ele = document.createElement('label')
	label_ele.innerText = label
	wrapper.appendChild( label_ele )

	switch( type ){
		case 'select':
			ele = document.createElement('select')
			ele.name = name
			const starter = document.createElement('option')
			starter.innerText = '(select a value)'
			ele.appendChild( starter )
			for( const option of data.options ){
				const opt = document.createElement('option')
				opt.innerText = option.label
				opt.value = option.value
				opt.name = option.name
				ele.appendChild( opt )
			}
			break;

		default:
			ele = document.createElement('input')
			ele.type = 'text'
			ele.name = name
			ele.placeholder = placeholder
			console.log('unhandled input type', type, label, name, placeholder )
			break;
	}

	wrapper.appendChild( ele )

	return wrapper


}


const create = ( type, ...classes ) => {
	const ele = document.createElement( type )
	for( const c of classes ) ele.classList.add( classes )
	return ele
}



export {

	ensureHex,
	capitalize,
	random_hex,
	iso_to_ms,
	ms_to_iso,
	getBaseLog,
	scry,
	is_valid_uuid,
	
	validate_number,
	random_entry,
	random_range,
	ORIGIN,

	button,

	return_fail,

	to_alphanum,
	colors,

	is_unix_timestamp,

	is_valid_email,

	serialize,

	build_spreadsheet_row,
	build_spreadsheet_column,
	build_input,

	MAPS,
	COINLIST,

	coin_holding_form,	
	trimStrict,
	over_cap,
	generate_content,
	pretty_pre,

	create,
}