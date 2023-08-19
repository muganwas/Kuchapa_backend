const express = require('express');
const router = express.Router();
const Job = require('./job.service');

router.post('/serviceprovider/:id', serviceprovider);

module.exports = router;


//functions


function serviceprovider(req, res, next) {
    Job.serviceprovider(req.params.id, req.body)
        .then(users => res.json(users))
        .catch(err => next(err));
}






