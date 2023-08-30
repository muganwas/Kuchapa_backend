const express = require('express');
const router = express.Router();
const userService = require('./contact.service');
const { validateFirebaseUser } = require('misc/helperFunctions');
const { enums: { VALIDATION_ERROR, UNAUTHORIZED_ERROR }, constants: { VALIDATION_MESSAGE, UNAUTHORIZED_MESSAGE } } = require('_helpers/constants');


// routes
router.post('/', register);
router.delete('/:id', _delete);

module.exports = router;

async function register(req, res, next) {
        if (!req.headers.authorization) return next({ name: VALIDATION_ERROR, message: VALIDATION_MESSAGE }, req, res, next);
        if (!await validateFirebaseUser(req.headers.authorization)) return next({ name: UNAUTHORIZED_ERROR, message: UNAUTHORIZED_MESSAGE }, req, res, next);
        userService.create(req.body)
                .then((data) => res.json(data))
                .catch(err => next(err));
}

async function _delete(req, res, next) {
        if (!req.headers.authorization) return next({ name: VALIDATION_ERROR, message: VALIDATION_MESSAGE }, req, res, next);
        if (!await validateFirebaseUser(req.headers.authorization)) return next({ name: UNAUTHORIZED_ERROR, message: UNAUTHORIZED_MESSAGE }, req, res, next);
        userService._delete(req.params.id)
                .then((data) => res.json(data))
                .catch(err => next(err));
}