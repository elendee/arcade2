const env = require('./.env.js')

const bcrypt = require('bcryptjs')

const date = require('./date.js')

const log = require('./log.js')
const lib = require('./lib.js')

const mail = require('./mail.js')

const DB = require('./db.js')

const SALT_ROUNDS = 10

const User = require('./persistent/User.js')








const compare_pw = ( password, hash_pw ) => {

	return new Promise((resolve, reject) => {

		bcrypt.compare( password, hash_pw )
		.then( bcrypt_boolean => {
			if( bcrypt_boolean ){
				resolve({
					success: true,
					msg: 'congrats' // user
				})
			}else{
				resolve({
					success: false,
					msg: 'incorrect password'
				})
			}
		}).catch( err => {
			log('flag', 'bcrypt error: ', err )
			resolve({
				success: false,
				msg: 'error authenticating'
			})
		})

	})

}






const login_user = async( request ) => {

	const pool = DB.getPool()

	const email = request.body.email.toLowerCase().trim()
	const password = request.body.password.trim()

	const err_msg =  'failed to validate user'

	// select_user( 'email', email )
	const sql1 = 'SELECT * FROM users WHERE email=?'
	const res1 = await pool.queryPromise( sql1, request.body.email.trim() )
	if( res1.error || !res1.results ){
		if( res1.error ) log('flag', 'user lookup err: ', res1.error )
		return lib.return_fail( res1.error, 'error looking up user')
	}

	if( !res1.results.length ) return lib.return_fail('no users found for: ' + email, 'no users found')

	const hash_pw = res1.results[0].password

	const user = new User( res1.results[0] )

	// log('flag', 'um, what is the user response: ', user )

	if( !user || !hash_pw ) return lib.return_fail({
		msg: 'no user found for email: ' + email,
		result: res1.results,
	}, 'no user found for ' + email )

	const res2 = await compare_pw( password, hash_pw )
	if( !res2 || !res2.success ) return lib.return_fail( res2, 'failed to login' )

	request.session.USER = user

	return {
		success: true,
	}

}





const send_confirm = async( request ) => {

	const email = request.body.email
	const reset = request.body.reset

	if( !lib.is_valid_email( email )) return lib.return_fail( 'invalid email: ' + email, 'error sending reset' )

	const pool = DB.getPool()
	const sql = 'SELECT * FROM users WHERE email=?'
	const res = await pool.queryPromise( sql, email )
	if( res.error || !res.results || !res.results.length ) return lib.return_fail( res.error, 'error confirming user')

	request.session.USER = new User( res.results[0] )
	request.session.USER._confirm_code = lib.random_hex( 6 )
	request.session.USER._reset_time = date.to_raw_ISO( new Date() )

	await request.session.USER.save()

	const action = reset ? 'reset' : 'confirm'

	const body_html = `${ action } account:<br><br>head back to <a href="${ env.SITE_URL }/await_confirm?e=${ email }" target="_blank">${ env.SITE_TITLE }</a> and use this one time code to ${ action }:<br><br>${ request.session.USER._confirm_code }`
	const body_text = lib.render_user_data( body_html, {
		line_breaks: true,
		strip_html: true,
	})

	const mailOptions = {
		from: env.MAIL.ADMIN,
		to: email,
		subject: `${ env.SITE_TITLE } ${ action } code`,
		html: body_html,
		text: body_text,
	}

	await mail.sendmail( mailOptions )

	return { success: true }

}






const register_user = async( request ) => {

	if( lib.is_logged( request )) return lib.return_fail('already logged: ' + request.session.USER._email, 'already logged in' )

	log('flag', 'code: ', request.session.USER._confirm_code )

	const pool = DB.getPool()

	const email = request.body.email.toLowerCase().trim()
	const pw = request.body.password.trim()

	let invalid = false
	if( !lib.is_valid_email( email )){
		invalid = 'invalid email'
	}else if( !lib.is_valid_password( pw )){
		invalid = 'invalid password'
	}
	if( invalid ) return lib.return_fail( invalid + '(email: ' + email + ')', invalid )

	let salt = bcrypt.genSaltSync( SALT_ROUNDS )
	let hash = bcrypt.hashSync( pw, salt )

	const sql1 = 'INSERT INTO `users` (`email`, `password`, `confirmed`) VALUES ( ?, ?, false )'

	const res1 = await pool.queryPromise( sql1, [ email, hash ] )

	if( res1.error || !res1.results || typeof res1.results.insertId !== 'number' ){
		let msg
		if( res1.error && res1.error.code === 'ER_DUP_ENTRY' ){
			msg = 'duplicate email found'
		}else if( res1.error || !res1.results ){
			log('flag', 'err user insert: ', res1.error )
			msg = 'error creating user'
		}
		return lib.return_fail( 'error register: ' + email, msg )
	}

	const sql2 = 'SELECT * FROM users WHERE id=?'
	const res2 = await pool.queryPromise( sql2, [ res1.results.insertId ])
	if( res2.error || !res2.results || !res2.results.length ) return lib.return_fail( res2.error, 'unable to save')

	request.session.USER = new User( res2.results[0] )

	await send_confirm( request )

	return{
		success: true,
	}

}









const logout = async( request ) => {

	let msg = 'user saved'

	if( request.session.USER.save && request.session.USER._id ){

		const r = await request.session.USER.save() // auto stamps
		if( !r || !r.success )  log('flag', 'error saving user during logout (proceeding) ', r )

	}else{

		msg = 'no user found to logout'

	}

	request.session.destroy()

	return {
		success: true,
		msg: msg
	}

}


const confirm_account = async( request ) => {

	if( !lib.is_valid_email( request.body.email ) || typeof request.body.confirm_code !== 'string' ){
		return lib.return_fail( 'invalid confirm: ' + JSON.stringify( request.body ), 'invalid attempt' )
	}

	const pool = DB.getPool()
	const sql = 'SELECT * FROM users WHERE email=? AND confirm_code=?'
	const res = await pool.queryPromise( sql, [ request.body.email.trim(), request.body.confirm_code ] )
	if( res.error ) return lib.return_fail( res.error, 'failed to confirm')
	if( !res.results.length ) return lib.return_fail( 'invalid confirm: ' + request.body.email, 'failed to confirm')

	const last_reset = res.results[0].reset_time
	const time_since_reset = Date.now() - new Date( last_reset )
	const allow_window = 1000 * 60 * 60 * 24 
	if( !last_reset || time_since_reset > allow_window ){
		return lib.return_fail( 'too long elapsed since reset ' + time_since_reset, 'reset code expired (24 hours), request a new one' )
	}

	const user = request.session.USER = new User( res.results[0] )

	user._confirmed = 1 
	user._confirm_code = null

	await user.save()

	return { success: true }

}



const reset_pass = async( request ) => {

	const { pw } = request.body.data

	if( !lib.is_valid_password( pw )  ){
		return lib.return_fail( 'invalid reset: ' + JSON.stringify( request.body ), 'invalid attempt' )
	}

	const salt = bcrypt.genSaltSync( SALT_ROUNDS )
	const hash = bcrypt.hashSync( pw, salt )

	const edited = new Date().getTime()

	const pool = DB.getPool()
	const sql = 'UPDATE users SET password=?, edited=? WHERE id=?'
	const res = await pool.queryPromise( sql, [ hash, edited, request.session.USER._id ] )
	if( res.error ) return lib.return_fail( res.error, 'failed to reset')

	request.session.USER._password = hash

	return { success: true }

}


module.exports = {
	register_user,
	login_user,
	logout,
	confirm_account,
	send_confirm,
	reset_pass,
}








