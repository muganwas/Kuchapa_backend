const config = require('../config');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('_helpers/db');
const Job = db.Job;
const cron = require('node-cron');
const JobRequest = db.JobRequest;
const Notification = db.Notification;
const Employee = db.Employee;
const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];
const shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
const gcm = require("node-gcm");

module.exports = {
    ChnageReqStatus
};

async function ChnageReqStatus(param) {
    let check = {};
    check['status'] = 'Pending';
    check['chat_status'] = '0';

    let change = await JobRequest.find(check);
    if (change.length > 0) {

        for (let i = 0; i < change.length; i++) {

            let d = new Date(change[i].createdDate);
            let p = new Date(d.valueOf() + 4 * 60000).valueOf();
            let now = new Date().valueOf();
            if (p < now) {
                let change_status = await JobRequest.findById(change[i]._id);
                let update_status = {};
                update_status['status'] = 'Failed';
                Object.assign(change_status, update_status);
                let change_status_rslt = await change_status.save();
            }
        }
    }
}