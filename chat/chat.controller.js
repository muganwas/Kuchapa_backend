const express = require('express');
const router = express.Router();
const Chat = require('./chat.service');
const Job = require('../job/job.service');


var multer  = require('../node_modules/multer');

var Storage = multer.diskStorage({
destination: function (req, file, callback) {
callback(null, "./uploads/chat/");
},
filename: function (req, file, callback) {
callback(null, file.fieldname + "_" + Date.now() + "_" + file.originalname);
}
});

var upload = multer({ storage: Storage }); 
// routes
router.get('/add', create);


module.exports = router;




function create(req, res, next) {

    Chat.create(req.query)
        .then((user) => res.json(user))
        .catch(err => next(err));
}
