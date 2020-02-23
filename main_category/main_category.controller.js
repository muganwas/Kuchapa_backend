const express = require('express');
const router = express.Router();
const main_categoryService = require('./main_category.service');


var multer  = require('../node_modules/multer');
// console.log(multer);
var Storage = multer.diskStorage({
destination: function (req, file, callback) {
callback(null, "./uploads/services/");
},
filename: function (req, file, callback) {
callback(null, file.fieldname + "_" + Date.now() + "_" + file.originalname);
}
});

var upload = multer({ storage: Storage }); 
// routes
router.post('/create', create);
router.get('/', getAll);
router.get('/:id', getById);
router.post('/:id', update);
router.get('/delete/:id', _delete);

module.exports = router;

function create(req, res, next) {

    main_categoryService.create(req.body)
        .then((user) => res.json(user))
        .catch(err => next(err));
}

function getAll(req, res, next) {

    main_categoryService.getAll()
        .then(users => res.json(users))
        .catch(err => next(err));
}

function getCurrent(req, res, next) {
    main_categoryService.getById(req.user.sub)
        .then(user => user ? res.json(user) : res.sendStatus(404))
        .catch(err => next(err));
}

function getById(req, res, next) {
    // console.log(req.params.id);
    main_categoryService.getById(req.params.id)
        .then(user => user ? res.json(user) : res.sendStatus(404))
        .catch(err => next(err));
}

function update(req, res, next) {
    main_categoryService.update(req.params.id, req.body)
        .then((rslt) => res.json(rslt))
        .catch(err => next(err));
}

function _delete(req, res, next) {
    // console.log(req.body);
    main_categoryService._delete(req.params.id)
        .then((rslt) => res.json(rslt))
        .catch(err => next(err));
}
