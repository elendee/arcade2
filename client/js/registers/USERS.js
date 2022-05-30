import env from '../env.js?v=27'
// import User from './classes/User.js?v=27'

const users = {}

if( env.EXPOSE ) window.USERS = users

export default users