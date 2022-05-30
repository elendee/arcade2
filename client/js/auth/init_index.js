import env from '../env.js?v=27'
import * as lib from '../lib.js?v=27'
import ui from '../ui.js?v=27'
import hal from '../hal.js?v=27'
import fetch_wrap from '../fetch_wrap.js?v=27'




let credstorage = localStorage.getItem('emu-creds')
if( credstorage ){
	try{ 
		credstorage = JSON.parse( credstorage )

		const admin_login = document.createElement('div')
		admin_login.innerText = 'admin'
		admin_login.classList.add('local-login', 'admin')

		const dev_login = document.createElement('div')
		dev_login.innerText = 'dev'
		dev_login.classList.add('local-login')

		document.body.appendChild( admin_login )
		document.body.appendChild( dev_login )

		admin_login.addEventListener('click', () => {
			login( credstorage.admin.email, credstorage.admin.password, 'admin' )
		})
		dev_login.addEventListener('click', () => {
			login( credstorage.standard.email, credstorage.standard.password, 'standard' )
		})
	}catch( e ){
		console.log( e )
	}
}




const login = async( email, password, type ) => {

	const response = await fetch_wrap('/login', 'post', {
		email: email || document.getElementById('email').value.trim(),
		password: password || document.getElementById('password').value.trim(),
	})
	
	ui.spinner.show()

	if( response.success ){

		const emu_bounce = localStorage.getItem('emu-bounce')
		if( emu_bounce ){
			location.href = emu_bounce
		}

		setTimeout(function(){
			if( type  === 'admin' ){
				location.href = '/admin'
			}else{
				location.href='/account'
			}
		}, 500)
	}else{
		ui.spinner.hide()

		hal('error', response && response.msg ? response.msg : 'error logging in', 10 * 1000 )
	}

}