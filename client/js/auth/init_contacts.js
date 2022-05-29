import hal from '../hal.js?v=24'
import fetch_wrap from '../fetch_wrap.js?v=24'
import ui from '../ui.js?v=24'
import {
	serialize,
	// is_valid_email,
	build_spreadsheet_row,
} from '../lib.js?v=24'


const contact_content = document.querySelector('.contact-content')
const add_contact = document.querySelector('#contacts>.button')
const contactform = document.querySelector('#contactform')
const search_bar = document.querySelector('#search-bar')
const header = document.querySelector('#header')

const is_logged = header.getAttribute('data-auth') === 'true'


const display_keys = {
	email: 'email', 
	fname: 'first name', 
	lname: 'last name', 
	phone: 'phone',
}

const all_contacts = window.all_contacts = []




// add a contact
add_contact.addEventListener('click', () => {
	contactform.classList.toggle('hidden')
})

contactform.addEventListener('submit', e => {

	e.preventDefault()

	const editing = contactform.classList.contains('editing')

	let fields = serialize( contactform )
	if( editing ) fields += '&id=' + contactform.getAttribute('data-id')

	fetch_wrap('/account_action', 'post', {
		action: 'add_contact',
		data: {
			formdata: fields,
			editing: editing,
		}
	})
	.then( res => {
		if( res && res.success ){
			hal('success', res.edited ? 'edited' : 'added', 5 * 1000 )
			setTimeout(() => {
				location.reload()
			}, 500 )
		}else{
			hal('error', res.msg || 'failed to add', 5 * 1000 )
		}
	})
	.catch( err => {
		hal('error', err.msg || 'failed to add', 5 * 1000 )
	})

})


// text search
let searching
search_bar.addEventListener('keyup', () => {
	const value = search_bar.value
	if( searching ) clearTimeout( searching )
	searching = setTimeout(() => {
		if( !value ){
			for( const entry of all_contacts ) entry.row.style.display = 'block'
			return
		}
		for( const entry of all_contacts ) entry.row.style.display = 'none'
		let regex
		ui.spinner.show()
		let count = 0
		for( const entry of all_contacts ){
			for( const key in entry.contact ){
				if( !entry.contact[ key ] || typeof String( entry.contact[ key ] ) !== 'string' ) continue
				regex = new RegExp( value, 'i' )
				if( String( entry.contact[ key ] ).match( regex ) ){
					count++
					entry.row.style.display = 'block'
				}
			}
		}
		ui.spinner.hide()
		hal('success', count  + ' results found', 5 * 1000 )
	}, 1000 )
})




// init contact listing
;(async() => {

const res = await fetch_wrap('/account_action', 'post', {
	action: 'contacts',
})

contact_content.appendChild( build_spreadsheet_row( display_keys, {
	column_count: Object.keys( display_keys ).length,
	is_header_row: true,
}))


for( const contact of res.results ){
	const row = build_spreadsheet_row( contact, {
		display_keys: Object.keys( display_keys ),
		column_count: Object.keys( display_keys ).length,
		can_edit: is_logged,
		edit_form: contactform,
		dropdown_content: (() => {
			const div = document.createElement('div')
			div.classList.add('row')
			const left = document.createElement('div')
			left.classList.add('column', 'column-2')
			let left_content = ''
			left_content = 'address:\n'
			for( let i = 0; i < 3; i++ ){
				left_content += contact['addr' + (i+1) ] ? contact['addr' + (i+1) ] + '\n' : ''
			}
			left.innerText = left_content
			const right = document.createElement('div')
			right.classList.add('column', 'column-2')
			right.innerText = 'notes:\n' + ( contact.notes || '' )
			div.appendChild( left )
			div.appendChild( right )
			return div
		})(),
		delete_button: true,
	})
	all_contacts.push({
		contact: contact, 
		row: row 
	})
	contact_content.appendChild( row )
}

})();