const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    username: { type: String, required: true },
    email: { type: String, default: '' },
    mobile: { type: String, default: '' },
    dob: { type: String, required: false },
    hash: { type: String, default: '' },
    country: { type: String, default: '' },
    address: { type: String, default: '' },
    lat: { type: String, default: '' },
    lang: { type: String, default: '' },
    image: { type: String, default: 'no-image.jpg' },
    img_status: { type: String, default: '0' },
    status: { type: String, default: '1' },
    online: { type: String, default: '1' },
    avgRating: { type: Number, default: 0 },
    email_verification: { type: Number, default: 0 },
    acc_type: { type: String, default: 'Individual' },
    fcm_id: { type: String, default: '' },
    createdDate: { type: Date, default: Date.now }
});

schema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('User', schema);