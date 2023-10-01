const db = require('_helpers/db');
var mongoose = require('mongoose');
const admin = require('firebase-admin');
const { imageExists } = require('../misc/helperFunctions');
const JobRequest = db.JobRequest;
const Notification = db.Notification;
const shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];

async function AddReviewRequest(param) {
  if (typeof param.user_id === 'undefined' ||
    typeof param.employee_id === 'undefined' ||
    typeof param.order_id === 'undefined' ||
    typeof param.notification.title === 'undefined' ||
    typeof param.notification.body === 'undefined') {
    return { result: false, message: 'user_id,employee_id,order_id,notification.title,notification.body and notification(o) is required' };
  }
  try {
    var save = {};
    save['user_id'] = param.user_id;
    save['employee_id'] = param.employee_id;
    save['order_id'] = param.order_id;
    save['title'] = param.notification.title;
    save['message'] = param.notification.body;
    save['type'] = "ReviewRequest";
    save['notification_by'] = "Employee";

    var order_id = mongoose.Types.ObjectId(param.order_id);
    var customer_review = await JobRequest.findById(order_id);
    if (customer_review) {
      var update_customer_review = {};
      update_customer_review['customer_review'] = 'Requested';
      Object.assign(customer_review, update_customer_review);
      await customer_review.save();
    } else {
      return { result: false, message: 'Service not found' };
    }

    const notif_save = new Notification(save);

    var output = {};
    if (output = await notif_save.save()) {
      var notif = {};
      if (param.notification !== 'undefined') {
        let notification = Object.assign(param.notification, { save_notification: true });
        notif = await PushNotif(notification);
      }
      return { result: true, 'message': 'Add request successfull', 'notification': notif, data: output };
    } else {
      return { result: false, message: 'Something went wrong while request for review' };
    }
  } catch (e) {
    return { result: false, message: e.message };
  }
}

async function ReadNotification(id) {
  if (typeof id === 'undefined' || id == 'undefined') {
    return { result: false, message: 'id is required' };
  }
  try {
    const output = await Notification.findById(id);
    if (output) {
      let notif = {}
      notif['status'] = '1';
      Object.assign(output, notif);
      await output.save();
      return { result: true, message: 'Notification read successfully', data: output }
    } else {
      return { result: false, message: 'notification not found' };
    }
  } catch (e) {
    return { result: false, message: e.message };
  }
}

async function DeleteNotification(id) {
  if (typeof id === 'undefined' || id == 'undefined') {
    return { result: false, message: 'id is required' };
  }
  const output = await Notification.findById(id);
  if (output) {
    await Notification.findByIdAndDelete(id);
    return { result: true, message: 'Notification deleted successfully', data: output };
  } else {
    return { result: false, message: 'notification not found' };
  }
}

async function GetEmployeeNotifications(params, query) {
  try {
    const { id } = params;
    const { page = 1, limit = 10 } = query;
    if (typeof id === 'undefined' || id == 'undefined') {
      return { result: false, message: 'id is required' };
    }
    const param = { employee_id: new mongoose.Types.ObjectId(id), notification_for: { $nin: ['Admin'] }, notification_by: { $in: ['Customer'] } };
    const data = await Notification.find(param);
    const count = await Notification.countDocuments(param);
    const totalPages = Math.ceil(count / limit);
    const numLimit = Number(limit);
    const numSkip = (Number(page) - 1) * Number(limit);
    if (data != undefined) {
      var notif = await Notification.aggregate([
        { $match: param },
        {
          "$project": {
            "employee_id": {
              "$toObjectId": "$employee_id"
            },
            "order_id": {
              "$toString": "$order_id"
            },
            "type": {
              "$toString": "$type"
            },
            "title": {
              "$toString": "$title"
            },
            "status": {
              "$toString": "$status"
            },
            "message": {
              "$toString": "$message"
            },
            "notification_by": {
              "$toString": "$notification_by"
            },
            "createdDate": {
              "$toString": "$createdDate"
            },
            "employee_details": {
              "$toString": "$employee_details"
            },
          }
        },
        {
          $lookup:
          {
            from: "users",
            localField: "user_id",
            foreignField: "id",
            as: "customer_details"
          }
        },
        {
          $skip: numSkip
        },
        {
          $sort: { createdDate: -1 }
        },
        {
          $limit: numLimit
        },
      ]);

      var output = new Array();
      if (notif.length > 0) {
        for (var i = 0; i < notif.length; i++) {
          var d = new Date(notif[i].createdDate);
          notif[i].createdDate = ("0" + d.getDate()).slice(-2) + '-' + shortMonths[d.getMonth()] + '-' + d.getFullYear();

          notif[i].customer_details = notif[i].customer_details[0];
          notif[i].customer_details.imageAvailable = await imageExists(notif[i].customer_details.image);
          output.push(notif[i]);
        }
        return { result: true, message: 'Notifications retrieved', data: output, metadata: { totalPages, page, limit } };
      } else {
        return { result: false, message: 'You have no notifications' };
      }
    } else {
      return { result: false, message: 'You have no notifications' };
    }
  } catch (e) {
    return { result: false, message: e.message };
  }
}

async function GetCustomerNotification(params, query) {
  try {
    const { id } = params
    const { page = 1, limit = 10 } = query;
    if (typeof id === 'undefined' || id == 'undefined') {
      return { result: false, message: 'id is required' };
    }
    const param = { user_id: new mongoose.Types.ObjectId(id), notification_for: { $nin: ['Admin'] }, notification_by: { $in: ['Employee'] } };
    const data = await Notification.find(param);
    const count = await Notification.countDocuments(param);
    const totalPages = Math.ceil(count / limit);
    const numLimit = Number(limit);
    const numSkip = (Number(page) - 1) * Number(limit);
    if (data != undefined) {
      var notif = await Notification.aggregate([
        { $match: param },
        {
          "$project": {
            "user_id": {
              "$toString": "$user_id"
            },
            "order_id": {
              "$toString": "$order_id"
            },
            "type": {
              "$toString": "$type"
            },
            "title": {
              "$toString": "$title"
            },
            "status": {
              "$toString": "$status"
            },
            "message": {
              "$toString": "$message"
            },
            "notification_by": {
              "$toString": "$notification_by"
            },
            "createdDate": {
              "$toString": "$createdDate"
            },
            "employee_details": {
              "$toString": "$employee_details"
            },
          }
        },
        {
          $lookup:
          {
            from: "employees",
            localField: "employee_id",
            foreignField: "id",
            as: "employee_details"
          }
        },
        {
          $skip: numSkip
        },
        {
          $sort: { createdDate: -1 }
        },
        {
          $limit: numLimit
        },
      ]);
      var output = new Array();
      if (notif.length > 0) {
        for (var i = 0; i < notif.length; i++) {
          var d = new Date(notif[i].createdDate);
          notif[i].createdDate = ("0" + d.getDate()).slice(-2) + '-' + shortMonths[d.getMonth()] + '-' + d.getFullYear();
          notif[i].employee_details = notif[i].employee_details[0];
          notif[i].employee_details.imageAvailable = await imageExists(notif[i].employee_details.image);
          output.push(notif[i]);
        }
        return { result: true, message: 'Data found', data: output, metadata: { totalPages, page, limit } };
      } else {
        return { result: false, message: 'Data not found' };
      }
    } else {
      return { result: false, message: 'Data not found' };
    }
  } catch (e) {
    return { result: false, message: e.message };
  }
}

async function GetAdminNotification() {
  try {
    const data = await Notification.find({ notification_for: "Admin", status: "0" });
    return { result: true, data, message: 'notifications retrieved' };
  } catch (e) {
    return { result: true, message: e.message };
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

  let message = {
    data: { data: JSON.stringify(newdata) },
    token: param.fcm_id
  }

  if (save_notification) {
    let save = {};
    save['user_id'] = new mongoose.Types.ObjectId(param.user_id);
    save['employee_id'] = new mongoose.Types.ObjectId(param.employee_id);
    save['order_id'] = param.order_id;
    save['title'] = param.title;
    save['message'] = param.body;
    save['type'] = param.type;
    save['notification_by'] = param.notification_by

    const notif_save = new Notification(save);
    notif_save.save();
  }
  if (newdata) {
    return new Promise(function (resolve, reject) {
      admin.messaging().send(message)
        .then((response) => {
          // Response is a message ID string.
          resolve({ result: true, message: response });
        })
        .catch((error) => {
          reject({ result: true, message: error });
        });
    });
  }
}

module.exports = {
  AddReviewRequest,
  GetCustomerNotification,
  GetEmployeeNotifications,
  GetAdminNotification,
  PushNotif,
  ReadNotification,
  DeleteNotification
};