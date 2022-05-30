import hal from '../hal.js?v=28'
import fetch_wrap from '../fetch_wrap.js?v=28'
import ui from '../ui.js?v=28'
// import {
// 	serialize,
// 	is_valid_email,
// 	build_spreadsheet_row,
// } from '../lib.js?v=28'

// const form = document.querySelector('#reset-form')
// const reset = document.querySelector('#reset-pass')

const content = document.querySelector('#content')
const FIELD_MAP = {
	_email: 'text',
	handle: 'text',
	color: 'color',
	_password: 'text',
	// email: 'text',
}
const ALLOWED_TYPES = ['text', 'password', 'email', 'checkbox', 'color']
const NO_SHOWS = ['_password']
const NO_EDITS = ['_email']

content.classList.add('arc-contain')

const big_wrapper = document.createElement('div')
big_wrapper.classList.add('form-wrapper', 'arc-constrain')
content.appendChild( big_wrapper )


const build_field_setter = ( type, field, data, trigger_text ) => {

	data = data || {}

	const form = build_form( type, field )

	const the_input = form.querySelector('input')

	if( !NO_SHOWS.includes( field )){
		the_input.value = data[ field ]
		// const value = document.createElement('div')
		// value.classList.add('field-value')
		// value.innerHTML = data[ field ]
		// form.prepend( value )		
	}
	const label = document.createElement('label')
	label.innerHTML = field.replace('_', '')
	form.prepend( label )

	form.onsubmit = e => {

		e.preventDefault()

		ui.spinner.show()

		fetch_wrap('/account_action', 'post', {
			action: 'set_field',
			data: {
				field: field,
				value: ( the_input.type === 'checkbox' ? the_input.checked : the_input.value ),
			}
		})
		.then( res => {

			if( field === '_password') the_input.value = ''
			
			if( res?.success ){
				// form.style.display = 'none'
				// reset.classList.remove('hidden')
				hal('success', 'success', 3000)
			}else{
				hal('error', res?.msg || 'failed to set', 10 * 1000 )
			}
			ui.spinner.hide()
		})
		.catch( err => {
			console.log( err )
			hal('error', 'error', 10 * 1000)
			ui.spinner.hide()
		})

	}

	return form

}


const build_form = ( type, field ) => {
	const no_edit = NO_EDITS.includes( field )
	if( !ALLOWED_TYPES.includes( type ) ) throw new Error('unhandled form type')
	const form = document.createElement('form')
	const input = document.createElement('input')
	input.classList.add('input')
	input.placeholder = ( field || 'enter value here' ).replace('_', '')
	input.type = type
	if( no_edit ) input.setAttribute('disabled', true)
	form.appendChild( input )
	if( !no_edit ){
		const submit = document.createElement('input')
		submit.type = 'submit'
		// submit.classList.add('button')
		submit.value = 'update'
		form.appendChild( submit )		
	}
	return form 
}

const build_button = text => {
	const btn = document.createElement('div')
	btn.classList.add('button')
	btn.innerHTML = text
	return btn
}


const build_user_form = user => {

	const wrapper = document.createElement('div')
	wrapper.classList.add('user-form')

	for( const field in FIELD_MAP ){
		if( !user[ field ] ) continue
		big_wrapper.appendChild( build_field_setter( FIELD_MAP[ field ], field, user ))
	}

	return wrapper

}





// init

fetch_wrap('/account_action', 'post', {
	action: 'get_account',
})
.then( res => {
	console.log( res )
	if( !res?.success ){
		hal('error', res?.msg || 'failed to get account', 5000)
		return
	}
	big_wrapper.appendChild( build_user_form( res.user ) )
})

