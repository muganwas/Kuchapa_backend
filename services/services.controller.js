const express = require('express');
const router = express.Router();
const userService = require('./service.service');
const { validateFirebaseUser } = require('misc/helperFunctions');
const { enums: { VALIDATION_ERROR, UNAUTHORIZED_ERROR }, constants: { VALIDATION_MESSAGE, UNAUTHORIZED_MESSAGE } } = require('_helpers/constants');

// routes
router.post('/create', create);
router.get('/', getAll);
router.get('/getall', getAllService);
router.get('/:id', getById);
router.put('/', update);
router.delete('/delete/:id', _delete);

module.exports = router;

function getAll(req, res, next) {
    userService.getAll(req.query)
        .then(data => res.json(data))
        .catch(err => next(err));
}

async function create(req, res, next) {
    if (!req.headers.authorization) return next({ name: VALIDATION_ERROR, message: VALIDATION_MESSAGE }, req, res, next);
    if (!await validateFirebaseUser(req.headers.authorization)) return next({ name: UNAUTHORIZED_ERROR, message: UNAUTHORIZED_MESSAGE }, req, res, next);
    if (req.file) {
        req.body.image = req.file.filename;
    }
    userService.create(req.body)
        .then(data => res.json(data))
        .catch(err => next(err));
}

async function getAllService(req, res, next) {
    userService.getAllService()
        .then(data => res.json(data))
        .catch(err => next(err));
}

async function getById(req, res, next) {
    userService.getById(req.params.id)
        .then(data => res.json(data))
        .catch(err => next(err));
}

async function update(req, res, next) {
    if (!req.headers.authorization) return next({ name: VALIDATION_ERROR, message: VALIDATION_MESSAGE }, req, res, next);
    if (!await validateFirebaseUser(req.headers.authorization)) return next({ name: UNAUTHORIZED_ERROR, message: UNAUTHORIZED_MESSAGE }, req, res, next);
    if (req.file) {
        req.body.image = req.file.filename;
    }
    userService.update(req.body)
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
