const auth = require('./auth.js')
const User = require('./persistent/User.js')

const log = require('./log.js')
const lib = require('./lib.js')

const render = require('../client/arcade2_html.js')

const color = require('./color.js')

const routes = {

	GET: {
		logged: [
			'contacts',
			'account', 
			'send_confirm',
		],
	}, 	
	POST: {
		logged: [
			// 'account_action',
			// 'action',
			'admin',
		],
	}

}

const sessions = {}
const limit = {
	requests: 100,
	per: 15 * 1000, // ms
}

let id
const clear_frequency = request => {

	id = request.session.id

	if( !sessions[ id ] ){

		sessions[ id ] = {
			count: 0,
			timeout: false,
		}

		return true

	}else{

		sessions[id].count++
		if( sessions[id].count > limit.requests ){
			log('flag', 'too many requests: ', lib.identify( request.session.USER ), '(' + limit.requests + '/' + limit.per + ')' )
			return false
		}

		clearTimeout( sessions[id].timeout )
		sessions[id].timeout = setTimeout(()=>{
			delete sessions[id]
		}, limit.per )

		return true

	}

}

const skiplog_routes = []

let bare_path, ip

module.exports = function(req, res, next) {

	if( req.path.match(/\/resource/) || req.path.match(/\/client/) ){

		next()

	}else{

		if( !clear_frequency( req ) ){
			req.session.destroy()
			if( req.method === 'GET' ){
				return res.send( render('redirect', req, '' ))
			}else{
				return res.send({
					success: false,
					msg: 'too many requests',
				})
			}
		}

		ip = ( req.headers['x-forwarded-for'] || req.connection.remoteAddress || '' ).split(',')[0].trim()

		bare_path = req.path.replace(/\//g, '')

		log('gatekeep', format({
			ip: ip,
			method: req.method,
			path: req.path,
			email: req.session.USER ? req.session.USER._email : '',
		}))

		if( routes[ req.method ] ){

			if( routes[ req.method ].logged.includes( bare_path ) ){ // required logged in routes 

				if( !lib.is_logged( req ) ){ // not logged

					if( req.method === 'GET' ){
						return res.send( render('redirect', req, '' ))
					}else{
						return res.json({
							success: false,
							msg: 'must be logged in',
						})
					}

				}else{ // logged in 

					req.session.USER = new User( req.session.USER )

					if( !req.session.USER._confirmed ){
						if( !req.session.USER._reset_time || Date.now() - new Date( req.session.USER._reset_time ).getTime() > 1000 * 60 * 60 * 24 ){
							req.session.USER._confirm_code = lib.random_hex( 6 )
							req.session.USER.save()
							.then( res => {
								auth.send_confirm( req )
								.catch( err => {
									log('flag', 'err sending reset gatekeep ', err )
								})
							})
							.catch( err => log('flag', 'err setting confirm : ', err ))
						}
						return res.send( render('redirect', req, 'await_confirm' ) )
					}

					next()

				}

			}else if( req.path.match(/admin/i) && !lib.is_admin( req ) ){

				return res.send( render('redirect', req, '' ) )

			}else {

				req.session.USER = new User( req.session.USER )
				next()

			}

		}else{

			next()

		}

	}


}


function format( data ){
	if( data.path && skiplog_routes.includes( data.path ) ) return 'SKIPLOG'
	return ` ${ color('orange', data.ip ) } ${ color_method( data.method, data.path ) } ${ data._email ? color('magenta', data._email ) : 'none' }`

}


function color_method( method, data ){
	return color( ( method === 'POST' ? 'lblue' : 'blue' ), data )
}

