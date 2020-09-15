require('dotenv').config();
module.exports = {
    vars: {
        "type": "service_account",
        "project_id": "harfa-47425",
        "private_key_id": process.env.FIREBASE_ADMIN_PRIVATE_KEY_ID,
        "private_key": (process.env.FIREBASE_ADMIN_PRIVATE_KEY).replace(/\\n/g, '\n'),
        "client_email": "firebase-adminsdk-45i6c@harfa-47425.iam.gserviceaccount.com",
        "client_id": "100220410617547840394",
        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        "token_uri": "https://oauth2.googleapis.com/token",
        "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
        "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-45i6c%40harfa-47425.iam.gserviceaccount.com"
    }
};