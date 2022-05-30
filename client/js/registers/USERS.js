import env from '../env.js?v=25'
// import User from './classes/User.js?v=25'

const users = {}

if( env.EXPOSE ) window.USERS = users

export default users