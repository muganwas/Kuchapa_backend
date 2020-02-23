const express = require('express');
const router = express.Router();
const JobRequest = require('../jobrequest/jobrequest.service');
const Notification = require('./notification.service');


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

router.post('/addreviewrequest', AddReviewRequest);
router.get('/get-customer-notification/:id', GetCustomerNotification);
router.get('/get-admin-notification', GetAdminNotification);

module.exports = router;


//functions

function AddReviewRequest(req, res, next) {
    Notification.AddReviewRequest(req.body)
        .then(users => res.json(users))
        .catch(err => next(err));
}

function GetCustomerNotification(req, res, next) {
    Notification.GetCustomerNotification(req.params.id)
        .then(users => res.json(users))
        .catch(err => next(err));
}

function GetAdminNotification(req, res, next) {
    Notification.GetAdminNotification(req.params.id)
        .then(users => res.json(users))
        .catch(err => next(err));
}






