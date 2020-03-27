const expressJwt = require('express-jwt');
const config = require('../config');
const userService = require('../users/user.service');
const adminService = require('../admin/admin.service');

module.exports = jwt;

// function jwt() {
//     const secret = config.secret;

//     return expressJwt({ secret  , isRevoked }).unless({
//         path: [
//             // public routes that don't require authentication
//             '/admin/authenticate',
//             '/admin/',
//             '/admin/:id',
//             '/users/register',
//             '/users/authenticate',
//             '/users/',
//             '/users/:id'
//          ]
//     });
// }

// async function isRevoked(req, payload, done) {
//     const user = await userService.getById(payload.sub);

//     // revoke token if user no longer exists
//     if (!user) {
//         return done(null, true);
//     }

//     done();
// };