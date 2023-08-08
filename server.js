require('dotenv').config();
require('rootpath')();
const express = require('express');
//const MongoClient = require('mongodb').MongoClient;
//var multer  = require('multer');
//var fs = require('fs');
//var http = require('http');
const app = express();
const httpServer = require('http').createServer(app);
const cors = require('cors');
const bodyParser = require('body-parser');
// const jwt = require('_helpers/jwt');
const errorHandler = require('_helpers/error-handler');
const cron = require('node-cron');
const admin = require("firebase-admin");
const { Server } = require('socket.io');
const serviceAccount = require("./adminsdk.js").vars;
const jsonServiceAcount = JSON.parse(JSON.stringify(serviceAccount));
const mongoose = require('mongoose');
const db_connection_url = process.env.CONNECTION_STRING;
const userService = require('./users/user.service');
const chatService = require('./chat/chat.service');
const employeeService = require('./employee/employee.service');
const firebase = require('firebase');
const config = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.AUTH_DOMAIN,
  databaseURL: process.env.DATABASE_URL,
  storageBucket: process.env.STORAGE_BUCKET
};

/**firebase initialization */
firebase.initializeApp(config);
admin.initializeApp({
  credential: admin.credential.cert(jsonServiceAcount),
  databaseURL: process.env.DATABASE_URL
});

//options to avaoid the topology was destroyed error
const mongooseOptions = {
  keepAlive: 1,
  connectTimeoutMS: 30000,
  useUnifiedTopology: true,
  useNewUrlParser: true,
  useFindAndModify: false,
  useCreateIndex: true,
};

mongoose.Promise = global.Promise;
mongoose.connect(db_connection_url, mongooseOptions, err => {
  if (err) {
    console.log(err);
    process.exit(1);
  }
  console.log("connected to db");
});

// Get a reference to the database service
const database = firebase.database;
const usersRef = database().ref('users');

let messages = {};
//live users
let users = {};
let connectedUsers = {};

usersRef.once('value').then(snapshot => {
  const current = snapshot.val();
  Object.keys(current).map(userId => {
    users[userId] = { status: '0' };
  });
}, error => {
  console.log(error);
});

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
app.use('/api/uploads', express.static(__dirname + '/uploads'));
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

// start server
const port = process.env.NODE_ENV === 'production' ? (process.env.PORT || 80) : (process.env.PORT || 8080);

const io = new Server(httpServer, {});

httpServer.listen(port, function () {
  console.log('Server listening on port ' + port);
});

io.on("connection", socket => {
  if (this.authentication) socket.off('authentication', this.authentication);
  if (this.sentMessage) socket.off('sent-message', this.sentMessage);
  this.authentication = () => socket.on('authentication', async data => {
    console.log('user authenticated')
    const { id, userType } = data;
    if (id) {
      let Verification = userType === 'client' ? userService.findUserById : employeeService.findUserById;
      Verification(id).then(verification => {
        const { result, message } = verification;
        if (result) {
          users[id] = { status: '1', socketId: socket.id };
          connectedUsers[id] = { status: '1', socketId: socket.id };
          socket.uid = id;
          socket.emit('authorized', { message });
          io.emit('user-joined', users);
        }
        else {
          console.log(`Socket ${socket.id} unauthorized.`);
          socket.emit('unauthorized', { message: 'UNAUTHORIZED', detail: message })
        }
      }).catch(error => {
        console.log(`Socket ${socket.id} unauthorized. Error: ${error}`);
        socket.emit('unauthorized', { message: 'UNAUTHORIZED', detail: error.message })
      });
    }
    else {
      console.log('user id missing');
      socket.emit('unauthorized', { message: 'UNAUTHORIZED', code: " uid" });
    }
  });

  this.sentMessage = () => socket.on('sent-message', data => {
    const { fcm_id, orderId, senderName, file, textMessage, senderId, receiverId, userType, type, time, date } = Object.assign({}, data);
    messages[receiverId] = { sender: senderId, message: textMessage, file };
    // -- make sure to save message to the db
    if (users[receiverId]) {
      const receipientSocketId = users[receiverId].socketId;
      let messageObject = Object.assign({}, data);
      chatService.storeMessage(messageObject, data.userType);
      chatService.storeChat({ userType, type, sender: senderId, file, message: textMessage, recipient: receiverId, time, date, fcm_id, orderId, senderName }).then(response => {
        console.log(response);
      });
      socket.to(receipientSocketId).emit('chat-message', { message: textMessage, type, file, recipient: receiverId, sender: senderId, senderName, time, date });
    }
    else {
      // just save the massages for when user available
      let messageObject = Object.assign({}, data);
      chatService.storeMessage(messageObject, data.userType);
      chatService.storeChat({ userType, type, sender: senderId, file, message: textMessage, recipient: receiverId, time, date, fcm_id, orderId, senderName }).then(response => {
        console.log(response);
      });
      console.log('messaged user is offline');
    }
  });

  this.authentication();
  this.sentMessage();

  // wait for authentication if non disconnect
  setTimeout(() => {
    if (!socket.uid) {
      socket.emit('unauthorized', { message: 'UNAUTHORIZED', code: 'request timed out' });
      socket.disconnect();
    }
    else console.log(`Socket: ${socket.id} is authenticated.`);
  }, process.env.AUTH_TIMEOUT);

  socket.on('disconnect', () => {
    //console.log(`Socket: ${socket.id} has disconnected.`);
    if (socket.uid) {
      console.log('user disconnected...')
      delete connectedUsers[socket.uid];
      users[socket.uid].status = "0";
      io.emit('user-disconnected', users);
    }
  })
});