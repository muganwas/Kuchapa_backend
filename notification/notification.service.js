const config = require('../config');
const db = require('_helpers/db');
var mongoose = require('mongoose');
const admin = require('firebase-admin');
const Job = db.Job;
const JobRequest = db.JobRequest;
const Notification = db.Notification;
const Employee = db.Employee;
const shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];

async function AddReviewRequest(param) {
  if (typeof param.user_id === 'undefined' ||
    typeof param.employee_id === 'undefined' ||
    typeof param.order_id === 'undefined' ||
    typeof param.notification.title === 'undefined' ||
    typeof param.notification.body === 'undefined') {
    return { result: false, message: 'user_id,employee_id,order_id,notification.title,notification.body and notification(o) is required' };
  }

  var save = {};
  save['user_id'] = param.user_id;
  save['employee_id'] = param.employee_id;
  save['order_id'] = param.order_id;
  save['title'] = param.notification.title;
  save['message'] = param.notification.body;
  save['type'] = "ReviewRequest";
  save['notification_by'] = "Employee";

  var order_id = mongoose.Types.ObjectId(param.order_id);
  //   console.log(order_id);
  var customer_review = await JobRequest.findById(order_id);
  if (customer_review) {
    var update_customer_review = {};
    update_customer_review['customer_review'] = 'Requested';
    Object.assign(customer_review, update_customer_review);

    var customer_review_output = await customer_review.save();
    //   console.log(customer_review_output);
  } else {
    return { result: false, message: 'Service not found' };
  }

  const notif_save = new Notification(save);

  var output = {};
  if (output = await notif_save.save()) {
    var notif = {};
    if (param.notification !== 'undefined') {
      let notification = Object.assign(param.notification, {save_notification: true});
      notif = await PushNotif(notification);
    }

    return { result: true, 'message': 'Add request successfull', 'notification': notif, data: output };
  } else {

    return { result: false, message: 'Something went wrong while request for review' };
  }

}

async function ReadNotification(id) {
  if (typeof id === 'undefined') {
    return { result: false, message: 'id is required' };
  }
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
}

async function DeleteNotification(id) {
  if (typeof id === 'undefined') {
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

async function GetEmployeeNotifications(id) {

  if (typeof id === 'undefined') {
    return { result: false, message: 'id is required' };
  }

  //, notification_for: 'Employee' 

  var notif = await Notification.aggregate([
    { $match: { employee_id: new mongoose.Types.ObjectId(id) } },
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
    { '$sort': { 'createdDate': -1 } },
    {
      $lookup:
      {
        from: "users",
        localField: "user_id",
        foreignField: "id",
        as: "customer_details"
      }
    }
  ]);

  var output = new Array();
  if (notif.length > 0) {

    for (var i = 0; i < notif.length; i++) {

      if (notif[i].notification_for == 'Admin') {
        continue;
      }

      if (notif[i].notification_by == 'Customer') {
        var d = new Date(notif[i].createdDate);
        notif[i].createdDate = ("0" + d.getDate()).slice(-2) + '-' + shortMonths[d.getMonth()] + '-' + d.getFullYear();

        notif[i].customer_details = notif[i].customer_details[0];
        output.push(notif[i]);

      }
    }
    // console.log(output);
    return { result: true, message: 'Data found', data: output };
  } else {
    return { result: false, message: 'Data not found' };
  }
}

async function GetCustomerNotification(id) {
  if (typeof id === 'undefined') {
    return { result: false, message: 'id is required' };
  }

  var notif = await Notification.aggregate([
    { $match: { user_id: new mongoose.Types.ObjectId(id) } },
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
    { '$sort': { 'createdDate': -1 } },
    {
      $lookup:
      {
        from: "employees",
        localField: "employee_id",
        foreignField: "id",
        as: "employee_details"
      }
    }
  ]);

  var output = new Array();
  if (notif.length > 0) {

    for (var i = 0; i < notif.length; i++) {

      if (notif[i].notification_for == 'Admin') {
        continue;
      }

      if (notif[i].notification_by == 'Employee') {
        var d = new Date(notif[i].createdDate);
        notif[i].createdDate = ("0" + d.getDate()).slice(-2) + '-' + shortMonths[d.getMonth()] + '-' + d.getFullYear();
        notif[i].employee_details = notif[i].employee_details[0];
        output.push(notif[i]);

      }
    }
    // console.log(output);
    return { result: true, message: 'Data found', data: output };
  } else {
    return { result: false, message: 'Data not found' };
  }
}

async function GetAdminNotification() {
  return await Notification.find({ notification_for: "Admin", status: "0" });
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
          console.log('Successfully sent message:', response);
        })
        .catch((error) => {
          console.log('Error sending message:', error);
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