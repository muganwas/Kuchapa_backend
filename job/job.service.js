const db = require('_helpers/db');
const admin = require('firebase-admin');
const { imageExists, distance } = require('../misc/helperFunctions');
const Employee = db.Employee;


module.exports = {
    serviceprovider,
};

async function serviceprovider(id, body) {
    try {
        const { lat, lang, page = 1, limit = 10 } = body;
        if (typeof job.lat === 'undefined' ||
            typeof job.lang === 'undefined') {
            return { result: false, message: 'lat and lang are required' };
        }
        const param = { services: { "$regex": id, "$options": "i" } };
        const count = await Employee.countDocuments(param);
        const totalPages = Math.ceil(count / limit);
        const numLimit = Number(limit);
        const numSkip = (Number(page) - 1) * Number(limit);

        let emp = await Employee.find(param).skip(numSkip).limit(numLimit);
        let data = [];
        const locRef = admin.database().ref('liveLocation');
        for (let i = 0; i < emp.length; i++) {
            const emp_id = emp[i]._id;
            const { latitude, longitude } = (await locRef.child(String(emp_id)).once('value')).val();
            let emp_lat = latitude || emp[i].lat;
            let emp_lang = longitude || emp[i].lang;
            if (emp_lang && emp_lat) {
                if (emp[i].img_status == '1') {
                    emp[i].image = emp[i].image;
                }
                let new_a = emp[i].toJSON();
                new_a['image_available'] = await imageExists(new_a.image);
                new_a.hash = await distance(lat, lang, emp_lat, emp_lang, 'K');
                data.push(new_a);
            }
        }
        if (data.length) {
            return { result: true, message: 'Employee Found', data: data, metadata: { page, totalPages, limit } };
        } else {
            return { result: false, message: 'Provider not Found' };
        }
    } catch (e) {
        console.log(e.message)
        return { result: false, message: e.message };
    }
}
