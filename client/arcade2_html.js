
// const cache = '?v=30'
const log = require('../server/log.js')
const lib = require('../server/lib.js')
const env = require('../server/.env.js')


const PUBLIC = require('../server/data/PUBLIC.js')




const build_meta = () => {

	const fonts = `
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Archivo:wght@100;300;500&display=swap" rel="stylesheet">`

	return `
	<title>${ env.SITE_TITLE }</title>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, height=device-height, initial-scale=1">
	<meta name="Description" content=" ${ env.SITE_DESC }">
	<meta property="og:url" content="${ env.SITE_URL }">
	<meta property="og:title" content="${ env.SITE_TITLE }">
	<meta property="og:description" content="${ env.SITE_META_DESC }"> 
	<meta property="og:image" content="${ env.SITE_IMAGE }"/>
	${ env.PRODUCTION ? fonts : '' }
	<link rel='icon' href='/resource/media/favicon.ico'/>`

}


const popups = `
<div id='dev'></div>
<div id='alert-contain'></div>`

const global_data = () => { return `<div id="global-data">${ JSON.stringify( PUBLIC ) }</div>` }



const scripts = {

	// auth
	index: `<script type='module' defer='defer' src='/js/auth/init_index.js?v=30'></script>`,
	auth: `<script type='module' defer='defer' src='/js/auth/init_auth.js?v=30'></script>`,
	account: `<script type='module' defer='defer' src='/js/auth/init_account.js?v=30'></script>`,
	contacts: `<script type='module' defer='defer' src='/js/auth/init_contacts.js?v=30'></script>`,
	admin: `<script type='module' defer='defer' src='/js/auth/init_admin.js?v=30'></script>`,
	chirpy: `<script type='module' defer='defer' src='/js/pages/init_chirpy.js?v=30'></script>`,
	chirpy_board: `<script type='module' defer='defer' src='/js/pages/chirpy/init_chirpy_board.js?v=30'></script>`,
	await_confirm: `<script type='module' defer='defer' src='/js/auth/init_await-confirm.js?v=30'></script>`,
	send_confirm: `<script type='module' defer='defer' src='/js/auth/init_send-confirm.js?v=30'></script>`,
	redirect: `<script type='module' defer='defer' src='/js/auth/init_redirect.js?v=30'></script>`,

	// misc
	fabric: `<script src='/inc/fabric.min.js' defer='defer'></script>`,
	//howler: `<script src='/resource/inc/howler/howler.min.js'></script>`,
	//howler_spatial: `<script src='/resource/inc/howler/howler.spatial.min.js'></script>`,

}


const styles = {

	// auth
	index: `<link rel='stylesheet' href='/css/splash.css?v=30'>`,
	base: `<link rel='stylesheet' href='/css/base.css?v=30'>`,
	auth: `<link rel='stylesheet' href='/css/auth.css?v=30'>`,
	account: `<link rel='stylesheet' href='/css/account.css?v=30'>`,
	chirpy: `<link rel='stylesheet' href='/css/chirpy.css?v=30'>`,
	chirpy_board: `<link rel='stylesheet' href='/css/chirpy_board.css?v=30'>`,
	spreadsheets: `<link rel='stylesheet' href='/css/spreadsheets.css?v=30'>`,
	contacts: `<link rel='stylesheet' href='/css/contacts.css?v=30'>`,
	admin: `<link rel='stylesheet' href='/css/admin.css?v=30'>`,
	modal: `<link rel='stylesheet' href='/css/modal.css?v=30'>`,

	// pages
	page: `<link rel='stylesheet' href='/css/page.css?v=30'>`,

}


const logo = `
<a href='/' id='logo'>
	<img src='/resource/media/logo.png'>
</a>`

const logged_links = `
<div class='auth-link'>
	<a href='/account'>account</a>
</div>
<div id='logout' class='auth-link'>
	<a href='/logout'>logout</a>
</div>
`

// <div class='public-link'>
// 	<a href='/page/truthengine'>Truth Engine</a>
// </div>
const main_links = `
<div class='public-link'>
	<a href='/chirpy'>chirpy</a>
</div>
<div class='public-link'>
	<a href='/canopy'>canopy</a>
</div>
`

const unlogged_links = `
<div class='auth-link'>
	<a href='/login'>login</a>
</div>
<div class='auth-link'>
	<a href='/register'>register</a>
</div>
`


const build_header = function( type, request, header ){

	if( header == 'crypto' ) header = 'Emu Trader'

	if( lib.is_logged( request ) ){

		return `
		<div id='header' data-auth='true' data-admin='${ lib.is_admin( request ) }'>
			${ logo }
			<div id='mobile-toggle'>menu</div>
			<div id='links'>
				<div id='public-links'>
					${ main_links }
				</div>
				<br>
				<div id='auth-links'>
					${ logged_links }
				</div>
			</div>
		</div>`

	}else{

		return `
		<div id='header' data-auth='false' data-admin='${ lib.is_admin( request ) }'>
			${ logo }
			<div id='mobile-toggle'>menu</div>
			<div id='links'>
				<div id='public-links'>
					${ main_links }
				</div>
				<br>				
				<div id='auth-links'>
					${ unlogged_links }
				</div>
			</div>
		</div>`

	}
}



const page_title = type => {
	return `<h3 class='page-title'>${ type }</h3>`
}



module.exports = function render( type, request, data ){

	try{
	
		let css_includes = styles.base
		let script_includes = ''

		switch( type ){
















		case 'index':

			css_includes += styles.auth + styles.index + styles.modal
			script_includes += scripts.index //+ scripts.howler

			return `
			<html>
				<head>
					${ build_meta() }
					${ css_includes }
					${ script_includes }
				</head>
				<body class='${ type }'>
					${ popups }
					${ global_data() }
					${ build_header( type, request, env.SITE_TITLE ) }
				</body>
			</html>`


		case 'login':
	   		// <input class='button' type="submit" value="Login" />

			css_includes += styles.auth + styles.modal
			script_includes += scripts.auth //+ scripts.howler

			return `
			<html>
				<head>
					${ build_meta()}
					${ css_includes }
					${ script_includes }
				</head>
				<body class='${ type }'>
					${ popups }
					${ global_data() }
					${ build_header( type, request, 'login' )}
					<div id='content'>

						<div id='login-form' class='auth-form'> 
					        
						    <input class='input' id='email' type="text" placeholder="email"/>
					   		<input class='input' id='password' type="password" placeholder="password"/>
					   		<br>
					   		<div class='button'>Login</div>
					   		<br>
					   		<!-- 
					   		<div id='oauth-providers'>
						   		<div id='github' class='button'>
						   			github
						   		</div>
						   		<br>
						   		<div id='google' class='button'>
						   			google
						   		</div>
						   		<br>
						   	</div>
						   	-->
					   		<div id='forgot'>
					   			<a href='/send_confirm'>
					   				forgot password
					   			</a>
					   		</div>
					    </div>

					</div>
				</body>
			</html>`


		case 'register':
			// <input class='button' type='submit' value='Register'>

			css_includes += styles.auth + styles.modal
			script_includes += scripts.auth//  + scripts.howler

			return `
			<html>
				<head>
					${ build_meta()}
					${ css_includes }
					${ script_includes }
				</head>
				<body class='${ type }'>
					${ popups }
					${ global_data() }
					${ build_header( type, request, 'register' )}
					<div id='content'>

						<div id='register-form' class='auth-form'>
							<input class='input' type='email' id='email' placeholder="email">
							<input class='input' type='password' id='password' placeholder="password">
							<input class='input' type='password' id='password2' placeholder="password again">
							<div class='button'>Register</div>
						</div>
					
					</div>
				</body>
			</html>`


		case 'account':

			css_includes += styles.auth + styles.account + styles.modal
			script_includes += scripts.account // + scripts.howler

			return `
			<html>
				<head>
					${ build_meta() }
					${ css_includes }
					${ script_includes }
				</head>
				<body class='${ type }'>
					${ build_header( type, request, 'account' )}
					${ popups }
					${ global_data() }
					<div id='content' class='arc-contain'>

						${ page_title( type )}

						<div id='details' class='arc-constrain'>

							<!--div id='email' class='stat'>
								<span>email:</span> ${ request.session.USER._email }
							</div-->

							<!--div id='reset-pass'>
								<a href='#'>reset password</a>
							</div>
							<form id='reset-form'>
								<input type='password' class='input' placeholder='reset password'>
								<br>
								<input type='submit' class='button' value='reset'>
							</form-->

						</div>

					</div>

				</body>
			</html>`


		case 'await_confirm':

			css_includes += styles.auth 
			script_includes += scripts.await_confirm //+ scripts.howler

			return `
			<html>
				<head>
					${ build_meta() }
					${ css_includes }
					${ script_includes }
				</head>
				<body class='${ type }'>
					${ build_header( type, request, 'await confirm' )}
					${ popups }
					${ global_data() }
					<div id='content'>
					</div>
				</body>
			</html>
			`

		case 'send_confirm':

			css_includes += styles.auth 
			script_includes += scripts.send_confirm//  + scripts.howler

			return `
			<html>
				<head>
					${ build_meta() }
					${ css_includes }
					${ script_includes }
				</head>
				<body class='${ type }'>
					${ build_header( type, request, 'send confirm' )}
					${ popups }
					${ global_data() }
					<div id='content'>
					</div>
				</body>
			</html>
			`


		case 'admin':

			css_includes += styles.auth + styles.admin 
			script_includes += scripts.admin //  + scripts.howler

			return `
			<html>
				<head>
					${ build_meta() }
					${ css_includes }
					${ script_includes }
				</head>
				<body class='${ type }'>
					${ build_header( type, request, 'admin' )}
					${ popups }
					${ global_data() }
					<div id='content'>
						${ page_title( type )}
						
					</div>
				</body>
			</html>
			`
		
		case 'confirm':

			css_includes += styles.auth
			script_includes += scripts.howler

			return `
			<html>
				<head>
					${ build_meta() }
					${ css_includes }
					${ script_includes }
				</head>
				<body class='${ type }'>

					${ popups }
					${ global_data() }
					${ build_header( type, request, 'confirm' )}

					<h4>email confirm</h4>

				</body>
			</html>`

















		case 'chirpy':
			css_includes += styles.chirpy + styles.modal
			script_includes += scripts.chirpy

			return `
			<html>
				<head>
					${ build_meta() }
					${ css_includes }
					${ script_includes }
				</head>
				<body class='${ type }'>
					${ build_header( type, request, '???' )}
					${ popups }
					${ global_data() }
					<div class='arc-contain'>
						<div id='content' class='arc-constrain'>
							

						</div>
					</div>
				</body>
			</html>
			`


		case 'chirpy_board':
			css_includes += styles.chirpy_board + styles.modal
			script_includes += scripts.chirpy_board

				// ${ build_header( type, request, '???' )}
			return `
			<html>
				<head>
					${ build_meta() }
					${ css_includes }
					${ script_includes }
				</head>
				<body class='${ type }'>
					${ popups }
					${ global_data() }
					<div class='game-contain'>
					</div>
				</body>
			</html>
			`


















	// error handling


		case 'redirect':

			script_includes += scripts.redirect

			return `
			<html>
				<head>
					${ script_includes }
				</head>
				<body class='${ type }'>
					<div id='redirect' data-redirect='${ data }'></div>
				</body>
			</html>`


		case '404':

			css_includes += styles.auth
			// script_includes += scripts.howler

			return `
			<html>
				<head>
					${ build_meta() }
					${ css_includes }
					${ script_includes }
				</head>
				<body class='${ type }'>
					${ popups }
					${ global_data() }
					${ build_header( type, request, '404' )}
					<div id='content'>
						<div class='fourohfour'>
							nothing to see here - check your URL<br>
							<a href='/'>click here</a> to return to base
						</div>
					</div>
					</body>
					</html>
				`
		default:

			css_includes += styles.auth
			// script_includes += scripts.howler

			return `
			<html>
				<head>
					${ build_meta() }
					${ css_includes }
					${ script_includes }
				</head>
				<body class='${ type }'>
					${ popups }
					${ global_data() }
					${ build_header( type, request, '404' )}
					<div id='content'>
						<div class='fourohfour'>
							nothing to be found here - check your URL<br>
							<a href='/'>click here</a> to return to base
						</div>
					</div>
					</body>
					</html>
				`
















		}

	}catch( err ){
		log('flag', 'render err: ', err )
		return '<div>error rendering page</div>'
	}

}



