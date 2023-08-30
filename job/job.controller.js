const express = require('express');
const router = express.Router();
const Job = require('./job.service');
const { validateFirebaseUser } = require('misc/helperFunctions');
const { enums: { VALIDATION_ERROR, UNAUTHORIZED_ERROR }, constants: { VALIDATION_MESSAGE, UNAUTHORIZED_MESSAGE } } = require('_helpers/constants');

router.post('/serviceprovider/:id', serviceprovider);

module.exports = router;

//functions
async function serviceprovider(req, res, next) {
    if (!req.headers.authorization) return next({ name: VALIDATION_ERROR, message: VALIDATION_MESSAGE }, req, res, next);
    if (!await validateFirebaseUser(req.headers.authorization)) return next({ name: UNAUTHORIZED_ERROR, message: UNAUTHORIZED_MESSAGE }, req, res, next);
    Job.serviceprovider(req.params.id, req.body)
        .then(users => res.json(users))
        .catch(err => next(err));
}






