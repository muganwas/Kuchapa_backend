const express = require('express');
const router = express.Router();
const userService = require('./service.service');


var multer  = require('../node_modules/multer');
// console.log(multer);
var Storage = multer.diskStorage({
destination: function (req, file, callback) {
callback(null, "uploads/services/");
},
filename: function (req, file, callback) {
callback(null, file.fieldname + "_" + Date.now() + "_" + file.originalname);
}
});

var upload = multer({ storage: Storage }); 
// routes
router.post('/authenticate', authenticate);
router.post('/create',upload.single('image'), register);
router.get('/', getAll);
router.get('/getall', getAllService);
router.get('/current', getCurrent);
router.get('/:id', getById);
router.post('/:id',upload.single('image'), update);
router.get('/delete/:id', _delete);

module.exports = router;

function authenticate(req, res, next) {
    userService.authenticate(req.body)
        .then(user => user ? res.json(user) : res.status(400).json({ message: 'Username or password is incorrect' }))
        .catch(err => next(err));
}

function register(req, res, next) {
    if(req.file.filename){
       req.body.image = req.file.filename;    
    }else{
       req.body.image = 'no-image.jpeg';    
    }
    userService.create(req.body)
        .then((user) => res.json(user))
        .catch(err => next(err));
}

function getAll(req, res, next) {

    userService.getAll()
        .then(users => res.json(users))
        .catch(err => next(err));
}

function getAllService(req, res, next) {
    userService.getAllService()
        .then(users => res.json(users))
        .catch(err => next(err));
}

function getCurrent(req, res, next) {
    userService.getById(req.user.sub)
        .then(user => user ? res.json(user) : res.sendStatus(404))
        .catch(err => next(err));
}

function getById(req, res, next) {
    userService.getById(req.params.id)
        .then(user => user ? res.json(user) : res.sendStatus(404))
        .catch(err => next(err));
}

function update(req, res, next) {
    if(req.file){
       req.body.image = req.file.filename;    
    }
    

    userService.update(req.params.id, req.body)
        .then((rslt) => res.json(rslt))
        .catch(err => next(err));
}

function _delete(req, res, next) {
    userService._delete(req.params.id)
        .then((rslt) => res.json(rslt))
        .catch(err => next(err));
}
