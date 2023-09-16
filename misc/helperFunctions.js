require('dotenv').config();
const request = require('request');
const admin = require("firebase-admin");
const mongoose = require('mongoose');
const { constants } = require('_helpers/constants')
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

module.exports.imageExists = async image_url => {
  return new Promise(resolve => {
    try {
      if (image_url) {
        request({ uri: image_url, method: 'GET' }, (err, res, body) => {
          if (err)
            resolve(false);
          if (body)
            resolve(true);
          resolve(false);
        });
      }
    } catch (e) {
      resolve(false)
    }
  });
};

module.exports.fetchCountryCodes = async () => {
  const countryCodeRef = admin.database().ref('constants/countryCode');
  const countryAlpha2Ref = admin.database().ref('constants/countryAlpha2');
  try {
    const code = await countryCodeRef
      .once('value');
    const alpha = await countryAlpha2Ref
      .once('value');
    return { return: true, message: 'Success', data: { country_alpha: alpha.val(), country_code: code.val() } };
  } catch (e) {
    return { return: false, message: e.message, data: { country_alpha: constants.DEFAULT_ALPHA, country_code: constants.DEFAULT_COUNTRY_CODE } };
  }
}

module.exports.validateFirebaseUser = async (bearerToken) => {
  const idToken = bearerToken.split(" ")[1];
  try {
    const result = await admin.auth().verifyIdToken(idToken);
    if (result.uid)
      return true;
    return false;
  } catch (e) {
    return false;
  }
}

module.exports.synchroniseOnlineStatus = async (body) => {
  const { id, savedStatus } = body;
  try {
    let status = savedStatus;
    const usersRef = admin.database().ref(`users/${id}`);
    const snapshot = await usersRef.once('value');
    const value = snapshot.val();
    if (!value || (value != undefined && value.status != status)) {
      await usersRef.set({ status });
      return { result: true, message: 'Status updated successfully', data: { userId: id, status: value.status } };
    }
    return { result: true, message: 'Status is already synchronised', data: { userId: id, status: value.status } };
  } catch (e) {
    return { result: false, message: e.message, }
  }
};

module.exports.validateFirebaseAdmin = async (bearerToken) => {
  const idToken = bearerToken.split(" ")[1];
  try {
    const result = await admin.auth().verifyIdToken(idToken);
    if (result.uid && result.email === process.env.ADMIN_EMAIL)
      return true;
    return false;
  } catch (e) {
    return false;
  }
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

module.exports.distance = async (lat1, lon1, lat2, lon2, unit) => {
  if (lat1 === lat2 && lon1 === lon2) {
    return 0;
  } else {
    var radlat1 = (Math.PI * lat1) / 180;
    var radlat2 = (Math.PI * lat2) / 180;
    var theta = lon1 - lon2;
    var radtheta = (Math.PI * theta) / 180;
    var dist =
      Math.sin(radlat1) * Math.sin(radlat2) +
      Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
    if (dist > 1) {
      dist = 1;
    }
    dist = Math.acos(dist);
    dist = (dist * 180) / Math.PI;
    dist = dist * 60 * 1.1515;
    if (unit === 'K') {
      dist = dist * 1.609344;
    }
    if (unit === 'N') {
      dist = dist * 0.8684;
    }
    return dist.toFixed(2);
  }
}

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