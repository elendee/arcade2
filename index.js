
// native
const host = require('os').hostname()
const express = require('express')
const http = require('http')
const session = require('express-session')

const redis = require('redis')
const redisClient = redis.createClient({ legacyMode: true })
const redisStore = require('connect-redis')(session)

// env
const env = require('./server/.env.js')
const log = require('./server/log.js')
const lib = require('./server/lib.js')
const DB = require('./server/db.js')
const mail = require('./server/mail.js')

// NPM
const bodyParser = require('body-parser')
const got = require('got')

// app layer
const initCron = require('./server/initCron.js')
const {
	identify,
} = require('./server/lib.js')
const gatekeep = require('./server/gatekeep.js')
const render = require('./client/arcade2_html.js')
const auth = require('./server/auth.js')

const ACCOUNT = require('./server/OPS_account.js')
const ARCADE = require('./server/ARCADE.js')

const WSS = require('./server/WSS.js')();

const PUBLIC = require('./server/data/PUBLIC.js')

const BROKER = require('./server/BROKER.js')
const SETTINGS = require('./server/SETTINGS.js')
















let server



// init

;(async() => {


const exp = new express()

server = http.createServer( exp )

const res = await redisClient.connect()

log('boot', 'redis connected (' + env.REDIS.NAME + ')' )

const STORE = new redisStore({ 
	host: env.REDIS.HOST, 
	port: env.REDIS.PORT, //env.PORT, 
	client: redisClient, 
	ttl: env.REDIS.TTL,
})
/*
	session lifetimes = Math.min( session store TTL , express cookie maxAge )
	( need both )
*/
const redis_session = session({
	secret: env.REDIS.SECRET,
	name: env.REDIS.NAME,
	resave: false,
	saveUninitialized: true,
	cookie: { 
		secure: false,
		maxAge: 1000 * 60 * 60 * 24 * 31,
	}, // Note that the cookie-parser module is no longer needed
	store: STORE
})



exp.use( redis_session )


if( env.LOCAL ){
	exp.use('/css', express.static( './client/css' )) // __dirname + 
	exp.use('/js', express.static( './client/js' )) // __dirname + 
	exp.use('/inc', express.static( './inc' )) // __dirname + 
	exp.use('/resource', express.static( './resource' )) // __dirname + 
	exp.use('/node_modules/three', express.static( './node_modules/three' )) // __dirname + 
	exp.use('/geometries', express.static( './geometries' )) // __dirname + 
	exp.use('/three-patch', express.static( './three-patch' )) // __dirname + 
}

exp.use( bodyParser.json() )

exp.use( gatekeep )








// routing
exp.get('/', (request, response)  => {
	response.send( render( 'index', request ) )
})

exp.get('/login*', (request, response) => {
	response.send( render( 'login', request ) )	
})

exp.get('/register*', (request, response) => {
	response.send( render( 'register', request ) )	
})

exp.get('/admin*', (request, response) => {
	response.send( render( 'admin', request ))
})

exp.get('/account*', (request, response) => {
	response.send( render( 'account', request ))
})

exp.get('/contacts', (request, response) => {
	response.send( render( 'contacts', request ))
})

exp.get('/await_confirm', ( request, response ) => {
	response.send( render('await_confirm', request ))
})

exp.get('/send_confirm', ( request, response ) => {
	response.send( render('send_confirm', request ))
})

exp.get('/logout', ( request, response ) => {
	request.session.destroy()
	response.send( render('redirect', request, '' ))
})

exp.get('/data/:type', ( request, response ) => {
	MAIN.get_data( request )
	.then( res => {
		response.json( res )
	})
	.catch( err => {
		log('flag', 'err emu data',  err )
		response.json({
			success: false,
			msg: 'error getting data',
		})
	})
})

exp.get('/chirpy', ( request, response) => {
	response.send( render( 'chirpy', request ) )	
})

exp.get('/chirpy_board/*', ( request, response) => {
	response.send( render( 'chirpy_board', request ) )	
})

exp.get('/robots.txt', (request, response) => {
	response.sendFile('/robots.txt', {root: '../'}); log('routing', 'bot')
})




// ^^ GET
// -------
// vv POST




exp.post('/login', (request, response) => {
	auth.login_user(request)
		.then(function(res){
			response.json(res)
		})
		.catch(function(err){
			log('flag', 'error logging in: ', err )
			response.json({
				success: false,
				msg: 'error logging in'
			})
		})
})

exp.post('/register', function( request, response ){
	auth.register_user( request )
		.then( function( res ){
			response.json( res )
		})
		.catch(function(err){
			log('flag', 'error registering', err )
			response.json({
				success: false,
				msg: 'error registering'
			})
		})
})


exp.post('/confirm_account', function( request, response ){
	auth.confirm_account( request )
		.then(function( res ){
			response.json( res )
		})
		.catch(function( err ){
			log('flag', 'error confirm_account: ', err )
			response.json({
				success: false,
				msg: err.msg || 'error confirming'
			})
		})
})

exp.post('/send_confirm', function( request, response ){
	auth.send_confirm( request )
		.then(function( res ){
			response.json( res )
		})
		.catch(function( err ){
			log('flag', 'error send_confirm: ', err )
			response.json({
				success: false,
				msg: err.msg || 'error sending confirm',
			})
		})
})





exp.post('/account_action', ( request, response ) => {
	ACCOUNT.action( request )	
	.then( res => {
		response.json( res )
	})
	.catch( err => {
		log('flag', 'account err', err )
		response.json({
			success: false,
			msg: err.msg || 'error attempting action',
		})
	})
})

exp.post('/action', ( request, response ) => {
	MAIN.action( request )
	.then( res => {
		response.json( res )
	})
	.catch( err => {
		log('flag', 'action err', err )
		response.json({
			success: false,
			msg: err.msg || 'request error'
		})
	})
})

exp.post('/admin', function( request, response ){
	ADMIN.action( request )
	.then(function( res ){
		response.json( res )
	})
	.catch(function( err ){
		log('flag', 'error admin action: ', err )
		response.json({
			success: false,
			msg: 'error admin action',
		})
	})
})






exp.post('*', (request, response) => {
	log('flag', 'POST 404: ' + request.url)
	if(request.url.match(/\.html$/)){
		response.status(404).sendFile('/client/html/404.html', { root : '../' })    
	}else{
		response.end()
	}
})

exp.get('*', (request, response) => {
	response.status( 404 ).send( render('404', request) )
	// response.status(404).sendFile('/client/html/404.html', { root : '../'})    
})











function heartbeat(){
	// DO NOT convert to arrow function or else your sockets will silently disconnect ( no "this" )
	this.isAlive = Date.now()
	// log('flag', 'heartbeat')
}



DB.initPool(( err, pool ) => {

	if( err ) return console.error( 'no db: ', err )
	
	server.listen( env.PORT, function() {
		log( 'boot', `\x1b[32m
+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
                          ${ env.SITE_TITLE }
+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
:: ${ host }
:: ${ env.PUBLIC_ROOT } :${ env.PORT }
:: ${ new Date().toString() }
\x1b[0m`)
	})

	server.on('upgrade', function( request, socket, head ){

		// log('flag', '****** UPGRADE ********')
		redis_session( request, {}, () => {

			// log('wss', 'redis session parsed')

			WSS.handleUpgrade( request, socket, head, function( ws ) {
				WSS.emit('connection', ws, request )
			}, 'INDEX.JS ' + socket.id )
		})
	})

	WSS.on('connection', async( socket, req ) => {

		log('wss', 'initial socket user: ', identify( req.session.USER ) || '(none found)' )

		socket.request = req

		socket.isAlive = socket.isAlive || true

		socket.bad_packets = 0

		socket.on('pong', heartbeat )

		if( WSS.clients.size >= env.MAX_CONNECTIONS ) {
			log('flag', 'max capacity')
			return false
		}

		// if( !ARCADE.sweeping ){
		// 	await ARCADE.init()
		// }

		BROKER.publish('ARCADE_INIT_USER', {
			socket: socket,
		})

	})

	setTimeout(async() => {

		// if( env.LOCAL ) return lib.return_fail( 'env.LOCAL skipping cron', false )
		await SETTINGS.init()
		initCron()

	}, 1000 )

})








})(); // init

