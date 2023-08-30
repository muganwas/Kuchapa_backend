const express = require('express');
const router = express.Router();
const ThirdPartyApi = require('./thirdpartyapi.service');
const { validateFirebaseUser } = require('misc/helperFunctions');
const { enums: { VALIDATION_ERROR, UNAUTHORIZED_ERROR }, constants: { VALIDATION_MESSAGE, UNAUTHORIZED_MESSAGE } } = require('_helpers/constants');

router.post('/sendsms', SendSMS);
router.post('/sendmail', sendmail);
module.exports = router;

//functions
async function SendSMS(req, res, next) {
    if (!req.headers.authorization) return next({ name: VALIDATION_ERROR, message: VALIDATION_MESSAGE }, req, res, next);
    if (!await validateFirebaseUser(req.headers.authorization)) return next({ name: UNAUTHORIZED_ERROR, message: UNAUTHORIZED_MESSAGE }, req, res, next);
    ThirdPartyApi.SendSMS(req.body)
        .then(data => res.json(data))
        .catch(err => next(err));
}

async function sendmail(req, res, next) {
    if (!req.headers.authorization) return next({ name: VALIDATION_ERROR, message: VALIDATION_MESSAGE }, req, res, next);
    if (!await validateFirebaseUser(req.headers.authorization)) return next({ name: UNAUTHORIZED_ERROR, message: UNAUTHORIZED_MESSAGE }, req, res, next);
    ThirdPartyApi.SendMail(req.body)
        .then(data => res.json(data))
        .catch(err => next(err));
}