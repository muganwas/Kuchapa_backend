const express = require('express');
const router = express.Router();
const path = require('path');
const userService = require('./user.service');
const { createSession, validateFirebaseUser } = require('misc/helperFunctions');
const { enums: { VALIDATION_ERROR, UNAUTHORIZED_ERROR }, constants: { VALIDATION_MESSAGE, UNAUTHORIZED_MESSAGE } } = require('_helpers/constants');

router.post('/authenticate', authenticate);
router.post('/createSession', authCreateSession);
router.post('/register', register);
router.get('/', getAll);
router.get('/verification/:id', Verification);
router.get('/:id', getById);
router.post('/:id', update);
router.post('/check/mobile', CheckMobile);
router.post('/forgot_password/email', ForgotPassword);
router.put('/upload', uploadImage);
router.delete('/:id', _delete);

module.exports = router;

async function authenticate(req, res, next) {
    if (!req.headers.authorization) return next({ name: VALIDATION_ERROR, message: VALIDATION_MESSAGE }, req, res, next);
    if (!await validateFirebaseUser(req.headers.authorization)) return next({ name: UNAUTHORIZED_ERROR, message: UNAUTHORIZED_MESSAGE }, req, res, next);
    userService.authenticate(req.body)
        .then(data => res.json(data))
        .catch(err => next(err));
}

async function authCreateSession(req, res, next) {
    if (!req.headers.authorization) return next({ name: VALIDATION_ERROR, message: VALIDATION_MESSAGE }, req, res, next);
    if (!await validateFirebaseUser(req.headers.authorization)) return next({ name: UNAUTHORIZED_ERROR, message: UNAUTHORIZED_MESSAGE }, req, res, next);
    createSession(req.body).then(session => res.json(session)).catch(err => next(err));
}

function register(req, res, next) {
    userService.create(req.body)
        .then(data => res.json(data))
        .catch(err => next(err));
}

async function CheckMobile(req, res, next) {
    if (!req.headers.authorization) return next({ name: VALIDATION_ERROR, message: VALIDATION_MESSAGE }, req, res, next);
    if (!await validateFirebaseUser(req.headers.authorization)) return next({ name: UNAUTHORIZED_ERROR, message: UNAUTHORIZED_MESSAGE }, req, res, next);
    userService.CheckMobile(req.body)
        .then((data) => res.json(data))
        .catch(err => next(err));
}
async function ForgotPassword(req, res, next) {
    userService.ForgotPassword(req.body)
        .then((data) => res.json(data))
        .catch(err => next(err));
}

async function getAll(req, res, next) {
    if (!req.headers.authorization) return next({ name: VALIDATION_ERROR, message: VALIDATION_MESSAGE }, req, res, next);
    if (!await validateFirebaseUser(req.headers.authorization)) return next({ name: UNAUTHORIZED_ERROR, message: UNAUTHORIZED_MESSAGE }, req, res, next);
    userService.getAll()
        .then(data => res.json(data))
        .catch(err => next(err));
}

async function Verification(req, res, next) {
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

async function update(req, res, next) {
    if (!req.headers.authorization) return next({ name: VALIDATION_ERROR, message: VALIDATION_MESSAGE }, req, res, next);
    if (!await validateFirebaseUser(req.headers.authorization)) return next({ name: UNAUTHORIZED_ERROR, message: UNAUTHORIZED_MESSAGE }, req, res, next);
    userService.update(req.params.id, req.body)
        .then((data) => res.json(data))
        .catch(err => next(err));
}

async function uploadImage(req, res, next) {
    if (!req.headers.authorization) return next({ name: VALIDATION_ERROR, message: VALIDATION_MESSAGE }, req, res, next);
    if (!await validateFirebaseUser(req.headers.authorization)) return next({ name: UNAUTHORIZED_ERROR, message: UNAUTHORIZED_MESSAGE }, req, res, next);
    userService.uploadImage(req.body)
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