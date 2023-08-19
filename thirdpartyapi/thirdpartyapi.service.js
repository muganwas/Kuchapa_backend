const SendMailFunction = require("../_helpers/SendMail");


module.exports = {
  SendSMS,
  SendMail
};




async function SendSMS(param) {
  console.log(param);
  if (typeof param.to === 'undefined' || typeof param.otp === 'undefined') {
    return { result: false, message: 'to and otp is required' };
  }


  const request = require('request')
  var formData = {};

  formData['to'] = param.to;
  formData['body'] = "Your otp is " + param.otp + " .";


  return new Promise(function (resolve, reject) {
    request({
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic bGFhYmhhYXRlY2hzb2Z0OkxhYWJoYWFAMjAxOQ=='
      },
      uri: 'https://api.bulksms.com/v1/messages?auto-unicode=true&longMessageMaxParts=30',
      body: JSON.stringify(formData),
      method: 'POST'
    }, function (error, res, body) {
      if (error) {
        reject({ result: false, message: 'message not sent error found', error: error });
      }
      resolve({ result: true, message: "message sent succcessfull", response: body });
    });
  });

}

async function SendMail(param) {
  return await SendMailFunction.SendMail(param);
}
