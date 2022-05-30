import BROKER from '../EventBroker.js?v=25'


class User {
	constructor( init ){
		init = init || {}
		Object.assign( this, init )
	}

	hydrate( data, ripple ){
		for( const key in data ){
			this[ key ] = data[ key ]
		}
		if( ripple ){
			BROKER.publish('RIPPLE_USER', {
				user: this,
			})			
		}
	}

}

export default User