import hal from '../hal.js?v=25'
import ui from '../ui.js?v=25'
import fetch_wrap from '../fetch_wrap.js?v=25'

const content = document.querySelector('#content')


const form = document.createElement("form")
form.id = 'await'
form.classList.add('auth-form')
form.autocomplete = true
content.appendChild( form )


const email = document.createElement('input')
email.type = 'email'
email.name = 'email'
email.classList.add('input')
email.placeholder = 'email'
const confirm = document.createElement('input')
confirm.name = 'confirm'
confirm.type = 'text'
confirm.classList.add('input')
confirm.placeholder = 'confirmation code'
form.appendChild( email )
form.appendChild( confirm )

const br = document.createElement('br')
form.appendChild( br )

const submit = document.createElement('input')
submit.classList.add('button')
submit.type = 'submit'
submit.value = 'submit'

form.appendChild( submit )

form.onsubmit = e => {

	e.preventDefault()

	ui.spinner.show()

	fetch_wrap('/confirm_account', 'post', {
		email: email.value.trim(),
		confirm_code: confirm.value.trim(),
	})
	.then( res => {
		if( res.success ){
			location.href = '/account'
		}else{
			hal('error', res.msg || 'failed to confirm', 10 * 1000)
		}
		ui.spinner.hide()
	})
	.catch( err => {
		hal('error', 'error', 10 * 1000)
		ui.spinner.hide()
	})

}


const stored_email = localStorage.getItem('emu-email')
if( stored_email ){
	email.value = stored_email
	delete localStorage['emu-email']
}


if( location.href.match(/\?e=/) ){
	const e = location.href.substr( location.href.indexOf( location.href.match(/\?e=/) ) + 3 )
	email.value = e
}