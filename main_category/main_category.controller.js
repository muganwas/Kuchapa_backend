const express = require('express');
const router = express.Router();
const main_categoryService = require('./main_category.service');
const { validateFirebaseUser } = require('misc/helperFunctions');
const { enums: { VALIDATION_ERROR, UNAUTHORIZED_ERROR }, constants: { VALIDATION_MESSAGE, UNAUTHORIZED_MESSAGE } } = require('_helpers/constants');

// routes
router.post('/create', create);
router.get('/', getAll);
router.get('/:id', getById);
router.put('/', update);
router.delete('/delete/:id', _delete);

module.exports = router;

async function create(req, res, next) {
    if (!req.headers.authorization) return next({ name: VALIDATION_ERROR, message: VALIDATION_MESSAGE }, req, res, next);
    if (!await validateFirebaseUser(req.headers.authorization)) return next({ name: UNAUTHORIZED_ERROR, message: UNAUTHORIZED_MESSAGE }, req, res, next);
    main_categoryService.create(req.body)
        .then((data) => res.json(data))
        .catch(err => next(err));
}

async function getAll(req, res, next) {
    main_categoryService.getAll(req.query)
        .then(data => res.json(data))
        .catch(err => next(err));
}

async function getById(req, res, next) {
    main_categoryService.getById(req.params.id)
        .then(data => res.json(data))
        .catch(err => next(err));
}

async function update(req, res, next) {
    if (!req.headers.authorization) return next({ name: VALIDATION_ERROR, message: VALIDATION_MESSAGE }, req, res, next);
    if (!await validateFirebaseUser(req.headers.authorization)) return next({ name: UNAUTHORIZED_ERROR, message: UNAUTHORIZED_MESSAGE }, req, res, next);
    main_categoryService.update(req.body)
        .then((data) => res.json(data))
        .catch(err => next(err));
}

async function _delete(req, res, next) {
    if (!req.headers.authorization) return next({ name: VALIDATION_ERROR, message: VALIDATION_MESSAGE }, req, res, next);
    if (!await validateFirebaseUser(req.headers.authorization)) return next({ name: UNAUTHORIZED_ERROR, message: UNAUTHORIZED_MESSAGE }, req, res, next);
    main_categoryService._delete(req.params.id)
        .then((data) => res.json(data))
        .catch(err => next(err));
}
