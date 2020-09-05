const express = require('express');
const router = express.Router();
const JobRequest = require('../jobrequest/jobrequest.service');
const Notification = require('./notification.service');


const multer = require('../node_modules/multer');

const Storage = multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, "./uploads/services/");
    },
    filename: function (req, file, callback) {
        callback(null, file.fieldname + "_" + Date.now() + "_" + file.originalname);
    }
});

var upload = multer({ storage: Storage });

const AddReviewRequest = (req, res, next) => {
    Notification.AddReviewRequest(req.body)
        .then(users => res.json(users))
        .catch(err => next(err));
}

const GetCustomerNotification = (req, res, next) => {
    Notification.GetCustomerNotification(req.params.id)
        .then(users => res.json(users))
        .catch(err => next(err));
}

const GetAdminNotification = (req, res, next) => {
    Notification.GetAdminNotification(req.params.id)
        .then(users => res.json(users))
        .catch(err => next(err));
}

const SendNotification = (req, res, next) => {
    Notification.PushNotif(req.body)
        .then(resp => res.json(resp))
        .catch(err => next(err));
}

router.post('/addreviewrequest', AddReviewRequest);
router.get('/get-customer-notification/:id', GetCustomerNotification);
router.get('/get-admin-notification', GetAdminNotification);
router.post('/sendNotification', SendNotification)

module.exports = router;