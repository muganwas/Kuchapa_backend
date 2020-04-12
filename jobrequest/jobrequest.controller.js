const express = require('express');
const router = express.Router();
const JobRequest = require('./jobrequest.service');


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

function serviceprovider(req, res, next) {
    JobRequest.serviceprovider(req.params.id,req.body)
        .then(users => res.json(users))
        .catch(err => next(err));
}

function getEmpReviews(req, res, next){
    JobRequest.employeeRatingsDataRequest(req.params.id)
        .then(data => res.json(data))
        .catch(err => next(err))
}

function AddJobRequest(req, res, next) {
    JobRequest.AddJobRequest(req.body)
        .then(users => res.json(users))
        .catch(err => next(err));
}

function UpdateJobRequest(req, res, next) {
    JobRequest.UpdateJobRequest(req.body)
        .then(users => res.json(users))
        .catch(err => next(err));
}
function Ratingreview(req, res, next) {
    JobRequest.Ratingreview(req.body)
        .then(users => res.json(users))
        .catch(err => next(err));
}
function CustomerJobRequest(req, res, next) {
    JobRequest.CustomerJobRequest(req.params.id)
        .then(users => res.json(users))
        .catch(err => next(err));
}
function EmployeeDataRequest(req, res, next) {
    JobRequest.EmployeeDataRequest(req.params.id)
        .then(users => res.json(users))
        .catch(err => next(err));
}
function Usergroupby(req, res, next) {
    JobRequest.Usergroupby(req.params.id)
        .then(users => res.json(users))
        .catch(err => next(err));
}
function Userstatuscheck(req, res, next) {
    JobRequest.Userstatuscheck(req.params.id)
        .then(users => res.json(users))
        .catch(err => next(err));
}
function Customerstatuscheck(req, res, next) {
    JobRequest.Customerstatuscheck(req.params.id)
        .then(users => res.json(users))
        .catch(err => next(err));
}

function Addrating(req, res, next) {
    JobRequest.Addrating(req.body)
        .then(users => res.json(users))
        .catch(err => next(err));
}

router.post('/serviceprovider/:id', serviceprovider);
router.post('/addjobrequest', AddJobRequest);
router.post('/updatejobrequest', UpdateJobRequest);
router.post('/ratingreview', Ratingreview);
router.get('/customer_request/:id', CustomerJobRequest);
router.get('/employeeReviews/:id', getEmpReviews);
router.get('/employee_request/:id', EmployeeDataRequest);
router.get('/usergroupby/:id', Usergroupby);
router.get('/addrating/:id/:rating/:review', Addrating);
router.get('/user_status_check/:id', Userstatuscheck);
router.get('/customer_status_check/:id', Customerstatuscheck);

module.exports = router;