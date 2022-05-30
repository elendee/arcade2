import BROKER from '../EventBroker.js?v=27'

const settings = {
	RESOLUTION: .5,
}


settings.set = ( key, value ) => {
	settings[ key] = value
	BROKER.publish('SETTINGS_UPDATED', { settings: settings })
}




export default settings