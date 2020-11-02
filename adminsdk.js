require('dotenv').config();
module.exports = {
    vars: {
        "type": "service_account",
        "project_id": "kuchapa-e352c",
        "private_key_id": process.env.FIREBASE_ADMIN_PRIVATE_KEY_ID,
        "private_key": (process.env.FIREBASE_ADMIN_PRIVATE_KEY).replace(/\\n/g, '\n'),
        "client_email": "firebase-adminsdk-b6pxj@kuchapa-e352c.iam.gserviceaccount.com",
        "client_id": "111921386631819383769",
        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        "token_uri": "https://oauth2.googleapis.com/token",
        "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
        "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-b6pxj%40kuchapa-e352c.iam.gserviceaccount.com"
    }
};