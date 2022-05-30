import env from './env.js?v=28'
import User from './classes/User.js?v=28'

const user = new User()
user.player1 = true

if( env.EXPOSE ) window.USER = user

export default user