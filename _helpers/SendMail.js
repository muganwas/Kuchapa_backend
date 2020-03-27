const config = require('../config.js')
const request = require('request')
const nodemailer = require('nodemailer')

module.exports = async (email, subject, message) => {
  if (
    typeof email === 'undefined' ||
    typeof subject === 'undefined' ||
    message === 'undefined'
  ) {
    return { result: false, message: 'email, subject and message is required' }
  }

  // Generate test SMTP service account from ethereal.email
  // Only needed if you don't have a real mail account for testing
  let testAccount = await nodemailer.createTestAccount()

  // create reusable transporter object using the default SMTP transport
  let transporter = nodemailer.createTransport({
    host: config.email_host,
    port: config.email_port,
    secure: true, // true for 465, false for other ports
    requireTLS: true,
    auth: {
      user: config.email_user, // generated ethereal user
      pass: config.email_passwrord // generated ethereal password
    }
  })

  // send mail with defined transport object
  await transporter.sendMail({
    from: `"${config.Website_Name}" <${config.Website_Email}>`, // sender address
    to: email, // list of receivers
    subject: subject, // Subject line
    text: message, // plain text body
    html: message // html body
  }).then( res => {
    console.log(res)
    return { result: true, message: 'mail sent' }
  }).catch(e => {
      console.log(e);
      return  { result: false, message: 'something went wrong', error: e.message }
  });
}