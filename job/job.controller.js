const express = require('express');
const router = express.Router();
const Job = require('./job.service');


var multer  = require('../node_modules/multer');

var Storage = multer.diskStorage({
destination: function (req, file, callback) {
callback(null, "./uploads/services/");
},
filename: function (req, file, callback) {
callback(null, file.fieldname + "_" + Date.now() + "_" + file.originalname);
}
});

var upload = multer({ storage: Storage }); 

router.post('/serviceprovider/:id', serviceprovider);

module.exports = router;


//functions


function serviceprovider(req, res, next) {
    Job.serviceprovider(req.params.id, req.body)
        .then(users => res.json(users))
        .catch(err => next(err));
}






