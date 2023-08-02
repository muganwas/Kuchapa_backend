const express = require('express');
const router = express.Router();
const userService = require('./service.service');


var multer = require('../node_modules/multer');
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
router.post('/create', create);
router.get('/', getAll);
router.get('/getall', getAllService);
router.get('/current', getCurrent);
router.get('/:id', getById);
router.post('/:id', upload.single('image'), update);
router.get('/delete/:id', _delete);

module.exports = router;

function getAll(req, res, next) {
    console.log("getting all services..")
    userService.getAll(req.query)
        .then(services => res.json(services))
        .catch(err => next(err));
}

function create(req, res, next) {
    userService.create(req.body)
        .then(services => res.json(services))
        .catch(err => next(err));
}

function getAllService(req, res, next) {
    userService.getAllService()
        .then(services => res.json(services))
        .catch(err => next(err));
}

function getCurrent(req, res, next) {
    userService.getById(req.service.sub)
        .then(service => service ? res.json(service) : res.sendStatus(404))
        .catch(err => next(err));
}

function getById(req, res, next) {
    userService.getById(req.params.id)
        .then(service => service ? res.json(service) : res.sendStatus(404))
        .catch(err => next(err));
}

function update(req, res, next) {
    if (req.file) {
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
