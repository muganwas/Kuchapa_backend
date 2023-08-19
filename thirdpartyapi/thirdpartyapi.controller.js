const express = require('express');
const router = express.Router();
const ThirdPartyApi = require('./thirdpartyapi.service');

router.post('/sendsms', SendSMS);
router.post('/sendmail', sendmail);
module.exports = router;


//functions

function SendSMS(req, res, next) {
    ThirdPartyApi.SendSMS(req.body)
        .then(users => res.json(users))
        .catch(err => next(err));
}

function sendmail(req, res, next) {
    ThirdPartyApi.SendMail(req.body)
        .then(users => res.json(users))
        .catch(err => next(err));
}



