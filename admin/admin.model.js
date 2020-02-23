const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    name: { type: String},
    hash: { type: String, required: true },
    email: { type: String},
    password: { type: String},
    address: { type: String},
    mobile: { type: String},
    // createdDate: { type: Date, default: Date.now }
});

schema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Admin', schema);