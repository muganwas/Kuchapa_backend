'use strict'
require('dotenv').config();

const localURL = process.env.LOCAL_URL, 
cloudURL = process.env.URL;

module.exports = {
    "connectionString": process.env.CONNECTION_STRING,
    "secret": process.env.SECRET,
    "URL":cloudURL,
    "SERVER_KEY":process.env.SERVER_KEY,
    "email_host":process.env.EMAIL_HOST,
    "email_port":process.env.EMAIL_PORT,
    "email_user":process.env.EMAIL_USER,
    "email_passwrord":process.env.EMAIL_PASSWORD,
    "Website_Name" : process.env.WEBSITE_NAME,
    "Website_Email" : process.env.WEBSITE_EMAIL
}
