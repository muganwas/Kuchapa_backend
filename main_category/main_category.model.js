const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    main_category: { type: String, unique: true, required: true },
    createdDate: { type: Date, default: Date.now }
});

schema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Main_Category', schema);



