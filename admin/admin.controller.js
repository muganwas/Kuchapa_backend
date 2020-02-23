const express = require('express');
const router = express.Router();
const adminService = require('./admin.service');

// routes
router.post('/authenticate', authenticate);
router.get('/', getAll);
router.get('/:id', getById);
router.post('/update/:id', update);
// router.get('/register', register);
router.get('/dashboard/count', dashboard);
router.post('/changepassword/:id', ChangePassword);

module.exports = router;

function authenticate(req, res, next) {

    adminService.authenticate(req.body.userInfo)
        .then(user => user ? res.json(user) : res.status(400).json({ message: 'email and   is incorrect' }))
        .catch(err => next({result:false,message:err}));
}



function getAll(req, res, next) {
    adminService.getAll()
        .then(users => res.json(users))
        .catch(err => next(err));

}


function getById(req, res, next) {
    adminService.getById(req.params.id)
        .then(users => res.json(users))
        .catch(err => next(err));

}
function dashboard(req, res, next) {
    adminService.dashboard(req.params.id)
        .then(users => res.json(users))
        .catch(err => next(err));

}


function register(req, res, next) {
    adminService.create({name:"admin",email:"harfa@gmail.com",mobile:"1234567890",address:"indore",password:"admin"})
        .then(() => res.json({}))
        .catch(err => next(err));
}

function update(req, res, next) {
    adminService.update(req.params.id, req.body)
        .then((rslt) => res.json(rslt))
        .catch(err => next(err));
}

function ChangePassword(req, res, next) {
    adminService.ChangePassword(req.params.id, req.body)
        .then((rslt) => res.json(rslt))
        .catch(err => next(err));
}

