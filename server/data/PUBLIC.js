const env = require('../.env.js')

//const { Vector3 } = require('three')


module.exports = {

	PUBLIC_ROOT: '',

	WATCH_CAP : 25,

	SYMBOLS: {  // match their coingecko language
		btc: {
			id: 'bitcoin',
			name: 'Bitcoin',
		},
		ltc: {
			id: 'litecoin',
			name: 'Litecoin',
		},
		biden: {
			id: 'biden',
			name: 'BIDEN Token',
		}
	},

	SLUG_LENGTH: 12,

	BOARDS: {
		LOGGED_LIMIT: 10,
		UNLOGGED_LIMIT: 3,
		CONTENT_LIMIT: 60 * 1000,
		UNLOGGED_BOARD_HOURS: 24,
	},

	CHR_BOARD_TYPES: [{
		name: 'desert',
		label: 'desert',
		value: 'desert',
	}],

	CHR_BOARD_SIZES: [{
		name: 'small',
		label: 'small',
		value: 10,
	},
	{
		name: 'medium',
		label: 'medium',
		value: 20,
	},{
		name: 'large',
		label: 'large',
		value: 30,
	}]

}
