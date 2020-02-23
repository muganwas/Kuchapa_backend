const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    user_id: { type: String, required: true },
    employee_id: { type: String, default:'' },
    service_id: { type: String, required:true },
    service_name: { type: String, required:true },
    location: { type: String, required:true },
    lat: { type: String, required:true },
    lang: { type: String, required:true },
    status: { type: String, default:'Pending' },
    emp_name: { type: String, default:'' },
    emp_mobile: { type: String, default:'' },
    emp_image: { type: String, default:'' },
    emp_lat: { type: String, default:'' },
    emp_lang: { type: String, default:'' },
    emp_distance: { type: String, default:'' },
    emp_accept_time: { type: String, default:'' },
    emp_time: { type: String, default:'' },
    createdDate: { type: Date, default: Date.now }
});

schema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Job', schema);



