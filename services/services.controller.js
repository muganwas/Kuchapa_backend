const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const userService = require('./service.service');
const { validateFirebaseUser, fetchCountryCodes, distance } = require('misc/helperFunctions');
const { enums: { VALIDATION_ERROR, UNAUTHORIZED_ERROR }, constants: { VALIDATION_MESSAGE, UNAUTHORIZED_MESSAGE } } = require('_helpers/constants');

// routes
router.post('/create', create);
router.get('/', getAll);
router.get('/getall', getAllService);
router.get('/:id', getById);
router.get('/countryCodes/all', getCountryCodes);
router.post('/distance', getDistance);
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

async function getCountryCodes(req, res, next) {
    try {
        const countryCodeData = await fetchCountryCodes();
        res.json(countryCodeData);
    } catch (e) {
        next(e);
    }
}

async function getDistance(req, res, next) {
    if (!req.headers.authorization) return next({ name: VALIDATION_ERROR, message: VALIDATION_MESSAGE }, req, res, next);
    if (!await validateFirebaseUser(req.headers.authorization)) return next({ name: UNAUTHORIZED_ERROR, message: UNAUTHORIZED_MESSAGE }, req, res, next);
    try {
        const { user_lat, user_lang, emp_data } = req.body;
        console.log('onld ', { emp_data })
        await emp_data.forEach(async (emp, i) => {
            const { _id } = emp;
            const result = await admin.database()
                .ref(`liveLocation/${_id}`)
                .once('value');
            const { latitude, longitude, address } = result.val();
            const dist = await distance(user_lat, user_lang, latitude, longitude, 'K');
            emp_data[i].hash = dist;
            emp_data[i].currentAddress = address;
        });
        console.log('new ', { emp_data });
    } catch (e) {
        return { result: false, message: e.message };
    }
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
