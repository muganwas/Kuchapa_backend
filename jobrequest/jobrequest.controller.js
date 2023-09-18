const express = require('express');
const router = express.Router();
const JobRequest = require('./jobrequest.service');
const { validateFirebaseUser } = require('misc/helperFunctions');
const { enums: { VALIDATION_ERROR, UNAUTHORIZED_ERROR }, constants: { VALIDATION_MESSAGE, UNAUTHORIZED_MESSAGE } } = require('_helpers/constants');

async function serviceprovider(req, res, next) {
    if (!req.headers.authorization) return next({ name: VALIDATION_ERROR, message: VALIDATION_MESSAGE }, req, res, next);
    if (!await validateFirebaseUser(req.headers.authorization)) return next({ name: UNAUTHORIZED_ERROR, message: UNAUTHORIZED_MESSAGE }, req, res, next);
    JobRequest.ServiceProvider(req.params.id, req.body)
        .then(data => res.json(data))
        .catch(err => next(err));
}

async function getEmpReviews(req, res, next) {
    if (!req.headers.authorization) return next({ name: VALIDATION_ERROR, message: VALIDATION_MESSAGE }, req, res, next);
    if (!await validateFirebaseUser(req.headers.authorization)) return next({ name: UNAUTHORIZED_ERROR, message: UNAUTHORIZED_MESSAGE }, req, res, next);
    JobRequest.EmployeeRatingsDataRequest(req.params.id)
        .then(data => res.json(data))
        .catch(err => next(err))
}

async function AddJobRequest(req, res, next) {
    if (!req.headers.authorization) return next({ name: VALIDATION_ERROR, message: VALIDATION_MESSAGE }, req, res, next);
    if (!await validateFirebaseUser(req.headers.authorization)) return next({ name: UNAUTHORIZED_ERROR, message: UNAUTHORIZED_MESSAGE }, req, res, next);
    JobRequest.AddJobRequest(req.body)
        .then(data => res.json(data))
        .catch(err => next(err));
}

async function UpdateJobRequest(req, res, next) {
    if (!req.headers.authorization) return next({ name: VALIDATION_ERROR, message: VALIDATION_MESSAGE }, req, res, next);
    if (!await validateFirebaseUser(req.headers.authorization)) return next({ name: UNAUTHORIZED_ERROR, message: UNAUTHORIZED_MESSAGE }, req, res, next);
    JobRequest.UpdateJobRequest(req.body)
        .then(data => res.json(data))
        .catch(err => next(err));
}
async function Ratingreview(req, res, next) {
    if (!req.headers.authorization) return next({ name: VALIDATION_ERROR, message: VALIDATION_MESSAGE }, req, res, next);
    if (!await validateFirebaseUser(req.headers.authorization)) return next({ name: UNAUTHORIZED_ERROR, message: UNAUTHORIZED_MESSAGE }, req, res, next);
    JobRequest.RatingReview(req.body)
        .then(data => res.json(data))
        .catch(err => next(err));
}
async function CustomerDataRequest(req, res, next) {
    if (!req.headers.authorization) return next({ name: VALIDATION_ERROR, message: VALIDATION_MESSAGE }, req, res, next);
    if (!await validateFirebaseUser(req.headers.authorization)) return next({ name: UNAUTHORIZED_ERROR, message: UNAUTHORIZED_MESSAGE }, req, res, next);
    JobRequest.CustomerDataRequest(req.params, req.query)
        .then(data => res.json(data))
        .catch(err => next(err));
}
async function EmployeeDataRequest(req, res, next) {
    if (!req.headers.authorization) return next({ name: VALIDATION_ERROR, message: VALIDATION_MESSAGE }, req, res, next);
    if (!await validateFirebaseUser(req.headers.authorization)) return next({ name: UNAUTHORIZED_ERROR, message: UNAUTHORIZED_MESSAGE }, req, res, next);
    JobRequest.EmployeeDataRequest(req.params, req.query)
        .then(data => res.json(data))
        .catch(err => next(err));
}
async function Usergroupby(req, res, next) {
    if (!req.headers.authorization) return next({ name: VALIDATION_ERROR, message: VALIDATION_MESSAGE }, req, res, next);
    if (!await validateFirebaseUser(req.headers.authorization)) return next({ name: UNAUTHORIZED_ERROR, message: UNAUTHORIZED_MESSAGE }, req, res, next);
    JobRequest.UserGroupBy(req.params, req.query)
        .then(data => res.json(data))
        .catch(err => next(err));
}
async function Providerstatuscheck(req, res, next) {
    if (!req.headers.authorization) return next({ name: VALIDATION_ERROR, message: VALIDATION_MESSAGE }, req, res, next);
    if (!await validateFirebaseUser(req.headers.authorization)) return next({ name: UNAUTHORIZED_ERROR, message: UNAUTHORIZED_MESSAGE }, req, res, next);
    JobRequest.ProviderStatusCheck(req.params, req.query)
        .then(data => res.json(data))
        .catch(err => next(err));
}
async function Customerstatuscheck(req, res, next) {
    if (!req.headers.authorization) return next({ name: VALIDATION_ERROR, message: VALIDATION_MESSAGE }, req, res, next);
    if (!await validateFirebaseUser(req.headers.authorization)) return next({ name: UNAUTHORIZED_ERROR, message: UNAUTHORIZED_MESSAGE }, req, res, next);
    JobRequest.CustomerStatusCheck(req.params, req.query)
        .then(data => res.json(data))
        .catch(err => next(err));
}

async function Addrating(req, res, next) {
    if (!req.headers.authorization) return next({ name: VALIDATION_ERROR, message: VALIDATION_MESSAGE }, req, res, next);
    if (!await validateFirebaseUser(req.headers.authorization)) return next({ name: UNAUTHORIZED_ERROR, message: UNAUTHORIZED_MESSAGE }, req, res, next);
    JobRequest.AddRating(req.body)
        .then(data => res.json(data))
        .catch(err => next(err));
}

router.post('/serviceprovider/:id', serviceprovider);
router.post('/addjobrequest', AddJobRequest);
router.post('/updatejobrequest', UpdateJobRequest);
router.post('/ratingreview', Ratingreview);
router.get('/customer_request/:id/:omit', CustomerDataRequest);
router.get('/employeeReviews/:id', getEmpReviews);
router.get('/employee_request/:id/:omit', EmployeeDataRequest);
router.get('/usergroupby/:id', Usergroupby);
router.get('/addrating/:id/:rating/:review', Addrating);
router.get('/provider_status_check/:id/:type', Providerstatuscheck);
router.get('/customer_status_check/:id/:type', Customerstatuscheck);

module.exports = router;