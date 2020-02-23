const express = require('express');
const router = express.Router();
const Cron = require('./cron.service');


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






