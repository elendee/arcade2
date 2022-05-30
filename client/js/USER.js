import env from './env.js?v=24'

const user = {}

user.hydrate = data => {
	for( const key in data ) USER[ key ] = data[ key ]
}

if( env.EXPOSE ) window.USER = user

export default user