const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    main_category: { type: String, required: true },
    sub_category: { type: String, required: true },
    service_name: { type: String, unique: true, required: true },
    image: { type: String, required: true },
    createdDate: { type: Date, default: Date.now }
});

schema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Service', schema);



