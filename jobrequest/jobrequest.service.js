const db = require('_helpers/db');
const mongoose = require('mongoose');
const Notification = db.Notification;
const JobRequest = db.JobRequest;
const Employee = db.Employee;
const admin = require("firebase-admin");
const { imageExists, distance } = require('../misc/helperFunctions');
const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];
const shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];

async function ServiceProvider(id, job) {
    if (typeof job.lat === 'undefined' ||
        typeof job.lang === 'undefined') {
        return { result: false, message: 'lat and lang is required' };
    }

    var emp = await Employee.find();
    var data = [];

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

async function JobRequestDetails(query) {
    try {
        const { orderId, userType, employeeId, userId, omit = '', only = '' } = query;
        if (!orderId || orderId == 'undefined') return { result: false, message: 'orderId is required' };
        let usersJobs;
        if (userType == 'Employee')
            usersJobs = await EmployeeDataRequest({ id: employeeId, userId, omit, page: 1, only, limit: 0 });
        else usersJobs = await CustomerDataRequest({ id: userId, employeeId, omit, page: 1, only, limit: 0 });
        var job;
        if (usersJobs && usersJobs.result) {
            job = usersJobs.data.find(j => j.order_id === orderId);
            return { result: true, data: job, message: 'Job found' };
        }
        return { result: false, message: 'Job was not found' };
    } catch (e) {
        return { result: false, message: e.message };
    }
}

async function AddJobRequest(param) {
    if (typeof param.user_id === 'undefined' ||
        typeof param.employee_id === 'undefined' ||
        typeof param.service_id === 'undefined') {
        return { result: false, message: 'user_id,employee_id,notification(for push notification),delivery_address , delivery_lat(o), delivery_lang(o) and service_id is required' };
    }
    var search = { user_id: new mongoose.Types.ObjectId(param.user_id), employee_id: new mongoose.Types.ObjectId(param.employee_id), status: { $nin: ["Failed", "Cancelled", "Rejected", "No Response", "Completed"] } };
    var request = await JobRequest.find(search);

    if (request.length > 0) {
        return { result: false, 'message': 'Job already exists.' };
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

                param.notification.data['main_id'] = order_id;
                order_id = order_id.substr(order_id.length - 5);

                param.notification.data['order_id'] = 'HRF-' + order_id.toUpperCase();
                notif = await PushNotif(param.notification);
                if (!notif.result) {
                    return { result: true, message: 'Add request successfull without sending notification.', data: output };
                }
            }
            return { result: true, 'message': 'Add request successfull', 'notification': notif, data: output };
        } else {
            return { result: false, message: 'Something went wrong while request is added' };
        }
    }

}

async function CustomerStatusCheck({ id, type, page = 1, limit = 10 }) {
    if (id == undefined || id == 'undefined') {
        return { result: false, 'message': 'id is required' };
    }
    /** Consider accepted jobs as pending */
    const status = type.toString().toLowerCase() === 'pending' ? { $in: ["Pending", "Accepted"] } : { $in: ["Failed", "Cancelled", "Rejected", "No Response", "Completed"] };
    var param = { user_id: new mongoose.Types.ObjectId(id), status };
    var output = await JobRequest.find(param);
    const count = await JobRequest.countDocuments(param);
    const totalPages = Math.ceil(count / limit);
    const numLimit = Number(limit);
    const numSkip = (Number(page) - 1) * Number(limit);
    if (output != undefined) {
        var JSon = await JobRequest.aggregate([
            { $match: param },
            {
                "$project": {
                    "employee_id": {
                        "$toObjectId": "$employee_id"
                    },
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
            },
            {
                $skip: numSkip
            },
            {
                $sort: { createdDate: 1 }
            },
            {
                $limit: numLimit
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
                new_emp['image_available'] = await imageExists(new_emp.image);
                new_data['employee_details'] = new_emp;
                var new_ser = JSon[i].service_details[0];

                new_data['service_details'] = new_ser;

                new_arr.push(new_data);
            }
        }
        return { result: true, 'message': 'Job request found.', data: new_arr, metadata: { totalPages, page, limit } };
    }
    else {
        return { result: false, message: 'No data to load' };
    }

}

async function ProviderStatusCheck({ id, type, page = 1, limit = 10 }) {
    if (id == undefined || id == 'undefined') {
        return { result: false, 'message': 'id is required' };
    }
    /** Consider accepted jobs as pending */
    const status = type.toString().toLowerCase() === 'pending' ? { $in: ["Pending", "Accepted"] } : { $in: ["Failed", "Cancelled", "Rejected", "No Response", "Completed"] };
    var param = { employee_id: new mongoose.Types.ObjectId(id), status };
    var output = await JobRequest.find(param);
    const count = await JobRequest.countDocuments(param);
    const totalPages = Math.ceil(count / limit);
    const numLimit = Number(limit);
    const numSkip = (Number(page) - 1) * Number(limit);
    if (output != undefined) {
        var JSon = await JobRequest.aggregate([
            { $match: param },
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
            },
            {
                $skip: numSkip
            },
            {
                $sort: { createdDate: 1 }
            },
            {
                $limit: numLimit
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
                var new_cust = JSon[i].customer_details[0];
                new_cust['image_available'] = await imageExists(new_cust.image);

                new_data['customer_details'] = new_cust;

                var new_ser = JSon[i].service_details[0];

                new_data['service_details'] = new_ser;
                new_arr.push(new_data);
            }
        }
        return { result: true, 'message': 'Job requests found.', data: new_arr, metadata: { totalPages, page, limit } };
    }
    else {
        return { result: false, message: 'No data to load' };
    }
}

async function AddRating(param) {
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
            notif = await PushNotif(param.notification);
            if (!notif.result) {
                return { result: true, message: 'Add request successfull without sending notification.', data: output };
            }
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
    var notif = {};
    const output = await request.save();
    if (output) {
        if (param.notification !== undefined) {
            notif = await PushNotif(param.notification);
            if (!notif.result) {
                return { result: true, message: 'Update successfull without sending notification.', data: output };
            }
        }
        return { result: true, message: 'Update successfull', notification: notif, data: output };
    }
    else {
        return { result: false, message: 'Something went wrong' };
    }

}

async function RatingReview(param) {
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
        await notif_save.save();
        return { result: true, message: 'Update successfull', data: output };
    }
    else {
        return { result: false, message: 'Something went wrong' };
    }
}

async function CustomerDataRequest({ id, employeeId, omit = '', page = 1, limit, only = '' }) {
    if (typeof id === 'undefined' || id == 'undefined') {
        return { result: false, 'message': 'id is required' };
    }
    const newOmit = omit.split(" ");
    const newOnly = only.split(",");
    let param = { user_id: new mongoose.Types.ObjectId(id), status: only ? { $in: newOnly } : omit ? { $nin: newOmit } : { $nin: [] } };
    if (employeeId && employeeId != 'undefined')
        param = { user_id: new mongoose.Types.ObjectId(id), employee_id: new mongoose.Types.ObjectId(employeeId), status: only ? { $in: newOnly } : omit ? { $nin: newOmit } : { $nin: [] } };
    const output = await JobRequest.find(param);
    const count = await JobRequest.countDocuments(param);
    const totalPages = Math.ceil(count / limit);
    const numLimit = Number(limit);
    const numSkip = (Number(page) - 1) * Number(limit);
    const limitArr = limit ?
        [{
            $skip: numSkip
        },
        {
            $limit: numLimit
        }] : [];
    if (output != undefined) {
        const JSon = await JobRequest.aggregate([
            { $match: param },
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
            },
            {
                $sort: { createdDate: 1 }
            },
            ...limitArr
        ]);
        if (JSon) {
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
                var new_emp = JSon[i].employee_details[0];
                new_emp['image_exists'] = await imageExists(new_emp.image);
                new_data['employee_details'] = new_emp;

                var new_ser = JSon[i].service_details[0];

                new_data['service_details'] = new_ser;

                new_arr.push(new_data);
            }
            return { result: true, 'message': 'data found', data: new_arr, metadata: { totalPages, page, limit } };
        } else {
            return { result: false, 'message': 'No data to load' };
        }
    }
    else {
        return { result: false, 'message': 'No data to load' };
    }

}

const EmployeeRatingsDataRequest = async id => {
    let param = {};
    let ratingArr = [];
    let avg = 0;
    if (typeof id === 'undefined' || id == 'undefined') {
        return { result: false, 'message': 'id is required' };
    }
    try {
        param['employee_id'] = new mongoose.Types.ObjectId(id);
        const output = await JobRequest.find(param);
        if (output.length > 0) {
            await output.map(obj => {
                const { employee_rating } = obj;
                if (employee_rating) ratingArr.push(parseInt(employee_rating));
            });
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
    } catch (e) {
        return { result: false, 'message': e.message };
    }
}

async function EmployeeDataRequest({ id, userId, omit = '', page, filter = false, limit, only }) {
    if (typeof id === 'undefined' || id == 'undefined') {
        return { result: false, 'message': 'id is required' };
    }
    const newOmit = omit.split(" ");
    const newOnly = only.split(",");
    const newFilter = Boolean(filter);
    let param = { employee_id: new mongoose.Types.ObjectId(id), status: only ? { $in: newOnly } : omit ? { $nin: newOmit } : { $nin: [] } };
    if (userId && userId != 'undefined')
        param = { employee_id: new mongoose.Types.ObjectId(id), user_id: new mongoose.Types.ObjectId(userId), status: only ? { $in: newOnly } : omit ? { $nin: newOmit } : { $nin: [] } };
    const output = await JobRequest.find(param);
    const count = await JobRequest.countDocuments(param);
    const totalPages = Math.ceil(count / limit);
    const numLimit = limit ? Number(limit) : 0;
    const numSkip = (Number(page) - 1) * Number(limit);
    const limitArr = limit ?
        [{
            $skip: numSkip
        },
        {
            $limit: numLimit
        }] : [];
    if (output != undefined) {
        const JSon = await JobRequest.aggregate([
            { $match: param },
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
            },
            {
                $sort: { createdDate: 1 }
            },
            ...limitArr
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
                new_emp['image_exists'] = await imageExists(new_emp.image);
                new_data['user_details'] = new_emp;

                var new_ser = JSon[i].service_details[0];

                new_data['service_details'] = new_ser;

                new_arr.push(new_data);

            }
            var filteredData;
            if (newFilter) {
                filteredData = {};
                newOnly.forEach(nly => {
                    filteredData[nly] = new_arr.filter(dt => dt.status == nly);
                });
            }
            return { result: true, 'message': 'data found', filteredData, data: new_arr, metadata: { totalPages, page, limit } };
        } else {
            return { result: false, 'message': 'No data to load' };
        }
    } else {
        return { result: false, 'message': 'No data to load' };
    }
}

async function UserGroupBy(params, query) {
    const { id } = params
    const { page = 1, limit = 10 } = query;
    if (typeof id === 'undefined' || id == 'undefined') {
        return { result: false, 'message': 'id is required' };
    }

    var param = { employee_id: new mongoose.Types.ObjectId(id) };
    const output = await JobRequest.find(param);
    const count = await JobRequest.countDocuments(param);
    const totalPages = Math.ceil(count / limit);
    const numLimit = Number(limit);
    const numSkip = (Number(page) - 1) * Number(limit);
    if (output != undefined) {
        var JSon = await JobRequest.aggregate([
            { $match: param },
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
            {
                $skip: numSkip
            },
            {
                $sort: { createdDate: 1 }
            },
            {
                $limit: numLimit
            }
        ]);

        if (JSon.length) {
            var new_arr = []

            for (var i = 0; i < JSon.length; i++) {
                var new_data = {};
                new_data = JSon[i];

                var new_date = JSon[i].createdDate;
                var d = new Date(new_date);

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
            return { result: true, 'message': 'data found', data: new_arr, metadata: { totalPages, page, limit } };
        } else {
            return { result: false, 'message': 'No data to load' };
        }
    } else {
        return { result: false, 'message': 'No data to load' };
    }
}

async function PushNotif(param) {
    return new Promise(async (resolve, reject) => {
        const { save_notification } = param;
        if (typeof param.fcm_id === 'undefined' || typeof param.title === 'undefined' || typeof param.body == 'undefined') {
            resolve({ result: false, message: 'fcm_id,title,data(o) and body is required' });
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
            admin.messaging().send(message)
                .then((response) => {
                    // Response is a message ID string.
                    resolve({ result: true, message: response });
                })
                .catch((error) => {
                    reject({ result: true, message: error });
                });
        }
    });
}

module.exports = {
    ServiceProvider,
    AddJobRequest,
    UpdateJobRequest,
    CustomerDataRequest,
    EmployeeDataRequest,
    AddRating,
    ProviderStatusCheck,
    CustomerStatusCheck,
    JobRequestDetails,
    RatingReview,
    UserGroupBy,
    EmployeeRatingsDataRequest
};