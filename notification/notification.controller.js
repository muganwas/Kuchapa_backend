const express = require('express');
const router = express.Router();
const Notification = require('./notification.service');
const { validateFirebaseUser } = require('misc/helperFunctions');
const { enums: { VALIDATION_ERROR, UNAUTHORIZED_ERROR }, constants: { VALIDATION_MESSAGE, UNAUTHORIZED_MESSAGE } } = require('_helpers/constants');


const AddReviewRequest = async (req, res, next) => {
    if (!req.headers.authorization) return next({ name: VALIDATION_ERROR, message: VALIDATION_MESSAGE }, req, res, next);
    if (!await validateFirebaseUser(req.headers.authorization)) return next({ name: UNAUTHORIZED_ERROR, message: UNAUTHORIZED_MESSAGE }, req, res, next);
    Notification.AddReviewRequest(req.body)
        .then(data => res.json(data))
        .catch(err => next(err));
}

const GetCustomerNotification = async (req, res, next) => {
    if (!req.headers.authorization) return next({ name: VALIDATION_ERROR, message: VALIDATION_MESSAGE }, req, res, next);
    if (!await validateFirebaseUser(req.headers.authorization)) return next({ name: UNAUTHORIZED_ERROR, message: UNAUTHORIZED_MESSAGE }, req, res, next);
    Notification.GetCustomerNotification(req.params.id)
        .then(data => res.json(data))
        .catch(err => next(err));
}

const GetEmployeeNotifications = async (req, res, next) => {
    if (!req.headers.authorization) return next({ name: VALIDATION_ERROR, message: VALIDATION_MESSAGE }, req, res, next);
    if (!await validateFirebaseUser(req.headers.authorization)) return next({ name: UNAUTHORIZED_ERROR, message: UNAUTHORIZED_MESSAGE }, req, res, next);
    Notification.GetEmployeeNotifications(req.params.id)
        .then(data => res.json(data))
        .catch(err => next(err));
}

const GetAdminNotification = async (req, res, next) => {
    if (!req.headers.authorization) return next({ name: VALIDATION_ERROR, message: VALIDATION_MESSAGE }, req, res, next);
    if (!await validateFirebaseUser(req.headers.authorization)) return next({ name: UNAUTHORIZED_ERROR, message: UNAUTHORIZED_MESSAGE }, req, res, next);
    Notification.GetAdminNotification(req.params.id)
        .then(data => res.json(data))
        .catch(err => next(err));
}

const SendNotification = async (req, res, next) => {
    if (!req.headers.authorization) return next({ name: VALIDATION_ERROR, message: VALIDATION_MESSAGE }, req, res, next);
    if (!await validateFirebaseUser(req.headers.authorization)) return next({ name: UNAUTHORIZED_ERROR, message: UNAUTHORIZED_MESSAGE }, req, res, next);
    Notification.PushNotif(req.body)
        .then(data => res.json(data))
        .catch(err => next(err));
}

const ReadNotification = async (req, res, next) => {
    if (!req.headers.authorization) return next({ name: VALIDATION_ERROR, message: VALIDATION_MESSAGE }, req, res, next);
    if (!await validateFirebaseUser(req.headers.authorization)) return next({ name: UNAUTHORIZED_ERROR, message: UNAUTHORIZED_MESSAGE }, req, res, next);
    Notification.ReadNotification(req.params.id)
        .then(data => res.json(data))
        .catch(err => next(err));
}

const DeleteNotification = async (req, res, next) => {
    if (!req.headers.authorization) return next({ name: VALIDATION_ERROR, message: VALIDATION_MESSAGE }, req, res, next);
    if (!await validateFirebaseUser(req.headers.authorization)) return next({ name: UNAUTHORIZED_ERROR, message: UNAUTHORIZED_MESSAGE }, req, res, next);
    Notification.DeleteNotification(req.params.id)
        .then(data => res.json(data))
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