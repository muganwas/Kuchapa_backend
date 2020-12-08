const config = require('../config');
const db = require('_helpers/db');
const mongoose = require('mongoose');
const Notification = db.Notification;
const JobRequest = db.JobRequest;
const Employee = db.Employee;
const admin = require("firebase-admin");
const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];
const shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];

async function serviceprovider(id, job) {
    if (typeof job.lat === 'undefined' ||
        typeof job.lang === 'undefined') {
        return { result: false, message: 'lat and lang is required' };
    }

    var emp = await Employee.find();
    var data = new Array();

    for (var i = 0; i < emp.length; i++) {
        var emp_services = emp[i].services.split(',');
        var a = emp_services.indexOf(id);

        if (a != -1) {
            var emp_lat = emp[i].lat;
            var emp_lang = emp[i].lang;
            var distance_a = await distance(job.lat, job.lang, emp_lat, emp_lang, 'K');
            var new_a = emp[i];
            var round_distance = Number.parseFloat(distance_a).toFixed(1);
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

async function AddJobRequest(param) {
    if (typeof param.user_id === 'undefined' ||
        typeof param.employee_id === 'undefined' ||
        typeof param.service_id === 'undefined') {
        return { result: false, message: 'user_id,employee_id,notification(for push notification),delivery_address , delivery_lat(o), delivery_lang(o) and service_id is required' };
    }
    var search = { user_id: new mongoose.Types.ObjectId(param.user_id), employee_id: new mongoose.Types.ObjectId(param.employee_id), status: { $nin: ["Failed", "Canceled", "Rejected", "No Response", "Completed"] } };
    var request = await JobRequest.find(search);

    if (request.length > 0) {
        return { result: false, 'message': 'Already Exist' };
    }
    else {
        var save = {};
        save['user_id'] = param.user_id;
        save['employee_id'] = param.employee_id;
        save['service_id'] = param.service_id;
        save['delivery_address'] = param.delivery_address;
        save['delivery_lat'] = param.delivery_lat;
        save['delivery_lang'] = param.delivery_lang;

        const jobrequest = new JobRequest(save);

        var output = {};
        if (output = await jobrequest.save()) {
            var notif = {};
            if (param.notification !== 'undefined') {
                let order_id = output.id;
                order_id = order_id.toString();
                /*  console.log(param.notification); */

                param.notification.data['main_id'] = order_id;
                order_id = order_id.substr(order_id.length - 5);

                param.notification.data['order_id'] = 'HRF-' + order_id.toUpperCase();
                PushNotif(param.notification).then(notification => notif = notification).catch(e => {
                    console.log('notification error', e)
                });
            }
            return { result: true, 'message': 'Add request successfull', 'notification': notif, data: output };
        } else {
            return { result: false, message: 'Something went wrong while request is added' };
        }
    }

}

async function Customerstatuscheck(id, type) {
    if (typeof id === 'undefined') {
        return { result: false, 'message': 'id is required' };
    }
    var param = {};
    param['user_id'] = id;
    var search = { user_id: new mongoose.Types.ObjectId(param.user_id) };
    var output = {};
    output = await JobRequest.find(search);
    if (output !== 0) {
        const status = type !== 'pending' ? { $nin: ["Pending"] } : { $nin: ["Failed", "Canceled", "Rejected", "No Response", "Completed"] };
        var JSon = await JobRequest.aggregate([
            { $match: { user_id: new mongoose.Types.ObjectId(id), status } },
            {
                "$project": {
                    "employee_id": {
                        "$toObjectId": "$employee_id"
                    },
                    "service_id": {
                        "$toObjectId": "$service_id"
                    },
                    "createdDate": {
                        "$toString": "$createdDate"
                    },
                    "chat_status": {
                        "$toString": "$chat_status"
                    },
                    "status": {
                        "$toString": "$status"
                    },
                    "delivery_address": {
                        "$toString": "$delivery_address"
                    },
                    "delivery_lat": {
                        "$toString": "$delivery_lat"
                    },
                    "delivery_lang": {
                        "$toString": "$delivery_lang"
                    },
                }
            },

            {
                $lookup:
                {
                    from: "employees",
                    localField: "employee_id",
                    foreignField: "_id",
                    as: "employee_details"
                }
            },
            {
                $lookup:
                {
                    from: "services",
                    localField: "service_id",
                    foreignField: "_id",
                    as: "service_details"
                }
            }
        ]);
        var new_arr = [];
        if (JSon) {
            for (var i = 0; i < JSon.length; i++) {
                var new_data = {};
                new_data = JSon[i];
                var order_id_str = new_data._id;
                order_id_str = order_id_str.toString();
                var lang_take = parseInt(order_id_str.length) - 5;
                order_id_str = order_id_str.substr(parseInt(lang_take));
                order_id_str = 'HRF-' + order_id_str.toUpperCase();

                new_data['order_id'] = order_id_str;
                var new_emp = JSon[i].employee_details[0];
                new_data['employee_details'] = new_emp;

                var new_ser = JSon[i].service_details[0];

                new_data['service_details'] = new_ser;

                new_arr.push(new_data);
            }
        }
        return { result: true, 'message': 'Already exist', data: new_arr };
    }
    else {
        return { result: false, message: 'data not found' };
    }

}

async function Providerstatuscheck(id, type) {
    if (typeof id === 'undefined') {
        return { result: false, 'message': 'id is required' };
    }

    var param = {};
    param['employee_id'] = id;
    /*param['status']='Pending';*/
    var search = { employee_id: new mongoose.Types.ObjectId(param.employee_id) };
    var output = {};
    var output = await JobRequest.find(search);
    if (output !== 0) {
        const status = type !== 'pending' ? { $nin: ["Pending"] } : { $nin: ["Failed", "Canceled", "Rejected", "No Response", "Completed"] };
        var JSon = await JobRequest.aggregate([
            { $match: { employee_id: new mongoose.Types.ObjectId(id), status } },
            {
                "$project": {
                    "user_id": {
                        "$toObjectId": "$user_id"
                    },
                    "service_id": {
                        "$toObjectId": "$service_id"
                    },
                    "createdDate": {
                        "$toString": "$createdDate"
                    },
                    "chat_status": {
                        "$toString": "$chat_status"
                    },
                    "status": {
                        "$toString": "$status"
                    },
                    "delivery_address": {
                        "$toString": "$delivery_address"
                    },
                    "delivery_lat": {
                        "$toString": "$delivery_lat"
                    },
                    "delivery_lang": {
                        "$toString": "$delivery_lang"
                    },
                }
            },

            {
                $lookup:
                {
                    from: "users",
                    localField: "user_id",
                    foreignField: "_id",
                    as: "customer_details"
                }
            },
            {
                $lookup:
                {
                    from: "services",
                    localField: "service_id",
                    foreignField: "_id",
                    as: "service_details"
                }
            }
        ]);
        var new_arr = [];
        if (JSon) {
            for (var i = 0; i < JSon.length; i++) {
                var new_data = {};
                new_data = JSon[i];
                var order_id_str = new_data._id;
                order_id_str = order_id_str.toString();
                var lang_take = parseInt(order_id_str.length) - 5;

                order_id_str = order_id_str.substr(parseInt(lang_take));
                order_id_str = 'HRF-' + order_id_str.toUpperCase();
                new_data['order_id'] = order_id_str;
                var new_emp = JSon[i].customer_details[0];
                new_data['customer_details'] = new_emp;

                var new_ser = JSon[i].service_details[0];

                new_data['service_details'] = new_ser;
                new_arr.push(new_data);
            }
        }
        return { result: true, 'message': 'exists', data: new_arr };
    }
    else {
        return { result: false, message: 'data not found' };
    }
}

async function Addrating(param) {
    var save = {};
    save['id'] = param.id;
    save['rating'] = param.customer_rating;
    save['review'] = param.customer_review;
    const jobrequest = new JobRequest(save);
    var output = {};
    if (output = await jobrequest.save()) {
        var notif = {};
        if (param.notification !== 'undefined') {
            var order_id = output.id;

            param.notification.data['main_id'] = order_id;
            order_id = order_id.substr(order_id.length - 5);
            param.notification.data['order_id'] = 'HRF-' + order_id.toUpperCase();
            PushNotif(param.notification).then(notification => notif = notification).catch(e => {
                console.log('notification error', e)
            });
        }

        return { result: true, 'message': 'Add request successfull', 'notification': notif, 'data': output };
    } else {

        return { result: false, message: 'Something went wrong while request is added' };
    }
}

async function UpdateJobRequest(param) {
    if (typeof param.main_id === 'undefined') {
        return { result: false, message: 'main_id ,chat_status(o),notification(o) and status(o) is required' };
    }
    let id = param.main_id;
    let request = await JobRequest.findById(id);
    if (!request) {
        return { result: false, message: 'main_id not found' };
    }

    let save_ = {};

    if (typeof param.chat_status !== 'undefined') {
        save_['chat_status'] = param.chat_status;
    }
    if (typeof param.status !== 'undefined') {
        save_['status'] = param.status;
    }

    request = Object.assign(request, save_);
    const output = await request.save();
    if (output) {
        var notif = {};
        if (param.notification !== undefined) {
            PushNotif(param.notification).then(notification => notif = notification).catch(e => {
                console.log('notification error', e)
            });
        }
        else {
            console.log('notification not saved');
        }
        return { result: true, message: 'Update successfull', data: output };
    }
    else {
        return { result: false, message: 'Something went wrong' };
    }

}

async function Ratingreview(param) {
    if (typeof param.main_id === 'undefined') {
        return { result: false, message: 'main_id ,chat_status(o),notification(o) and status(o) is required' };
    }
    var id = param.main_id;
    var request = await JobRequest.findById(id);
    if (!request) {
        return { result: false, message: 'main_id not found' };
    }

    let save = {};
    save['user_id'] = param.user_id;
    save['employee_id'] = param.employee_id;
    save['order_id'] = param.order_id;
    save['title'] = param.notification.title;
    save['message'] = param.notification.body;
    save['type'] = param.notification.type;
    save['notification_by'] = param.notification.notification_by;

    let notif_save = new Notification(save);

    let save_ = {};

    if (param.type == 'Customer') {
        save_['customer_rating'] = param.rating;
        save_['customer_review'] = param.review;
    }
    if (param.type == 'Employee') {
        save_['employee_rating'] = param.rating;
        save_['employee_review'] = param.review;
    }

    let newRequest = Object.assign(request, save_);

    let output = await newRequest.save();

    if (output) {
        notif_save.save();
        return { result: true, message: 'Update successfull', data: output };
    }
    else {
        return { result: false, message: 'Something went wrong' };
    }
}

async function CustomerDataRequest(id, type) {

    if (typeof id === 'undefined') {
        return { result: false, 'message': 'id is required' };
    }

    let param = {};
    param['user_id'] = new mongoose.Types.ObjectId(id);

    const output = await JobRequest.find(param);
    if (output !== 0) {
        const status =  type && type === 'bookings' ? { $nin: ["Pending", "Failed", "Canceled", "No Response"] } : { $nin: ["Pending"] };
        const JSon = await JobRequest.aggregate([
            { $match: { user_id: new mongoose.Types.ObjectId(id), status } },
            {
                "$project": {
                    "employee_id": {
                        "$toObjectId": "$employee_id"
                    },
                    "service_id": {
                        "$toObjectId": "$service_id"
                    },
                    "status": {
                        "$toString": "$status"
                    },
                    "chat_status": {
                        "$toString": "$chat_status"
                    },
                    "delivery_address": {
                        "$toString": "$delivery_address"
                    },
                    "delivery_lat": {
                        "$toString": "$delivery_lat"
                    },
                    "delivery_lang": {
                        "$toString": "$delivery_lang"
                    },
                    "customer_rating": {
                        "$toString": "$customer_rating"
                    },
                    "customer_review": {
                        "$toString": "$customer_review"
                    },
                    "employee_rating": {
                        "$toString": "$employee_rating"
                    },
                    "employee_review": {
                        "$toString": "$employee_review"
                    },
                    "createdDate": {
                        "$toString": "$createdDate"
                    }
                }
            },

            {
                $lookup:
                {
                    from: "employees",
                    localField: "employee_id",
                    foreignField: "_id",
                    as: "employee_details"
                }
            },
            {
                $lookup:
                {
                    from: "services",
                    localField: "service_id",
                    foreignField: "_id",
                    as: "service_details"
                }
            }
        ])
        if (JSon) {
            var new_arr = []
            for (var i = 0; i < JSon.length; i++) {
                var new_data = {};
                new_data = JSon[i];

                var new_date = JSon[i].createdDate;
                var d = new Date(new_date);
                // console.log(new_date);
                new_date = ("0" + d.getDate()).slice(-2) + '-' + monthNames[d.getMonth()] + '-' + d.getFullYear();
                new_data['createdDate'] = new_date;


                var order_id_str = new_data._id;
                order_id_str = order_id_str.toString();
                var lang_take = parseInt(order_id_str.length) - 5;

                order_id_str = order_id_str.substr(parseInt(lang_take));
                order_id_str = 'HRF-' + order_id_str.toUpperCase();

                new_data['order_id'] = order_id_str;
                var new_emp = JSon[i].employee_details[0];

                new_data['employee_details'] = new_emp;

                var new_ser = JSon[i].service_details[0];

                new_data['service_details'] = new_ser;

                new_arr.push(new_data);
            }

            return { result: true, 'message': 'data found', data: new_arr };
        } else {
            return { result: false, 'message': 'data not found' };
        }
    }
    else {
        return { result: false, 'message': 'data not found' };
    }

}

const employeeRatingsDataRequest = async id => {
    let param = {};
    let ratingArr = [];
    let avg = 0;
    if (typeof id === 'undefined') {
        return { result: false, 'message': 'id is required' };
    }
    else {
        param['employee_id'] = new mongoose.Types.ObjectId(id);
        const output = await JobRequest.find(param);
        if (output.length > 0) {
            await output.map(obj => {
                const { employee_rating } = obj;
                if (employee_rating) ratingArr.push(parseInt(employee_rating));
            });
        }
    }
    if (ratingArr.length > 0) {
        let combRat = 0;
        let arrLen = ratingArr.length;
        ratingArr.map(rat => {
            combRat = combRat + rat;
        });
        avg = combRat / arrLen;
    }
    return { result: true, 'message': 'rating returned', rating: avg };
}

async function EmployeeDataRequest(id, type) {
    if (typeof id === 'undefined') {
        return { result: false, 'message': 'id is required' };
    }
    let param = {};
    param['employee_id'] = new mongoose.Types.ObjectId(id);
    const output = await JobRequest.find(param);
    if (output !== 0) {
        //const status = type === 'bookings' ? { $nin: ["Pending", "Failed", "Canceled", "No Response"] } : { $nin: ["Pending"] };
        const JSon = await JobRequest.aggregate([
            { $match: { employee_id: new mongoose.Types.ObjectId(id) } },
            {
                "$project": {
                    "user_id": {
                        "$toObjectId": "$user_id"
                    },
                    "employee_id": {
                        "$toObjectId": "$employee_id"
                    },
                    "service_id": {
                        "$toObjectId": "$service_id"
                    },
                    "status": {
                        "$toString": "$status"
                    },
                    "chat_status": {
                        "$toString": "$chat_status"
                    },
                    "delivery_address": {
                        "$toString": "$delivery_address"
                    },
                    "delivery_lat": {
                        "$toString": "$delivery_lat"
                    },
                    "delivery_lang": {
                        "$toString": "$delivery_lang"
                    },
                    "customer_rating": {
                        "$toString": "$customer_rating"
                    },
                    "customer_review": {
                        "$toString": "$customer_review"
                    },
                    "employee_rating": {
                        "$toString": "$employee_rating"
                    },
                    "employee_review": {
                        "$toString": "$employee_review"
                    },
                    "createdDate": {
                        "$toString": "$createdDate"
                    }
                }
            },

            {
                $lookup:
                {
                    from: "users",
                    localField: "user_id",
                    foreignField: "_id",
                    as: "user_details"
                }
            },
            {
                $lookup:
                {
                    from: "services",
                    localField: "service_id",
                    foreignField: "_id",
                    as: "service_details"
                }
            }
        ]);

        if (JSon.length) {
            var new_arr = []
            for (var i = 0; i < JSon.length; i++) {
                var new_data = {};
                new_data = JSon[i];

                var new_date = JSon[i].createdDate;
                var d = new Date(new_date);
                new_date = ("0" + d.getDate()).slice(-2) + '-' + monthNames[d.getMonth()] + '-' + d.getFullYear();
                new_data['createdDate'] = new_date;


                var order_id_str = new_data._id;
                order_id_str = order_id_str.toString();
                var lang_take = parseInt(order_id_str.length) - 5;

                order_id_str = order_id_str.substr(parseInt(lang_take));
                order_id_str = 'HRF-' + order_id_str.toUpperCase();

                new_data['order_id'] = order_id_str;
                var new_emp = JSon[i].user_details[0];
                new_data['user_details'] = new_emp;

                var new_ser = JSon[i].service_details[0];

                new_data['service_details'] = new_ser;

                new_arr.push(new_data);

            }
            return { result: true, 'message': 'data found', data: new_arr };
        } else {
            return { result: false, 'message': 'data not found' };
        }
    } else {
        return { result: false, 'message': 'data not found' };
    }

}

async function Usergroupby(id) {

    if (typeof id === 'undefined') {
        return { result: false, 'message': 'id is required' };
    }

    var param = {};
    param['employee_id'] = new mongoose.Types.ObjectId(id);
    await JobRequest.find(param);
    var JSon = await JobRequest.aggregate([
        { $match: { employee_id: new mongoose.Types.ObjectId(id) } },
        {
            $group: {
                _id: '$user_id',
                user_id: { $first: '$user_id' },
                service_id: { $first: '$service_id' },
                status: { $first: '$status' },
                chat_status: { $first: '$chat_status' },
                delivery_address: { $first: '$delivery_address' },
                delivery_lat: { $first: '$delivery_lat' },
                delivery_lang: { $first: '$delivery_lang' },
                customer_rating: { $first: '$customer_rating' },
                customer_review: { $first: '$customer_review' },
                employee_rating: { $first: '$employee_rating' },
                employee_review: { $first: '$employee_review' },
                createdDate: { $first: '$createdDate' },
                count: { $sum: 1 }
            }
        },
        {
            "$project": {
                "user_id": {
                    "$toObjectId": "$user_id"
                },
                "service_id": {
                    "$toObjectId": "$service_id"
                },
                "status": {
                    "$toString": "$status"
                },
                "chat_status": {
                    "$toString": "$chat_status"
                },
                "delivery_address": {
                    "$toString": "$delivery_address"
                },
                "delivery_lat": {
                    "$toString": "$delivery_lat"
                },
                "delivery_lang": {
                    "$toString": "$delivery_lang"
                },
                "customer_rating": {
                    "$toString": "$customer_rating"
                },
                "customer_review": {
                    "$toString": "$customer_review"
                },
                "employee_rating": {
                    "$toString": "$employee_rating"
                },
                "employee_review": {
                    "$toString": "$employee_review"
                },
                "createdDate": {
                    "$toString": "$createdDate"
                }
            }
        },

        {
            $lookup:
            {
                from: "users",
                localField: "user_id",
                foreignField: "_id",
                as: "user_details"
            }
        },
        {
            $lookup:
            {
                from: "services",
                localField: "service_id",
                foreignField: "_id",
                as: "service_details"
            }
        },
    ])

    if (JSon.length) {
        var new_arr = []

        for (var i = 0; i < JSon.length; i++) {
            var new_data = {};
            new_data = JSon[i];

            var new_date = JSon[i].createdDate;
            var d = new Date(new_date);
            // console.log(new_date);

            new_date = ("0" + d.getDate()).slice(-2) + '-' + shortMonths[d.getMonth()] + '-' + d.getFullYear();
            new_data['createdDate'] = new_date;


            var order_id_str = new_data._id;
            order_id_str = order_id_str.toString();
            var lang_take = parseInt(order_id_str.length) - 5;

            order_id_str = order_id_str.substr(parseInt(lang_take));
            order_id_str = 'HRF-' + order_id_str.toUpperCase();

            new_data['order_id'] = order_id_str;
            var new_emp = JSon[i].user_details[0];
            new_data['user_details'] = new_emp;

            var new_ser = JSon[i].service_details[0];

            new_data['service_details'] = new_ser;

            new_arr.push(new_data);

        }



        return { result: true, 'message': 'data found', data: new_arr };

    } else {

        return { result: false, 'message': 'data not found' };
    }

}

async function PushNotif(param) {
    const { save_notification } = param;
    if (typeof param.fcm_id === 'undefined' || typeof param.title === 'undefined' || typeof param.body == 'undefined') {
        return { result: false, message: 'fcm_id,title,data(o) and body is required' }
    }

    let newdata = {};
    if (param.data !== 'undefined') {
        newdata = Object.assign({}, param.data);
        newdata.title = param.title;
        newdata.body = param.body;
    }

    if (save_notification) {
        let save = {};
        save['user_id'] = new mongoose.Types.ObjectId(param.user_id);
        save['employee_id'] = new mongoose.Types.ObjectId(param.employee_id);
        save['order_id'] = param.order_id;
        save['title'] = param.title;
        save['message'] = param.body;
        save['type'] = param.type;
        save['notification_by'] = param.notification_by;
        const notif_save = new Notification(save);
        await notif_save.save();
    }
    const message = {
        data: { data: JSON.stringify(newdata) },
        token: param.fcm_id
    }
    if (newdata) {
        return new Promise((resolve, reject) => {
            admin.messaging().send(message)
                .then((response) => {
                    // Response is a message ID string.
                    resolve({ result: true, message: response });
                    console.log('Successfully sent message:', response);
                })
                .catch((error) => {
                    console.log('Error sending message:', error);
                    reject({ result: true, message: error });
                });
        });
    }

}


function distance(lat1, lon1, lat2, lon2, unit) {
    if ((lat1 == lat2) && (lon1 == lon2)) {
        return 0;
    }
    else {
        var radlat1 = Math.PI * lat1 / 180;
        var radlat2 = Math.PI * lat2 / 180;
        var theta = lon1 - lon2;
        var radtheta = Math.PI * theta / 180;
        var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
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

module.exports = {
    serviceprovider,
    AddJobRequest,
    UpdateJobRequest,
    CustomerDataRequest,
    EmployeeDataRequest,
    Addrating,
    Providerstatuscheck,
    Customerstatuscheck,
    Ratingreview,
    Usergroupby,
    employeeRatingsDataRequest
};