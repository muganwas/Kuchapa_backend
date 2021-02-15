const config = require('../config');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('_helpers/db');
const Job = db.Job;
const Employee = db.Employee;


module.exports = {
    serviceprovider,
};

async function serviceprovider(id, job) {
    if (typeof job.lat === 'undefined' ||
        typeof job.lang === 'undefined') {
        return { result: false, message: 'lat and lang is required' };
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
            let distance_a = distance(job.lat, job.lang, emp_lat, emp_lang, 'K');

            let new_a = emp[i];
            let round_distance = Number.parseFloat(distance_a).toFixed(1);
            if (round_distance == 0.0) {
                round_distance = 0;
            }
            new_a.hash = round_distance;
            data.push(new_a);
        }
    }
    if (data.length) {
        return { result: true, message: 'Employee Found', data: data };
    } else {
        return { result: false, message: 'Provider not Found' };
    }

}


function distance(lat1, lon1, lat2, lon2, unit) {
    if ((lat1 == lat2) && (lon1 == lon2)) {
        return 0;
    }
    else {
        let radlat1 = Math.PI * lat1 / 180;
        let radlat2 = Math.PI * lat2 / 180;
        let theta = lon1 - lon2;
        let radtheta = Math.PI * theta / 180;
        let dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
        if (dist > 1) {
            dist = 1;
        }
        dist = Math.acos(dist);
        dist = dist * 180 / Math.PI;
        dist = dist * 60 * 1.1515;
        if (unit == "K") { dist = dist * 1.609344 }
        if (unit == "N") { dist = dist * 0.8684 }
        return dist;
    }
}   