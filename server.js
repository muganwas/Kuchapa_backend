require('dotenv').config();
//const hostname = 'harfa.app';
require('rootpath')();

const express = require('express');
//const MongoClient = require('mongodb').MongoClient;


//var multer  = require('multer');

//var fs = require('fs');
//var http = require('http');

const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
// const jwt = require('_helpers/jwt');
const errorHandler = require('_helpers/error-handler');
const cron = require('node-cron');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());

// use JWT auth to secure the api
// app.use(jwt());

// api routes

app.use('/admin', require('./admin/admin.controller'));
app.use('/users', require('./users/users.controller'));
app.use('/contact', require('./contact/contact.controller'));
app.use('/employee', require('./employee/employee.controller'));
app.use('/service', require('./services/services.controller'));
app.use('/main_category', require('./main_category/main_category.controller'));
app.use('/sub_category', require('./sub_category/sub_category.controller'));
app.use('/job', require('./job/job.controller'));
app.use('/jobrequest', require('./jobrequest/jobrequest.controller'));
app.use('/chat', require('./chat/chat.controller'));
app.use('/notification', require('./notification/notification.controller'));
app.use('/cron', require('./cron/cron.controller'));
app.use('/thirdpartyapi', require('./thirdpartyapi/thirdpartyapi.controller'));

// global error handler
app.use(errorHandler);


var cron_request = require('./cron/cron.service.js');

cron.schedule('* * * * *', function () {
    cron_request.ChnageReqStatus();
});

// start server
const port = process.env.NODE_ENV === 'production' ? (process.env.PORT || 80) : (process.env.PORT || 8080);

const io	 = require('socket.io').listen(app.listen(port, function () {
    console.log('Server listening on port ' + port);
}));

/*https.createServer({},app)
.listen(8080, function () {
  console.log('Example app listening on port 8080! Go to https://localhost:8080/')
})*/

/*var options = {
    key: fs.readFileSync('/etc/ssl/private/ssl-cert-snakeoil.key'),
    cert: fs.readFileSync('/etc/ssl/certs/ca-certificates.crt'),
    requestCert: true
};*/

var controller = require('./main_category/main_category.service.js');
var job = require('./job/job.service.js');
var chat = require('./chat/chat.service.js');
io.sockets.on('connection', function (socket) {
     controller.respond(socket);
     job.respond(socket);
  chat.respond(socket);
});
