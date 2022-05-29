const env = require('../.env.js')

const {
	Vector3,
} = require('three')

module.exports = {

	pulse: {
		spawn: {
			traffic: 5 * 1000,
			defense: ( env.LOCAL ? 3 : 20 ) * 1000,
			enemy: ( env.LOCAL ? 3 : 30 ) * 1000,
			pirate: ( env.LOCAL ? 3 : 30 ) * 1000,
			entropic: 5 * 1000,
		},
		misc: {
			streetsweeper: ( env.LOCAL ? 5 : 30 ) * 1000,
			projectiles: 900
		},
		GAME: env.PULSE_GAME || 15 * 1000,
		// MOVE: 2000,
	},

	momentum: {
		ship: new Vector3( 0, 0, .1 ),
		entropic: new Vector3( 0, 0, .1 )
	},

	names: {
		pilots:{
			handle: {
				male: ['Otker','Ansovald','Bosco','Thierry','Fastolph','Grimald','Erenfried','Tolman','Calamity','Liutgarde','Lanthechilde','Garivald','Lothar','Brutus','Giseler','Isengrim','Iago','Filibert','Theodebert','Tassilo','Amand','Theudechild'],
				female: ['Meginhurd','Alexsta','Brunhilda','Ellinrat','Fiona','Ruothilde','Erica','Theodelinda', 'Flodoard','Mentha', 'Melba','Adaltrude', 'Chunsina','Brianna', 'Tara','Tasha','Bertha','Ruby']
			},
			// lname: ['Boulderhill','Longfoot','Greenhand','Puddlefoot','Longriver','Goodsong','Fleetfoot','Noakesburrow','Lothran','Hornwood','Cotton','Wanderfoot','Brown','Lightfoot','Langham','Townsend','Twofoot','Took-Brandybuck','Oldbuck','Rumble','Gluttonbelly','Brandagamba','Riverhopper','Took-Took','Boffin','Bramblethorn','Silverstring','Gardner','Featherbottom','Proudbottom','Boffin','Bophin','Greenhill','Noakesburrow','Bolger','Sandyman','Gamwich','Longriver','Goldworthy','Swiftfoot']
		},
		ships: [
			'Clipper', 
			'Bertha', 
			'Tequila Sunrise', 
			'Margaritaville', 
			'Star Hopper', 
			'Void Crosser',
			'Spite',
			'Glory Days',
			'L33tcoin',
			'T-800',
			'Hal',
			'Rift Wanderer',
			'Rusty Scupper',
			'Social Distance',
			'Petty Vengeance',
		]
	},

	name_length: 25,

	DEFAULT_SHIP: 'neutral_scout',

	ALLOWED_PILOTS: [0, 1, 3, 10],

	RENDER_RANGE: 200,

	START_RADIUS: 100,

	SYSTEM_CAP: 5,

	TICK_TIME: 1000,

	ITEM_TICK_TIME: env.LOCAL ? 2000 : 9 * 1000,

	ITEM_RANGE: 10 * 1000,

}