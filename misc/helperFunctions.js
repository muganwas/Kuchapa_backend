const admin = require("firebase-admin");
const mongoose = require('mongoose');
// Get a reference to the database service

module.exports.storeChat = async chatObject => {
  const chats = mongoose.model('chats');
  const { sender, recipient, time } = chatObject;
  await chats.findOne({sender, recipient, time}, (err, data) => {
      if (err) return err;
      else if (data) return "chat stored already";
      else {
          const newChats = new chats(chatObject);
          newChats.save((err, details) => {
              if (err) return err;
              else return({saved: true, details});
          });
      }
  }).catch(e => {
      return e;
  });
  return 'huh!';
}

module.exports.formatDate = (today = new Date()) => {
  var day = today.getDate(),
  month = today.getMonth(),
  year = today.getFullYear();

  if (day < 10){
    day = "0" + day;
  }
  if( month < 10){
    month = "0" + month;
  }
  const formattedDate = year+ "-"+ month +"-"+ day;
  return formattedDate;
}