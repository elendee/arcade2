import env from '../env.js?v=24'
// import User from './classes/User.js?v=24'

const users = {}

if( env.EXPOSE ) window.USERS = users

export default users