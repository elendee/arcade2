import env from '../env.js?v=30'
// import User from './classes/User.js?v=30'

const users = {}

if( env.EXPOSE ) window.USERS = users

export default users