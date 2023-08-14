const express = require('express');
const router = express.Router();
const path = require('path');
const employeeService = require('./employee.service');

// routes
router.post('/authenticate', authenticate);
router.post('/register', register);
router.get('/', getAll);
router.get('/current', getCurrent);
router.get('/:id', getById);
router.get('/verification/:id', Verification);
router.post('/:id', update);
router.post('/check/email', checkEmail);
router.post('/push/notification', PushNotif);
router.put('/upload', uploadImage);
router.post('/delete/:id', _delete);
router.post('/forgot_password/email', ForgotPassword);

module.exports = router;

function authenticate(req, res, next) {
    employeeService.authenticate(req.body)
        .then(user => user ? res.json(user) : res.status(400).json({ message: 'Username or password is incorrect' }))
        .catch(err => next(err));
}

function register(req, res, next) {
    employeeService.create(req.body)
        .then((user) => res.json(user))
        .catch(err => next(err));
}

function Verification(req, res, next) {
    employeeService.Verification(req.params.id)
        .then(user => {
            if (user) {
                if (user.result) res.sendFile(path.join(__dirname, '../public/Successful.html'));
                else res.json(user);
            }
            else res.sendStatus(404);
        })
        .catch(err => next(err));
}

function checkEmail(req, res, next) {
    employeeService.checkEmail(req.body)
        .then((user) => res.json(user))
        .catch(err => next(err));
}

function getAll(req, res, next) {
    employeeService.getAll()
        .then(users => res.json(users))
        .catch(err => next(err));
}

function getCurrent(req, res, next) {
    employeeService.getById(req.user.sub)
        .then(user => user ? res.json(user) : res.sendStatus(404))
        .catch(err => next(err));
}

function PushNotif(req, res, next) {
    employeeService.PushNotif(req.body)
        .then(user => res.json(user))
        .catch(err => next(err));
}

function getById(req, res, next) {

    employeeService.getById(req.params.id, req.query)
        .then(user => user ? res.json(user) : res.sendStatus(404))
        .catch(err => next(err));
}

function update(req, res, next) {
    // employeeService.update(req.params.id, req.body)
    employeeService.update(req.params.id, req.body)
        .then((data) => data ? res.json(data) : res.sendStatus(404))
        .catch(err => next(err));
}

function uploadImage(req, res, next) {
    employeeService.uploadImage(req.body)
        .then((data) => data ? res.json(data) : res.sendStatus(404))
        .catch(err => next(err));

}


function ForgotPassword(req, res, next) {
    employeeService.ForgotPassword(req.body)
        .then((user) => {
            if (user)
                res.json(user)
            res.send({ message: 'Nothing was returned' })
        })
        .catch(err => next(err));
}

function _delete(req, res, next) {
    employeeService.delete(req.params.id)
        .then(() => res.json({}))
        .catch(err => next(err));
}