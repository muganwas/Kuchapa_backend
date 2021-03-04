//const { formatDate } = require('../misc/helperFunctions');
//const formattedDate = formatDate(new Date());
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const chatsSchema = new Schema({
  date: {
    type: String,
    //default: formattedDate
  },
  sender: {
    type: String,
    required: "Please provide sender"
  }, 
  recipient: {
    type: String,
    required: "Please provide recipient"
  }, 
  message: {
    type: String,
    required: "Please provide message"
  },
  image: {
    type: Object
  },
  type: {
    type: String,
    default: 'text'
  },
  time: {
    type: Date,
    default: Date.now()
  }, 
  read: {
    type: Boolean,
    default: false
  }
});

module.exports = mongoose.model('chats', chatsSchema);