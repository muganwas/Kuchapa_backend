const admin = require("firebase-admin");
const mongoose = require('mongoose');
// Get a reference to the database service

module.exports.storeChat = async chatObject => {
  const chats = mongoose.model('chats');
  const { sender, recipient, time } = chatObject;
  await chats.findOne({ sender, recipient, time }, (err, data) => {
    if (err) return err;
    else if (data) return "chat stored already";
    else {
      const newChats = new chats(chatObject);
      newChats.save((err, details) => {
        if (err) return err;
        else return ({ saved: true, details });
      });
    }
  }).catch(e => {
    return e;
  });
  return 'huh!';
}

module.exports.createSession = async ({ idToken }) => {
  const expiresIn = 60 * 60 * 24 * 2 * 1000;// Two days
  admin.auth().createSessionCookie(idToken, { expiresIn })
    .then(
      (sessionCookie) => {
        // Set cookie policy for session cookie.
        const options = { maxAge: expiresIn, httpOnly: true, secure: true };
        return ({ message: 'Cookie created', sessionCookie, options });
      },
      (error) => {
        return ({ message: "Error", error });
      }
    );
};

module.exports.generatePassword = (
  passwordLength = 8,
) => {
  const lowerCase = 'abcdefghijklmnopqrstuvwxyz'
  const upperCase = lowerCase.toUpperCase()
  const numberChars = '0123456789'
  const specialChars = '!"@$%+-_?^&*()'

  let generatedPassword = ''
  let restPassword = ''

  const restLength = passwordLength % 4
  const usableLength = passwordLength - restLength
  const generateLength = usableLength / 4

  const randomString = (char) => {
    return char[Math.floor(Math.random() * (char.length))]
  }
  for (let i = 0; i <= generateLength - 1; i++) {
    generatedPassword += `${randomString(lowerCase)}${randomString(upperCase)}${randomString(numberChars)}${randomString(specialChars)}`
  }

  for (let i = 0; i <= restLength - 1; i++) {
    restPassword += randomString([...lowerCase, ...upperCase, ...numberChars, ...specialChars])
  }

  return generatedPassword + restPassword
}

module.exports.formatDate = (today = new Date()) => {
  var day = today.getDate(),
    month = today.getMonth(),
    year = today.getFullYear();

  if (day < 10) {
    day = "0" + day;
  }
  if (month < 10) {
    month = "0" + month;
  }
  const formattedDate = year + "-" + month + "-" + day;
  return formattedDate;
}