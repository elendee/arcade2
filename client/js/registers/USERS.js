import env from '../env.js?v=26'
// import User from './classes/User.js?v=26'

const users = {}

if( env.EXPOSE ) window.USERS = users

export default users