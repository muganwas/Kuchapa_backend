const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    sender_id: { type: String, required: true },
    receiver_id: { type: String, required: true },
    message :   {type:String, required:true },
    seen :   {type:String, default:"false" },
    type :   {type:String, default:"text"},
    createdDate: { type: Date, default: Date.now }
});

schema.set('toJSON', { virtuals: true });
module.exports = mongoose.model('Chat', schema);



