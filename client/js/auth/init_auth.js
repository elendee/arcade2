import ui from '../ui.js?v=26'
import hal from '../hal.js?v=26'
import { Modal } from '../Modal.js?v=26'// system/ui
import fetch_wrap from '../fetch_wrap.js?v=26'



if( location.href.match(/register/)){

	const register_submit = document.querySelector('#register-form .button')
	const register_form = document.querySelector('#register-form')
	const email = document.getElementById('email')
	const pw = document.getElementById('password')
	const pw2 = document.getElementById('password2')

	register_submit.addEventListener('click', function(e){
		register().catch( err => { console.log('flag', 'error register: ', err ) } )
	})

	register_form.addEventListener('keyup', function(e){
		if( e.keyCode == 13 ){
			register().catch( err => { console.log('register err: ', err  ) } ) 
		}
	})


	const register = async() => {

		if( pw.value !== pw2.value ) {
			hal('error', 'passwords don\'t match', 1000 )
			return false
		}

		ui.spinner.show()

		const response = await fetch_wrap('/register', 'post', {
	    	email: email.value.trim(),
	    	password: pw.value.trim()
	    })

		ui.spinner.hide()

		if( response.success === true ){
			hal('success', 'success', 1000 )
			localStorage.setItem('emu-email', email.value.trim() )
			setTimeout(function(){
				location.href = '/account'
			}, 1000 )
		}else{
			hal('error', response.msg, 3000 )
		}

	}



}else if( location.href.match(/login/)){

	// github auth

	// const github = document.querySelector('#github')
	// github.addEventListener('click', e => {

	// 	// blorb
	// 	fetch_wrap('https://github.com/login/oauth/authorize', 'get')
	// 	// fetch_wrap('/oauth/github', 'get')
	// 	.then( res => {
	// 		console.log( res )
	// 	})
	// 	.catch( err => {
	// 		console.log( err )
	// 	})
	// })

	// email auth:

	const login_submit = document.querySelector('#login-form .button')
	const login_form = document.querySelector('#login-form')

	const forgot = document.querySelector('#forgot a')

	login_submit.addEventListener('click', function(e){
		login().catch( err => { console.log( 'login err: ', err  ) } ) 
	})

	login_form.addEventListener('keyup', function(e){
		if( e.keyCode == 13 ){
			login().catch( err => { console.log( 'login err: ', err  ) } ) 
		}
	})
			

	const login = async() => {

		const r = await fetch('/login', {
			method: 'post',
			headers: {
				'Content-Type': 'application/json'
			},
			body:JSON.stringify({
				email: document.getElementById('email').value.trim(),
				password: document.getElementById('password').value.trim()
			})
		})
		
		const response = await r.json()

		ui.spinner.show()

		if( response.success ){
			if( localStorage.getItem('ecc-creds')){
				location.href = '/admin'
			}else{
				location.href='/account'
			}
		}else{
			hal( 'error', response.msg, 1000 * 10 )
			ui.spinner.hide()
		}

	}


	forgot.addEventListener('click', e => {
		e.preventDefault()
		const modal = new Modal({
			type: 'forgot-pass',
		})
		const form = document.createElement('form')
		const input = document.createElement('input')
		input.type = 'email'
		input.placeholder = 'email to reset: '
		const submit = document.createElement('input')
		submit.type = 'submit'
		submit.value = 'send'
		submit.classList.add('button')

		form.appendChild( input )
		form.appendChild( submit )
		modal.content.appendChild( form )

		document.body.appendChild( modal.ele )

		form.addEventListener('submit', e => {
			e.preventDefault()
			fetch_wrap('/send_confirm', 'post', {
				email: input.value.trim(),
				reset: true,
			})
			.then( res => {
				if( res.success ){
					// hal('success', 'success', 4000 )
					window.location.assign('/await_confirm?e=' + input.value.trim() )
				}else{
					hal('error', res.msg || 'failed to send', 5000 )
					console.log( res )
				}
			})
			.catch( err => {
				hal('error', err.msg || 'failed to send', 5000 )
				console.log( err )
			})
		})
	})	


	

}
