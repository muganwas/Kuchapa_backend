const express = require('express');
const router = express.Router();
const ThirdPartyApi = require('./thirdpartyapi.service');
const config = require('config.json');

var multer  = require('../node_modules/multer');
// console.log(multer);
var Storage = multer.diskStorage({
destination: function (req, file, callback) {
callback(null, "uploads/chat/");
},
filename: function (req, file, callback) {
    console.log(file);
callback(null, file.fieldname + "_" + Date.now() + "_" + file.originalname);
}
});
var upload = multer({ storage: Storage });


//routes
// router.get('/', getAll);

router.post('/sendsms', SendSMS);
router.post('/sendmail', sendmail);
router.post('/chatupload',upload.single('file'), uploadFile);
module.exports = router;


//functions

function SendSMS(req, res, next) {
    ThirdPartyApi.SendSMS(req.body)
        .then(users => res.json(users))
        .catch(err => next(err));
}





function sendmail(req , res, next){
    ThirdPartyApi.SendMail(req.body)
        .then(users => res.json(users))
        .catch(err => next(err));
}


function uploadFile(req , res, next) {


   ThirdPartyApi.UploadFIle(req.file.filename)
        .then(users => res.json(users))
        .catch(err => next(err));

}



