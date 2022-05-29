import env from './env.js?v=24'

const user = {}

if( env.EXPOSE ) window.USER = user

export default user