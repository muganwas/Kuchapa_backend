const express = require('express');
const router = express.Router();
const path = require('path');
const employeeService = require('./employee.service');
const { validateFirebaseUser } = require('misc/helperFunctions');
const { enums: { VALIDATION_ERROR, UNAUTHORIZED_ERROR }, constants: { VALIDATION_MESSAGE, UNAUTHORIZED_MESSAGE } } = require('_helpers/constants');

// routes
router.post('/authenticate', authenticate);
router.post('/register', register);
router.get('/', getAll);
router.get('/:id', getById);
router.get('/verification/:id', Verification);
router.post('/:id', update);
router.post('/check/email', checkEmail);
router.post('/push/notification', PushNotif);
router.put('/upload', uploadImage);
router.post('/delete/:id', _delete);
router.post('/forgot_password/email', ForgotPassword);

module.exports = router;

async function authenticate(req, res, next) {
    if (!req.headers.authorization) return next({ name: VALIDATION_ERROR, message: VALIDATION_MESSAGE }, req, res, next);
    if (!await validateFirebaseUser(req.headers.authorization)) return next({ name: UNAUTHORIZED_ERROR, message: UNAUTHORIZED_MESSAGE }, req, res, next);
    employeeService.authenticate(req.body)
        .then(data => res.json(data))
        .catch(err => next(err));
}

function register(req, res, next) {
    console.log('creating ...')
    employeeService.create(req.body)
        .then((data) => {
            console.log({ data })
            return res.json(data)
        })
        .catch(err => next(err));
}

async function Verification(req, res, next) {
    employeeService.Verification(req.params.id)
        .then(user => {
            if (user) {
                if (user.result) res.sendFile(path.join(__dirname, '../public/Successful.html'));
                else res.json(user);
            }
            else res.sendStatus(404);
        })
        .catch(err => next(err));
}

async function checkEmail(req, res, next) {
    if (!req.headers.authorization) return next({ name: VALIDATION_ERROR, message: VALIDATION_MESSAGE }, req, res, next);
    if (!await validateFirebaseUser(req.headers.authorization)) return next({ name: UNAUTHORIZED_ERROR, message: UNAUTHORIZED_MESSAGE }, req, res, next);
    employeeService.checkEmail(req.body)
        .then((data) => res.json(data))
        .catch(err => next(err));
}

async function getAll(req, res, next) {
    if (!req.headers.authorization) return next({ name: VALIDATION_ERROR, message: VALIDATION_MESSAGE }, req, res, next);
    if (!await validateFirebaseUser(req.headers.authorization)) return next({ name: UNAUTHORIZED_ERROR, message: UNAUTHORIZED_MESSAGE }, req, res, next);
    employeeService.getAll()
        .then(data => res.json(data))
        .catch(err => next(err));
}

async function PushNotif(req, res, next) {
    if (!req.headers.authorization) return next({ name: VALIDATION_ERROR, message: VALIDATION_MESSAGE }, req, res, next);
    if (!await validateFirebaseUser(req.headers.authorization)) return next({ name: UNAUTHORIZED_ERROR, message: UNAUTHORIZED_MESSAGE }, req, res, next);
    employeeService.PushNotif(req.body)
        .then(user => res.json(user))
        .catch(err => next(err));
}

async function getById(req, res, next) {
    if (!req.headers.authorization) return next({ name: VALIDATION_ERROR, message: VALIDATION_MESSAGE }, req, res, next);
    if (!await validateFirebaseUser(req.headers.authorization)) return next({ name: UNAUTHORIZED_ERROR, message: UNAUTHORIZED_MESSAGE }, req, res, next);
    employeeService.getById(req.params.id, req.query)
        .then(user => user ? res.json(user) : res.sendStatus(404))
        .catch(err => next(err));
}

async function update(req, res, next) {
    if (!req.headers.authorization) return next({ name: VALIDATION_ERROR, message: VALIDATION_MESSAGE }, req, res, next);
    if (!await validateFirebaseUser(req.headers.authorization)) return next({ name: UNAUTHORIZED_ERROR, message: UNAUTHORIZED_MESSAGE }, req, res, next);
    employeeService.update(req.params.id, req.body)
        .then((data) => res.json(data))
        .catch(err => next(err));
}

async function uploadImage(req, res, next) {
    if (!req.headers.authorization) return next({ name: VALIDATION_ERROR, message: VALIDATION_MESSAGE }, req, res, next);
    if (!await validateFirebaseUser(req.headers.authorization)) return next({ name: UNAUTHORIZED_ERROR, message: UNAUTHORIZED_MESSAGE }, req, res, next);
    employeeService.uploadImage(req.body)
        .then((data) => res.json(data))
        .catch(err => next(err));
}

async function ForgotPassword(req, res, next) {
    employeeService.ForgotPassword(req.body)
        .then((data) => res.json(data))
        .catch(err => next(err));
}

async function _delete(req, res, next) {
    if (!req.headers.authorization) return next({ name: VALIDATION_ERROR, message: VALIDATION_MESSAGE }, req, res, next);
    if (!await validateFirebaseUser(req.headers.authorization)) return next({ name: UNAUTHORIZED_ERROR, message: UNAUTHORIZED_MESSAGE }, req, res, next);
    employeeService._delete(req.params.id)
        .then((data) => res.json(data))
        .catch(err => next(err));
}