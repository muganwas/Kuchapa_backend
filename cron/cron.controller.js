const express = require('express');
const router = express.Router();
const Cron = require('./cron.service');



//routes
// router.get('/', getAll);

router.get('/changereqstatus', ChnageReqStatus);

module.exports = router;


//functions

function ChnageReqStatus(req, res, next) {
    Cron.ChnageReqStatus(req.query.param)
        .then(users => res.json(users))
        .catch(err => next(err));
}






