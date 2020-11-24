const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    user_id: { type: Schema.Types.ObjectId, required: true },
    employee_id: { type: Schema.Types.ObjectId, required: true },
    order_id: { type: String, default:'' },
    title: { type: String, required: true },
    message: { type: String, default:'' },
    type: { type: String, default:'' },
    notification_by: { type: String },
    status: { type: String, default:'0' },
    notification_for: { type: String },
    notification_link: { type: String, default:''},
    createdDate: { type: Date, default: Date.now }
});

schema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Notification', schema);