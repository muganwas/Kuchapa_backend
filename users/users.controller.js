const express = require('express');
const router = express.Router();
const path = require('path');
const userService = require('./user.service');
const { createSession, validateFirebaseUser } = require('../misc/helperFunctions');
const { enums: { VALIDATION_ERROR, UNAUTHORIZED_ERROR }, constants: { VALIDATION_MESSAGE, UNAUTHORIZED_MESSAGE } } = require('_helpers/constants');

router.post('/authenticate', authenticate);
router.post('/createSession', authCreateSession);
router.post('/register/create', register);
router.get('/', getAll);
router.post('/get_search', get_search);
router.get('/verification/:id', Verification);
router.get('/current', getCurrent);
router.get('/:id', getById);
router.post('/:id', update);
router.post('/check/mobile', CheckMobile);
router.post('/forgot_password/email', ForgotPassword);
router.put('/upload', uploadImage);
router.delete('/:id', _delete);

module.exports = router;

function authenticate(req, res, next) {
    userService.authenticate(req.body)
        .then(info => res.json(info))
        .catch(err => next(err));
}

function authCreateSession(req, res, next) {
    createSession(req.body).then(session => res.json(session)).catch(err => next(err));
}

function register(req, res, next) {
    userService.create(req.body)
        .then(user => res.json(user))
        .catch(err => next(err));
}

function CheckMobile(req, res, next) {
    userService.CheckMobile(req.body)
        .then((user) => res.json(user))
        .catch(err => next(err));
}
function ForgotPassword(req, res, next) {
    userService.ForgotPassword(req.body)
        .then((user) => res.json(user))
        .catch(err => next(err));
}

function getAll(req, res, next) {
    userService.getAll()
        .then(users => res.json(users))
        .catch(err => next(err));
}

function get_search(req, res, next) {
    userService.get_search(req.body)
        .then(users => res.json(users))
        .catch(err => next(err));
}

function getCurrent(req, res, next) {
    userService.getById(req.user.sub)
        .then(user => user ? res.json(user) : res.sendStatus(404))
        .catch(err => next(err));
}

function Verification(req, res, next) {
    userService.Verification(req.params.id)
        .then(user => {
            if (user) {
                if (user.result) res.sendFile(path.join(__dirname, '../public/Successful.html'));
                else res.json(user);
            }
            else res.sendStatus(404)
        })
        .catch(err => next(err));
}
async function getById(req, res, next) {
    if (!req.headers.authorization) return next({ name: VALIDATION_ERROR, message: VALIDATION_MESSAGE }, req, res, next);
    if (!await validateFirebaseUser(req.headers.authorization)) return next({ name: UNAUTHORIZED_ERROR, message: UNAUTHORIZED_MESSAGE }, req, res, next);
    userService.getById(req.params.id, req.query)
        .then(info => res.json(info))
        .catch(err => next(err));
}

function update(req, res, next) {
    userService.update(req.params.id, req.body)
        .then((rslt) => rslt ? res.json(rslt) : res.sendStatus(404))
        .catch(err => next(err));
}

function uploadImage(req, res, next) {
    userService.uploadImage(req.body)
        .then((data) => data ? res.json(data) : res.sendStatus(404))
        .catch(err => next(err));
}

function _delete(req, res, next) {
    userService._delete(req.params.id)
        .then(() => res.json({}))
        .catch(err => next(err));
}