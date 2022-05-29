const log = require('./log.js')
const env = require('./.env.js')
const formData = require('form-data');


const nodemailer = require('nodemailer')
// const mailgun = require("mailgun-js")
const mailgun = require('mailgun.js')






// const SENDTYPE = 'MG_PUBLIC'
const SENDTYPE = 'NODEMAILER'

let send, mg







if( !env.PRODUCTION ){

	send = async( data ) => {

		log('mail', 'non production mail halt: ', data )
		return { success: true, halted: true }

	}



}else if( SENDTYPE === 'MG_PUBLIC' ){

	/* ----------------------------------- MAILGUN PUBLIC DOCS ----------------------------------- */

	mg = new mailgun( formData )

	const client = mg.client({
		username: 'api', 
		key: env.MAILGUN.KEY,
		public_key: env.MAILGUN.PUB_KEY,
	});

	// const sampleData = {
	// 	from: 'Excited User <me@samples.mailgun.org>',
	// 	to: 'foo@example.com, bar@example.com',
	// 	subject: 'Hello',
	// 	text: 'Testing some Mailgun awesomeness!'
	// };

	send = async( data ) => {
		const res = await client.messages.create( env.MAILGUN.DOMAIN, data )
		return res
	}







// }else if( SENDTYPE === 'MG_LOGIN' ){

// 	/* ----------------------------------- MAILGUN LOGIN DOCS (??) ----------------------------------- */

// 	mg = mailgun({ 
// 		apiKey: env.MAILGUN.KEY, 
// 		domain: env.MAILGUN.DOMAIN 
// 	});

// 	// {
// 	// 	from: env.MAIL.ADMIN,
// 	// 	to: email,
// 	// 	subject: 'Eccentricity Confirmation Code',
// 	// 	html: body_html,
// 	// 	text: body_text,
// 	// }

// 	send = data => {

// 		mg.client.messages().send( data, function (err, body) {
// 			if( err ){
// 				reject( err )
// 				return
// 			}
// 			log('mail', body )
// 			resolve()
// 		})

// 	}





}else if( SENDTYPE === 'NODEMAILER' ){

	// send = async() => {
	// 	throw new Error('nodemailer selected but not enabled')
	// }

	/* ----------------------------------- NODEMAILER ----------------------------------- */

	const transporter = nodemailer.createTransport({
		// host: 'mail.oko.nyc',
		host: env.MAIL.SERVER,
		service: env.MAIL.PROTOCOL,
		port: env.MAIL.PORT,
		secure: env.MAIL.SECURE,
		requireTLS: true,
		tls: {
			rejectUnauthorized: false
		},
		auth: {
			user: env.MAIL.ADMIN,
			pass: env.MAIL.PW
		}
	})

	send = ( options ) => {

		return new Promise((resolve, reject) => {

			/////////////////////////// dev 
			if( !env.PRODUCTION ){ 										
				log('mail', 'email SKIPPED (dev)', options )
				resolve({
					response: 'sent',
					accepted: [1],
				})
				return true
			}
			
			transporter.sendMail( options, (error, info) => { 	
				if( error ){
					reject( error )
					return false
				}

				if( env.PRODUCTION ){ /////////////////////////// PRODUCTION, more concise
					log('mail', 'email SENT: ', {
						from: options.from,
						to: options.to,
						subject: options.subject,
						html: '( ' + options.html.length + ' characters )',
						text: '( ' + options.text.length + ' characters )' 
					})

				}else{ /////////////////////////// DEV, LOCAL, full log

					log('mail', 'email SENT: ', options )

				}

				resolve( info )

			})

		})

	}

	// module.exports = {
	// 	transporter,
	// 	send,
	// }

}


const catch_send = async( data ) => {
	try{
		const res = await send( data )
		return res
	}
	catch( err ){
		log('flag', 'mail err: ', err )
		log('flag', 'email: ', data.to, data.from, data.subject )
	}
}



module.exports = {
	client: mg,
	sendmail: catch_send,
}
