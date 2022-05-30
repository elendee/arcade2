import env from '../env.js?v=28'
// import User from './classes/User.js?v=28'

const users = {}

if( env.EXPOSE ) window.USERS = users

export default users