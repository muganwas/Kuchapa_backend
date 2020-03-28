const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    username: { type: String, required: true },
    surname: { type: String, default:'' },
    email: { type: String, required: true },
    password: { type: String, required: false,default: ''},
    hash: { type: String, default:'' },
    country: { type: String, default:''},
    mobile: { type: String, default:'' },
    address: { type: String, required: true },
    services: { type: String, required: true },
    invoice: { type: String, required: true },
    description: { type: String, required: true },
    lat: { type: String,  },
    lang: { type: String, },
    image: { type: String ,default:'no-image.jpg'},
    img_status: { type: String, default: '0' },
    status: { type: String ,default:'1'},
    email_verification: { type: Number ,default:0},
    paying: { type: String ,default:'No'},
    account_type: { type: String ,default:''},
    fcm_id: { type: String ,default:''},
    createdDate: { type: Date, default: Date.now }
});

schema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Employee', schema);