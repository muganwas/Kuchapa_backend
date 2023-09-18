const config = require('../config')
//const express = require('express')
const { EmployeeRatingsDataRequest } = require('../jobrequest/jobrequest.service');
const { ObjectId } = require('mongodb')
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs')
const admin = require('firebase-admin');
const db = require('_helpers/db')

const Employee = db.Employee
const Service = db.Services

const Notification = db.Notification
const SendMail = require('../_helpers/SendMail');
const { imageExists, fetchCountryCodes } = require('../misc/helperFunctions');

async function authenticate(param) {
  let avgRating = 0;
  if (typeof param.email === 'undefined') {
    return {
      result: false,
      message: 'email, fcm_id(o) and password is required'
    }
  }
  var user = await Employee.findOne({ email: param.email });

  if (!user) {
    return { result: false, message: 'email not found' }
  }

  if (user.status == '0') {
    return { result: false, message: 'Your account is deactivated by admin' }
  }

  if (typeof param.fcm_id !== 'undefined') {
    //if id exists update average rating
    if (user._id)
      await EmployeeRatingsDataRequest(user._id).then(res => {
        avgRating = res.rating;
      });
    let fcm = { fcm_id: param.fcm_id, avgRating }
    Object.assign(user, fcm)
    await user.save()
  }

  if ((user && bcrypt.compareSync(param.password, user.hash)) || param.loginType === 'Firebase') {
    let mystr = user.services
    arr = mystr.split(',')
    let ser_arr = []

    for (let i = 0; i < arr.length; i++) {
      if (arr[i].length > 0) {
        let service = await Service.find({ _id: arr[i] })
        if (service.length) {
          ser_arr.push(service[0])
        }
      }
    }
    user.services = JSON.stringify(ser_arr);
    user = user.toJSON();
    user['image_available'] = await imageExists(user.image);
    const country = await fetchCountryCodes();
    user = Object.assign(user, country.data);
    return {
      result: true,
      message: 'Login successfull',
      id: user.id,
      data: user
    }
  } else {
    return { result: false, message: 'Password not matched' }
  }
}

async function getAll(query) {
  const { page = 1, limit = 10 } = query;
  const count = await Employee.countDocuments();
  var output = await Employee.find({})
    // We multiply the "limit" variables by one just to make sure we pass a number and not a string
    .limit(limit * 1)
    .skip((page - 1) * limit)
    // We sort the data by the date of their creation in descending order (user 1 instead of -1 to get ascending order)
    .sort({ createdDate: 1 });
  const totalPages = Math.ceil(count / limit);
  const country = await fetchCountryCodes();
  if (output) {
    for (let i = 0; i < output.length; i++) {
      let mystr = output[i].services
      arr = mystr.split(',')
      let ser_arr = []

      for (let j = 0; j < arr.length; j++) {
        if (arr[j].length > 0) {
          let service = await Service.find(ObjectId(arr[j]))
          if (service) {
            ser_arr.push(service[0].service_name)
          }
        }
      }
      output = output.toJSON();
      output[i]['image_available'] = await imageExists(output[i].image);
      output[i] = Object.assign(output[i], country.data);
      output[i].services = ser_arr.toString()
    }
    return { result: true, message: 'Service providers found', data: output, metadata: { totalPages, page, limit } }
  } else {
    return { result: false, message: 'No service providers found' }
  }
}

async function PushNotif(param) {
  const { save_notification } = param;
  if (
    typeof param.fcm_id === 'undefined' ||
    typeof param.title === 'undefined' ||
    typeof param.body == 'undefined'
  ) {
    return {
      result: false,
      message: 'fcm_id,title,data(o) and body is required'
    }
  }

  let newdata = {}

  if (param.data !== 'undefined') {
    newdata = param.data
  }

  if (save_notification) {
    let save = {};
    save['user_id'] = new mongoose.Types.ObjectId(param.user_id);
    save['employee_id'] = new mongoose.Types.ObjectId(param.employee_id);
    save['order_id'] = param.order_Id;
    save['title'] = param.title;
    save['message'] = param.body;
    save['type'] = param.type;
    save['notification_by'] = param.notification_by

    const notif_save = new Notification(save);
    notif_save.save();
  }

  let message = {
    data: { data: JSON.stringify(newdata) },
    token: param.fcm_id
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

const findUserById = async id => {
  var data = await Employee.findById(id);
  data = data.toJSON();
  if (data) {
    data['image_available'] = await imageExists(data.image);
    const country = await fetchCountryCodes();
    data = Object.assign(data, country.data);
    return { result: true, data, message: 'Service provider found' }
  } else {
    return { result: false, message: 'Service provicer Not Found' }
  }
}

async function Verification(id) {
  const output = await Employee.findById(id)
  if (output) {
    let userParam = {}
    userParam['email_verification'] = 1
    Object.assign(output, userParam)
    let v = await output.save()

    return { result: true, message: 'Provider verified successfully' }
  } else {
    return { result: false, message: 'Provider Not Found' }
  }
}

async function getById(id, param) {
  let avgRating = 0;
  if (typeof id === 'undefined') {
    return { result: false, message: 'id is required' }
  }

  let output = ''
  let arr = [];
  if ((output = await Employee.findById(id).select('-hash'))) {
    await EmployeeRatingsDataRequest(output._id).then(res => {
      avgRating = res.rating;
    });
    if (typeof param.fcm_id !== 'undefined') {
      let fcm = { fcm_id: param.fcm_id, avgRating }
      Object.assign(output, fcm)
      output = await output.save();
    }

    let mystr = output.services
    arr = mystr.split(',')
    let ser_arr = []

    for (let i = 0; i < arr.length; i++) {
      if (arr[i].length > 0) {
        let service = await Service.find({ _id: arr[i] })
        if (service.length) {
          ser_arr.push(service[0])
        }
      }
    }
    output.services = JSON.stringify(ser_arr);
    output = output.toJSON();
    output['image_available'] = await imageExists(output.image);
    const country = await fetchCountryCodes();
    output = Object.assign(output, country.data);
    return { result: true, message: 'employee found', data: output }
  } else {
    return { result: false, message: 'employee not found' }
  }
}

async function checkEmail(param) {
  if (typeof param.email === 'undefined') {
    return { result: false, message: 'Email is required' }
  }

  let emp_data = null;
  var user1 = await Employee.findOne({ email: param.email })
  if (user1) {
    emp_data = Object.assign(user1, {
      username: param.username,
      image: param.image,
      img_status: param.image ? 1 : 0
    })

    if (typeof param.fcm_id !== 'undefined') {
      let fcm = { fcm_id: param.fcm_id }
      Object.assign(emp_data, fcm)
      emp_data = await emp_data.save();
    }
    if (emp_data) {
      let mystr = emp_data.services
      let arr = mystr.split(',')
      let ser_arr = new Array()
      for (let i = 0; i < arr.length; i++) {
        if (arr[i].length > 0) {
          let service = await Service.find({ _id: arr[i] })
          if (service.length) {
            ser_arr.push(service[0]);
          }
        }

      }
      emp_data.services = JSON.stringify(ser_arr);
      emp_data = emp_data.toJSON();
      emp_data['image_available'] = await imageExists(emp_data.image);
      return { result: true, message: 'Email already Exists', data: emp_data }
    }
    else {
      return { result: false, message: 'Something went wrong' }
    }
  } else {
    return { result: false, message: 'Email not found' }
  }
}

async function create(params) {
  const userParam = params.data;
  const mobile = userParam.mobile
  const email = userParam.email
  const image = userParam.image
  const username = userParam.username
  if (
    (typeof mobile === 'undefined' || mobile && mobile.length === 0) &&
    ((typeof username === 'undefined' || username && username.length === 0) ||
      (typeof email === 'undefined' || email && email.length === 0) ||
      (typeof image === 'undefined' || image && image.length === 0))
  ) {
    return {
      result: false,
      message:
        'username,surname,mobile,address,invoice,services,description,lat(o),lang(o),fcm_id(o)'
    }
  }
  if (userParam.type === 'normal') {
    userParam.img_status = userParam.image ? 1 : 0
  }

  if (userParam.type == 'google' || userParam.type == 'facebook' || userParam.type === 'phone') {
    userParam.password = ''
    userParam.email_verification = 1
    userParam.hash = ''
  }
  if (userParam.password) {
    userParam.hash = bcrypt.hashSync(userParam.password, 10)
  }
  if ((typeof mobile !== 'undefined' && mobile.length > 0) && (typeof email === 'undefined' || email && email.length === 0)) {
    /** mobile based user search */
    try {
      const existingUser = await Employee.findOne({ mobile });
      let emp_data;
      let arr;
      if (existingUser) {
        if (userParam.type === 'google' || userParam.type === 'facebook' || userParam.type === 'phone') {
          emp_data = Object.assign(existingUser.toJSON(), {
            username,
            image: userParam.image
          });
          let mystr = emp_data.services;
          arr = mystr.split(',');
          let ser_arr = [];
          for (let i = 0; i < arr.length; i++) {
            if (arr[i].length > 0) {
              let service = await Service.find({ _id: arr[i] });
              if (service.length) {
                ser_arr.push(service[0])
              }
            }
          }
          emp_data.services = JSON.stringify(ser_arr);
          emp_data['image_available'] = await imageExists(emp_data.image);
          const country = await fetchCountryCodes();
          emp_data = Object.assign(emp_data, country.data);
          if (emp_data.image != undefined && emp_data.image != '') {
            emp_data.img_status = '1'
          }
          if (emp_data.status === '0') {
            return {
              result: false,
              message: 'Your account is deactivated by admin'
            }
          }
          return {
            result: true, message: 'You signed up successfully.', data: emp_data
          };
        } else {
          return { result: false, message: 'Email is already Exist' }
        }
      }
      else {
        const emp = new Employee(userParam);
        try {
          var output = await emp.save();
          if (output) {
            const message = `Please <a href="${config.URL}employee/verification/${output.id}">Click Here </a> To verify your Email`
            if (userParam.email_verification === 0) SendMail(userParam.email, 'Email Address Verification', message)

            const notification = new Notification({
              type: 'New User',
              order_id: '',
              message: output.username + ' registered as a service provider',
              notification_for: 'Admin',
              notification_by: 'Employee',
              notification_link: '/employee/' + output._id,
              employee_id: output._id,
              title: 'New Provider'
            })

            const notificationRes = await notification.save();

            let mystr = output.services
            let arr = mystr.split(',')
            let ser_arr = new Array()

            for (let i = 0; i < arr.length; i++) {
              if (arr[i].length > 0) {
                let service = await Service.find({ _id: arr[i] })
                if (service.length) {
                  ser_arr.push(service[0])
                }
              }
            }
            output.services = JSON.stringify(ser_arr);
            output = output.toJSON();
            output['image_available'] = await imageExists(output.image);
            const country = await fetchCountryCodes();
            output = Object.assign(output, country.data);
            if (notificationRes)
              return { result: true, message: 'You signed up successfully.', data: output };
            return { result: true, message: 'You signed up successfully with some errors.', data: output };
          } else {
            return { result: false, message: 'Registeration failed try again later' };
          }
        } catch (e) {
          return { result: false, message: e.message };
        };
      }
    } catch (e) {
      return { result: false, message: e.message };
    };
  } else {
    /** email based user search */
    try {
      const existingUser = await Employee.findOne({ email: userParam.email });
      let emp_data;
      let arr;
      if (existingUser) {
        if (userParam.type === 'google' || userParam.type === 'facebook') {
          emp_data = Object.assign(existingUser.toJSON(), {
            username: userParam.username,
            image: userParam.image
          });
          let mystr = emp_data.services;
          arr = mystr.split(',');
          let ser_arr = [];
          for (let i = 0; i < arr.length; i++) {
            if (arr[i].length > 0) {
              let service = await Service.find({ _id: arr[i] });
              if (service.length) {
                ser_arr.push(service[0])
              }
            }
          }
          emp_data.services = JSON.stringify(ser_arr);
          if (emp_data.image !== undefined && emp_data.image !== '') {
            emp_data.img_status = '1'
          }
          if (emp_data.status === '0')
            return {
              result: false,
              message: 'Your account is deactivated by admin'
            }
          emp_data['image_available'] = await imageExists(emp_data.image);
          const country = await fetchCountryCodes();
          emp_data = Object.assign(emp_data, country.data);
          return { result: true, message: 'You signed in successfully.', data: emp_data };
        } else {
          return { result: false, message: 'Email already Exists' };
        }
      }
      else {
        userParam.password && delete userParam.passwoard;
        const emp = new Employee(userParam)
        try {
          var output = await emp.save();
          if (output) {
            const message = `Please <a href="${config.URL}employee/verification/${output.id}">Click Here </a> To verify your Email`
            if (userParam.email_verification === 0 || userParam.email_verification === undefined) SendMail(userParam.email, 'Email Address Verification', message)

            const notification = new Notification({
              type: 'New User',
              order_id: '',
              message: output.username + ' registered as a service provider',
              notification_for: 'Admin',
              notification_by: 'Employee',
              notification_link: '/employee/' + output._id,
              employee_id: output._id,
              title: 'New Provider'
            })

            const notificationRes = await notification.save();
            let mystr = output.services
            let arr = mystr.split(',')
            let ser_arr = new Array()

            for (let i = 0; i < arr.length; i++) {
              if (arr[i].length > 0) {
                let service = await Service.find({ _id: arr[i] })
                if (service.length) {
                  ser_arr.push(service[0])
                }
              }
            }
            output.services = JSON.stringify(ser_arr);
            output = output.toJSON();
            output['image_available'] = await imageExists(output.image);
            const country = await fetchCountryCodes();
            output = Object.assign(output, country.data);
            if (notificationRes)
              return {
                result: true, message: 'You signed up successfully.', data: output
              };
            return {
              result: true, message: 'You signed up successfully with errors.', data: output
            };
          } else {
            return { result: false, message: 'Registeration failed try again later' };
          }
        } catch (e) {
          return { result: false, message: e.message };
        };
      }
    } catch (e) {
      return { result: false, message: e.message };
    };
  }
}

async function ForgotPassword(param) {
  let err;
  let msg;
  if (typeof param.email === 'undefined') {
    return { result: false, message: 'email is required' }
  }
  const user = await Employee.findOne({ email: param.email })

  if (!user) {
    return { result: false, message: 'Email does not exist' }
  }
  if (user && user.password) {
    const message = {
      from: 'team.kuchapamobileapp@gmail.com', // Sender address
      to: param.email, // List of recipients
      subject: 'Password Recovery Mail', // Subject line
      text: `Hello ${user.username}, \r\n Your password is ${user.password}` // Plain text body
    };
    msg = 'Your password was sent to your registered email address.';
    SendMail(message.to, message.subject, message.text);
  }
  if (user && !user.password) {
    const auth = admin.auth();
    await auth.getUserByEmail(user.email).then(async user => {
      if (user) {
        await auth.generatePasswordResetLink(user.email).then(link => {
          msg = 'Check your email address for a password reset link.';
          SendMail(user.email, 'PASSWORD RESET LINK', `Copy and paste this link ${link} or, <br/> click on link below. <br/><br/> <a title="reset link" href=${link}>Reset your password</a>`);
        })
      }
    }).catch(e => {
      if (e.message && e.message.indexOf('There is no') > -1) {
        err = 'We cannot reset your password, you used a third party login.';
      }
      else
        err = e.message;
    })
  }
  if (err || msg) {
    return { result: msg ? true : false, message: msg ? msg : err };
  }
}

async function update(id, userParam) {
  const user = await Employee.findById(id)

  // validate
  if (!user) return { result: false, message: 'User not found' }
  if (
    user.mobile !== userParam.mobile &&
    (await Employee.findOne({ mobile: userParam.mobile }))
  ) {
    return {
      result: false,
      message: 'Mobile "' + userParam.mobile + '" is already taken'
    }
  }

  // hash password if it was entered
  if (userParam.password) {
    userParam.hash = bcrypt.hashSync(userParam.password, 10)
  }
  try {
    // copy userParam properties to user
    Object.assign(user, userParam);
    let output = await user.save();
    output = output.toJSON();
    output['image_available'] = await imageExists(output.image);
    const country = await fetchCountryCodes();
    output = Object.assign(output, country.data);
    return { result: true, message: 'Update successfull', data: output }
  } catch (e) {
    return { result: false, message: 'Something went wrong' }
  }
}

async function uploadImage(body) {
  const { userId, uri } = body;
  if (!userId || !uri) {
    return { result: false, message: 'id and image is required' };
  }
  const user = await Employee.findById(userId);
  if (!user) {
    return { result: false, message: 'id not found' };
  }
  try {
    Object.assign(user, { image: uri, img_status: 1 });
    let output = await user.save();
    output = output.toJSON();
    output['image_available'] = await imageExists(output.image);
    const country = await fetchCountryCodes();
    output = Object.assign(output, country.data);
    return { result: true, message: 'Image Update successfull', data: output }
  } catch (e) {
    return { result: false, message: e.message }
  }
}

async function _delete(id) {
  await Employee.findByIdAndRemove(id)
}

module.exports = {
  authenticate,
  getAll,
  getById,
  Verification,
  create,
  findUserById,
  update,
  checkEmail,
  ForgotPassword,
  PushNotif,
  uploadImage,
  _delete
}
