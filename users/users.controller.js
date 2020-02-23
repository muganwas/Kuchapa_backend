const express = require('express');
const router = express.Router();
const userService = require('./user.service');
var multer  = require('../node_modules/multer');
// console.log(multer);
var Storage = multer.diskStorage({
destination: function (req, file, callback) {
callback(null, "uploads/users/");
},
filename: function (req, file, callback) {
callback(null, file.fieldname + "_" + Date.now() + "_" + file.originalname);
}
});
var upload = multer({ storage: Storage });
// routes
router.post('/authenticate', authenticate);
router.post('/register/create', upload.single('image'), register);
router.get('/', getAll);
router.get('/verification/:id', Verification);
router.get('/current', getCurrent);
router.get('/:id', getById);
router.post('/:id', update);
router.post('/check/mobile', CheckMobile);
router.post('/forgot_password/email', ForgotPassword);
router.post('/upload/:id',upload.single('image'), uploadImage);
router.delete('/:id', _delete);

module.exports = router;

function authenticate(req, res, next) {
    userService.authenticate(req.body)
        .then(user => user ? res.json(user) : res.status(400).json({ message: 'Username or password is incorrect' }))
        .catch(err => next(err));
}

function register(req, res, next) {
   
   if(req.body.type == 'normal')
   {
   if(req.file.filename){
     var  image = req.file.filename;    
    }else{
     var image = '';    
    }
   }
      console.log(req.body);
    userService.create(req.body,image)
        .then((user) => res.json(user))
        .catch(err => next(err));
}

function CheckMobile(req, res, next) {
    userService.CheckMobile(req.body)
        .then((user) => res.json(user))
        .catch(err => next(err));
}
function ForgotPassword(req, res, next) {
    userService.ForgotPassword(req.body)
        .then((user) => res.json(user))
        .catch(err => next(err));
}

function getAll(req, res, next) {
    userService.getAll()
        .then(users => res.json(users))
        .catch(err => next(err));
}

function getCurrent(req, res, next) {
    userService.getById(req.user.sub)
        .then(user => user ? res.json(user) : res.sendStatus(404))
        .catch(err => next(err));
}

function Verification(req, res, next) {
    userService.Verification(req.params.id)
        .then(user => user ? res.json(user) : res.sendStatus(404))
        .catch(err => next(err));
}
function getById(req, res, next) {
    userService.getById(req.params.id,req.query)
        .then(user => user ? res.json(user) : res.sendStatus(404))
        .catch(err => next(err));
}

function update(req, res, next) {
  
    userService.update(req.params.id, req.body)
        .then((rslt) => rslt ? res.json(rslt) : res.sendStatus(404))
        .catch(err => next(err));
}

function uploadImage(req, res, next) {
    if(req.file.filename){
     var  image = req.file.filename;    
    }else{
     var image = false;    
    }
    userService.uploadImage(req.params.id, image)
        .then((data) => data ? res.json(data) : res.sendStatus(404))
        .catch(err => next(err));

}



function _delete(req, res, next) {
    userService.delete(req.params.id)
        .then(() => res.json({}))
        .catch(err => next(err));
}