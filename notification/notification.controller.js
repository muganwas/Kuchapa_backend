const express = require('express');
const router = express.Router();
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

const GetEmployeeNotifications = (req, res, next) => {
    Notification.GetEmployeeNotifications(req.params.id)
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

const ReadNotification = (req, res, next) => {
    console.log('req --', req)
    Notification.ReadNotification(req.params.id)
        .then(resp => res.json(resp))
        .catch(err => next(err));
}

const DeleteNotification = (req, res, next) => {
    Notification.DeleteNotification(req.params.id)
        .then(resp => res.json(resp))
        .catch(err => next(err));
}

router.post('/addreviewrequest', AddReviewRequest);
router.get('/get-customer-notification/:id', GetCustomerNotification);
router.get('/get-admin-notification', GetAdminNotification);
router.post('/sendNotification', SendNotification);
router.get('/get-employee-notification/:id', GetEmployeeNotifications);
router.post('/read-notification/:id', ReadNotification);
router.post('/delete-notification/:id', DeleteNotification);

module.exports = router;