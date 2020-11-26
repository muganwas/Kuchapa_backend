const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    user_id: { type: Schema.Types.ObjectId, required: true },
    employee_id: { type: Schema.Types.ObjectId, required: true },
    service_id: { type: String, required:true },
    chat_status: { type: String, default:'0' },
    status: { type: String, default:'Pending' },
    delivery_address: { type: String, default:'' },
    delivery_lat: { type: String, default:'' },
    delivery_lang: { type: String, default:'' },
    customer_rating: { type: String, default:'' },
    customer_review: { type: String, default:'' },
    employee_rating: { type: String, default:'' },
    employee_review: { type: String, default:'' },
    createdDate: { type: Date, default: Date.now }
});

schema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('JobRequest', schema);



