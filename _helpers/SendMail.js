require('dotenv').config();
const config = process.env;
const request = require('request');
const nodemailer = require("nodemailer");

module.exports = {
    SendMail
};

async function SendMail(email, subject, message){
    
  if(typeof email === 'undefined' || typeof subject === 'undefined' || message === 'undefined'){
    return {result : false , message:"email, subject and message is required"};
  }

  // Generate test SMTP service account from ethereal.email
  // Only needed if you don't have a real mail account for testing
  let testAccount = await nodemailer.createTestAccount();

  // create reusable transporter object using the default SMTP transport
  let transporter = nodemailer.createTransport({
    host: config.EMAIL_HOST,
    port: config.EMAIL_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
      user: config.EMAIL_USER, // generated ethereal user
      pass: config.EMAIL_PASSWORD // generated ethereal password
    }
  });

  // send mail with defined transport object
  let info = await transporter.sendMail({
    from: `"${config.WEBSITE_NAME}" <${config.WEBSITE_EMAIL}>`, // sender address
    to: email, // list of receivers
    subject: subject, // Subject line
    text: message, // plain text body
    html: message // html body
  });
    console.log("Message sent: %s", info.messageId);
    console.log(info);

  return {result : true , message : "mail sent"};
}
