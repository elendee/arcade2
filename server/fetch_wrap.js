const log = require('./log.js')
const fetch = require('got')

module.exports = async( url, method, parse, data ) => {

	let options
	if( method ) options = {
		method: method
	}

	let body
	if( method.match(/post/i) ){
		options.body = JSON.stringify( data )
		options.headers = {
			'Content-Type': 'application/json'
		}
	}

	const res = await fetch( url, options )

	let result

	switch( parse ){
		case 'json':
			result = await res.json()
		default: 
			result = res
			break
	}

	return {
		success: true,
		res: result,
	}

}