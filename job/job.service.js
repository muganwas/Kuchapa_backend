const db = require('_helpers/db');
const { imageExists, distance } = require('../misc/helperFunctions');
const Employee = db.Employee;


module.exports = {
    serviceprovider,
};

async function serviceprovider(id, job) {
    if (typeof job.lat === 'undefined' ||
        typeof job.lang === 'undefined') {
        return { result: false, message: 'lat and lang are required' };
    }

    let emp = await Employee.find();
    let data = [];
    for (let i = 0; i < emp.length; i++) {
        let emp_services = emp[i].services.split(',');
        let address = emp[i].address;
        let a = emp_services.indexOf(id);
        if (a != -1 && address && address.length > 2) {
            let emp_lat = emp[i].lat;
            let emp_lang = emp[i].lang;
            if (emp[i].img_status == '1') {
                emp[i].image = emp[i].image;
            }
            let distance_a

            let new_a = emp[i].toJSON();
            new_a['image_available'] = await imageExists(new_a.image);
            new_a.hash = await distance(job.lat, job.lang, emp_lat, emp_lang, 'K');
            data.push(new_a);
        }
    }
    if (data.length) {
        return { result: true, message: 'Employee Found', data: data };
    } else {
        return { result: false, message: 'Provider not Found' };
    }
}
