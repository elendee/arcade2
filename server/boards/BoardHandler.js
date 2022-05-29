const DB = require('../db.js')
const env = require('../.env.js')
const log = require('../log.js')
const lib = require('../lib.js')
const BROKER = require('../BROKER.js')
const SOCKETS = require('../SOCKETS.js')
const WSS = require('../WSS.js')();
const Board = require('../persistent/Board.js')
const Anchor = require('../persistent/Anchor.js')
const User = require('../persistent/User.js')
const ROUTER = require('../ROUTER.js')
const PUBLIC = require('../data/PUBLIC.js')


const BOARDS = {}

const PULSE_TIME = 8000


// init
let pulse = false
const init = delay => {
	setTimeout(() => { // ensure boards dont close before users join somehow
		if( !pulse ){

			pulse = setInterval(() => {

				// streetsweeper stuff
				for( const uuid in BOARDS ){
					const len = Object.keys( BOARDS[ uuid ]._USERS ).length
					if( !len ){
						BOARDS[ uuid ].close( BOARDS )
					}
				}
				if( !Object.keys( BOARDS ).length ){
					log('flag', 'no boards online; stopping pulse')
					clearInterval( pulse )
					pulse = false
				}

				// heartebeat stuff
				WSS.clients.forEach( function( ws ) {
					if( ws.isAlive === false ){
						log('wss', 'ending inactive socket', ws.request)
						return ws.terminate()
					}
			    	ws.isAlive = false
			    	ws.ping()
				})

			}, PULSE_TIME )

		}

	}, 10 * 1000)

}







// add user to SOCKETS
const init_user = async( event ) => {

	const { socket } = event

	try{

		await ROUTER.bind_user( socket ) // ( checks for user )

		const user = new User( socket.request.session.USER )
		
		SOCKETS[ user.uuid ] = socket

		socket.send(JSON.stringify({
			type: 'init_user',
			// user: user,
			user: user.publish('_email', '_created', '_edited'),
		}))

		const pool = DB.getPool()
		let sql, res

		/*
			look up user's boards
			logged or unlogged
		*/
		if( lib.is_logged( socket?.request )){

			// load user's boards
			sql = 'SELECT * FROM boards WHERE user_key=?'
			res = await pool.queryPromise( sql, user._id )
			if( res.error ) return lib.return_fail( res.error, 'error returning boards')
			for( const b of res.results ){
				if( !BOARDS[ b.uuid ] ){
					BOARDS[ b.uuid ] = new Board( b )
				}
				BOARDS[ b.uuid ].bring_online( BOARDS ) // so far this is just sync, but could become async...
				.then( res => {
					BOARDS[ b.uuid ].add_user( user )
				})
				// board broadcasts here
				// client then pings to fill missing
			}

			// load board joins
			const sql2 = {
				sql: `SELECT * FROM board_joins bj
			LEFT JOIN boards ON bj.board_key=boards.id
			WHERE bj.user_key=?`,
				nestTables: true,
			}
			const res2 = await pool.queryPromise( sql2, user._id )
			if( res2.error ){
				log('flag', 'error retrieving board joins', res2.error )
				// ( dont return though )
				lib.return_fail_socket( socket, 'error looking up joined boards', 5000 )
			}else{
				for( const b of res2.results ){
					const board = b.boards
					const join = b.bj
					if( !BOARDS[ board.uuid ] ){
						BOARDS[ board.uuid ] = new Board( board )
					}
					BOARDS[ board.uuid ].bring_online( BOARDS ) // so far this is just sync, but could become async...
					.then( res => {
						BOARDS[ board.uuid ].add_user( user )
					})
				}
			}

		}else{ // user is not logged so check user._joined boards

			// log('flag', 'looking up session boards ', user._joined_boards )

			for( const id of user._joined_boards ){
				sql = 'SELECT * FROM boards WHERE id=?'
				// log('flag', 'querying JOIN BOARD: ', id )
				pool.queryPromise( sql, id )
				.then( res => {
					if( res.error ){
						log('flag', res.error )
					}else{
						const b = res?.results?.[0]
						if( !b ){ // no board; may have been deleted by cron if session is older than board
							user._joined_boards.splice( user._joined_boards.indexOf( id ), 1 )
						}else{ // rehydrate old board 
							if( !BOARDS[ b.uuid ] ){
								BOARDS[ b.uuid ] = new Board( b )
							}											
							BOARDS[ b.uuid ].bring_online( BOARDS )
							.then( res => {
								BOARDS[ b.uuid ].add_user( user )
							})
						}
					}
				})
			}

		} // 

		// setTimeout(()=> {
		// 	log('flag', 'BEGINNING BOARS: ', BOARDS )
		// }, 2000)

	}catch( err ){

		log('flag', 'err user init: ', err )

		socket.send(JSON.stringify({
			type: 'hal',
			msg_type: 'error',
			msg: 'error intiializing user',
		}))

	}

}


const pong_board = event => {
	const { socket, packet } = event
	const { uuid } = packet
	const board = BOARDS[ uuid ] 
	if( !board ){
		log('flag', 'missing board: ', uuid )
		return
	}
	const user = socket?.request?.session?.USER
	const b = board.publish()
	b.is_owner = ( user?._id && user?._id === board._user_key )
	// log('flag', 'pong board:', BOARDS )
	socket.send(JSON.stringify({
		type: 'pong_board',
		board: b,
	}))
}


const save_board = event => {
	const { socket, packet } = event
	const { uuid, user_uuid, content } = packet

	const board = BOARDS[ uuid ]
	if( !board ) return lib.return_fail_socket(socket, 'no board found for save', 5000, {
		packet:packet,
		msg: 'no board for save',
		uuid: Object.keys( BOARDS ),
	})
	log('flag', 'saving board: ', board.name )
	board.save_content( socket, user_uuid, content )
}


// socket disconnect
const disconnect = event => {
	const { socket } = event
	const user = socket?.request?.session?.USER
	if( !user ) return lib.return_fail( 'invalid disconnect', 'no user for disconnect')
	log('flag', 'disconnect', user._email )
	for( const uuid in BOARDS ){
		if( BOARDS[ uuid ]._USERS[ user.uuid ] ){
			BOARDS[ uuid ].remove_user( user.uuid, 'normal' )
		}
	}
	delete SOCKETS[ user.uuid ]
}


const add_board = async( event ) => {

	const { socket, packet } = event
	const { hash } = packet

	socket.send(JSON.stringify({
		type: 'debug',
		msg: 'hallo',
	}))

	const is_logged = lib.is_logged( socket?.request )

	// log('flag', 'add board - user logged ? ', is_logged )
	// if( !is_logged ){
	// 	log('flag', 'why not logged', socket.request.session.USER )
	// }

	let user
	if( is_logged ){ // check for logged board limit
		user = socket.request.session.USER

		const pool = DB.getPool()
		const sql = 'SELECT * FROM boards WHERE user_key=?'
		const res = await pool.queryPromise( sql, user._id )
		if( res.error ) return lib.return_fail_socket( socket,'failed to get boards', 3000, res.error )
		const len = res?.results?.length
		const lim = env.ADMINS.includes( user._email ) ? 100 : PUBLIC.BOARDS.LOGGED_LIMIT
		if( len >= lim ){
			return lib.return_fail_socket( socket, 'limit ' + lim + ' boards', 5000, 'at board limit')
		}
		
	}else{ // check for unlogged limit
		user = socket?.request?.session?.USER
		if( user?._joined_boards.length >= PUBLIC.BOARDS.UNLOGGED_LIMIT ){
			user.refresh_joined_boards( socket )
			return lib.return_fail_socket( socket, 'max ' + PUBLIC.BOARDS.UNLOGGED_LIMIT + ' boards for unlogged users', 5000)
		}
	}

	// user is clear to make a board
	const board = new Board({
		user_key: user?._id,
		is_public: !is_logged,
	})
	BOARDS[ board.uuid ] = board
	BOARDS[ board.uuid ].created_hash = hash
	const { id } = await board.save()

	// log('flag', 'ok so ...', BOARDS )

	BOARDS[ board.uuid ]._id = id // ( both logged & unlogged are saved )
	BOARDS[ board.uuid ].add_user( user )
	// if( is_logged ){
	// 	BOARDS[ board.uuid ]._id = id
	// }else 
	if( !is_logged ){
		user._joined_boards.push( id )
		socket.request.session.save()
	}

	// log('flag', 'boards post ADD', BOARDS )
	const b = board.publish()
	b.is_owner = is_logged // clientside flag

	socket.send(JSON.stringify({
		type: 'pong_board',
		board: b,
	}))

}



const pong_options = async( event ) => {
	const { socket, packet } = event
	const { uuid } = packet 

	// validations
	// board
	const board = BOARDS[ uuid ]
	if( !board ) return lib.return_fail_socket( socket, 'no board found for options', 5000, 'no board found for options')
	// user	
	const can_edit = board.can_edit( socket )
	// if( !can_edit ) return lib.return_fail_socket( socket, 'you do not have permissions to edit that board', 5000)

	// get permitted users
	let allowed_users, anchors
	if( can_edit ){
		allowed_users = await board.get_allowed_users( socket )
		anchors = board.publish_anchors( true, false )
	}
	const online_users = board.get_online_users( socket )

	socket.send(JSON.stringify({
		type: 'pong_options',
		board: board.publish(),
		allowed_users: allowed_users,
		online_users: online_users,
		anchors: anchors,
	}))

}



const set_option = event => {
	/*
		the main board editing route
	*/
	const { socket, packet } = event
	const { uuid, option, state } = packet

	const board = BOARDS[ uuid ]
	if( !board ) return lib.return_fail_socket( socket, 'board is not online', 5000)

	if( !board.can_edit( socket )) return lib.return_fail_socket( socket, 'you do not have permissions to edit that board', 5000)

	board.handle_options( socket, option, state )

}



const join_board = async( event ) => {
	const { socket, packet } = event
	const { uuid, value } = packet
	// log('flag', 'join board: ', packet )

	let slug

	if( uuid ){ // join from URL (so must be web client)

		slug = uuid

	}else if( value ){ // join from Join modal ( so must be chrome extension )

		slug = lib.parse_slug( value )

	}

	let board

	if( !lib.is_emu_uuid( slug )){
		log('flag', 'whatss...... what..', slug )
		return lib.return_fail_socket( socket, 'failed to join: invalid uuid', 5000, 'inval uuid: ' + uuid)
	}
	init() // ensure we are online init sequence
	if( BOARDS[ slug ] ){
		board = BOARDS[ slug ]
	}else{
		const pool = DB.getPool()
		const sql = 'SELECT * FROM boards WHERE uuid=?'
		const res = await pool.queryPromise( sql, slug )
		if( res.error ) return lib.return_fail_socket( socket, 'failed looking up board', 5000, res.error )
		if( !res?.results?.length ) return lib.return_fail_socket( socket, 'no board found', 5000, 'no board for: ' + slug )
		board = new Board( res.results[0] )
		await board.bring_online( BOARDS )
	}

	const user = socket?.request?.session?.USER

	if( !board.is_public && board._user_key !== user?._id ) return lib.return_fail_socket( socket, 'board is private', 5000, 'board is private: ' + slug)
	if( !user ) return lib.return_fail_socket( socket, 'no user', 5000, 'board is private: ' + slug)
	board.add_user( user )

}



const update_user = async( event ) => {
	const { uuid, data, persist } = event
	log('flag', 'boards update user: ', event )
	// find user
	let user 
	let res = { success: false }
	for( const u in BOARDS ){
		if( BOARDS[ u ]._USERS[ uuid ] ){
			user = BOARDS[ u ]._USERS[ uuid ]
			res = await user.set_field( data, persist )
			break;
		}
	}
	return res
}



const touch = async( event ) => {
	const { socket, packet } = event
	const { uuid } = packet
	const board = BOARDS[ uuid ]
	if( !board ) return lib.return_fail_socket(socket, 'invalid board; try refreshing', 2000 )
	const user = socket?.request?.session?.USER
	const u = board._USERS[ user.uuid ]
	if( !u ){
		log('flag', 'board is missing touch user', user )
		return
	}
	board.broadcast({
		type: 'board_touch',
		board_uuid: board.uuid,
		user_uuid: u.uuid
	})
}



const ping_user = event => {
	const { socket, packet} = event
	const { board_uuid, user_uuid } = packet

	const board = BOARDS[ board_uuid ]
	if( !board ) return lib.return_fail( 'no board: ' + board_uuid, false )

	const user = socket?.request?.session?.USER

	const request_user = board._USERS[ user.uuid ]
	if( !request_user ) return lib.return_fail( 'user request user info for board they are not in: ' + user.uuid.substr(0,6), false )

	const target_user = board._USERS[ user_uuid ]
	if( target_user ){
		socket.send(JSON.stringify({
			type: 'pong_user',
			user: target_user.publish(),
			board: board.publish(),
		}))
	}

}



const set_anchor = async( event ) => {
	const { socket, packet } = event
	const { board_uuid } = packet
	const board = BOARDS[ board_uuid ]
	if( !board?._id ) return lib.return_fail_socket( socket, 'invalid board', 5000, 'no board for anchor: ' + board_uuid  )

	const user = board._USERS[ socket?.request?.session?.USER?.uuid ]
	if( !user ) return lib.return_fail_socket( socket, 'user is not in board', 5000, 'no user found for anchor' )

	if( !lib.is_logged( socket?.request )) return lib.return_fail_socket( socket, 'must be logged in to set anchors', 5000 )
	if( !user._id || user._id !== board._user_key ) return lib.return_fail_socket( socket, 'only the owner may set anchors', 5000 )

	const anchor = new Anchor({
		content: board.content,
		board_key: board._id,
	})

	const { id, created } = await anchor.save()
	anchor._id = id
	anchor._created = created

	// log('flag', 'new anchor: ', anchor )

	if( !board._ANCHORS[ anchor.uuid ] ) board._ANCHORS[ anchor.uuid ] = anchor

	let oldest = anchor
	for( const uuid in board._ANCHORS ){
		const anchor = board._ANCHORS[ uuid ]
		if( anchor._created < oldest._created ){
			oldest = anchor
		}
	}

	// remove all but newest 10 here
	const newest_ten = []
	const too_old = []
	for( const uuid in board._ANCHORS ){
		if( newest_ten.length < 10 ){
			newest_ten.push( uuid )
			continue
		}
		for( const u of newest_ten ){
			if( board._ANCHORS[ u ]._created < board._ANCHORS[ uuid ]._created ){
				too_old.push( newest_ten.splice( newest_ten.indexOf( u), 1 ) )
				newest_ten.push( uuid )
				break;
			}
		}
	}

	// log('flag', 'ANCHOR UUIDs', newest_ten, too_old )

	for( const uuid of too_old ){
		// delete
		board._ANCHORS[ uuid ].unset()
		.catch( err => {
			log('flag', 'whatsa matter board', board._ANCHORS[ uuid ] )
			log('flag', 'err unset board', err )
		})

		delete board._ANCHORS[ uuid ]

	}

	socket.send(JSON.stringify({
		type: 'hal',
		msg_type: 'success',
		msg: 'anchor saved<br>' + new Date().toLocaleString() + '<br>oldest anchor now:<br>' + new Date( oldest._created ).toLocaleString(),
		time: 10 * 1000,
	}))

}



const ping_anchor = async( event ) => {
	const { socket, packet } = event
	const { board_uuid, uuid } = packet

	const board = BOARDS[ board_uuid ]
	if( !board?._id ) return lib.return_fail_socket( socket, 'invalid board', 5000, 'no board for anchor: ' + board_uuid  )

	const user = board._USERS[ socket?.request?.session?.USER?.uuid ]
	if( !user ) return lib.return_fail_socket( socket, 'user is not in board', 5000, 'no user found for anchor' )

	if( !board._user_key || board._user_key !== user?._id )	return lib.return_fail_socket( socket, 'you do not have permissions', 5000)

	if( !board._ANCHORS[ uuid ] ) return lib.return_fail_socket( socket, 'anchor not found', 5000, 'anchor not found: ' + uuid )

	// log('flag','wot', board._ANCHORS )

	socket.send(JSON.stringify({
		type: 'pong_anchor',
		anchor: board._ANCHORS[ uuid].publish('_created')
	}))

}









BROKER.subscribe('SOCKET_DISCONNECT', disconnect )

BROKER.subscribe('BOARDS_INIT_USER', init_user )
BROKER.subscribe('BOARDS_PING', pong_board )
BROKER.subscribe('BOARDS_PONG_OPTIONS', pong_options )
BROKER.subscribe('BOARDS_UPDATE_USER', update_user )
BROKER.subscribe('BOARDS_PING_ANCHOR', ping_anchor )

BROKER.subscribe('BOARD_SAVE', save_board )
BROKER.subscribe('BOARD_JOIN', join_board )
BROKER.subscribe('BOARD_ADD', add_board )
BROKER.subscribe('BOARD_SET_OPTION', set_option )
BROKER.subscribe('BOARD_TOUCH', touch )
BROKER.subscribe('BOARD_ANCHOR', set_anchor )
BROKER.subscribe('USER_PING', ping_user )

module.exports = {
	BOARDS,
	init,
	pulse,
}