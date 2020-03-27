const express = require('express');
const router = express.Router();
const userService = require('./contact.service');
var multer  = require('../node_modules/multer');


// routes
router.post('/', register);
router.delete('/:id', _delete);

module.exports = router;

function register(req, res, next) {
        userService.create(req.body)
        .then((user) => res.json(user))
        .catch(err => next(err));
}


function _delete(req, res, next) {
    userService.delete(req.params.id)
        .then(() => res.json({}))
        .catch(err => next(err));
}