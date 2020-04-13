const config = require('../config')
//const express = require('express')
const { employeeRatingsDataRequest } = require('../jobrequest/jobrequest.service');
const { ObjectId } = require('mongodb')

//const app = express();

const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const gcm = require('node-gcm')

const db = require('_helpers/db')

const Employee = db.Employee
const Service = db.Services

const Notification = db.Notification
const SendMail = require('../_helpers/SendMail')

async function authenticate(param) {
    console.log('authenitcating')
    var avgRating = 0;
  if (typeof param.email === 'undefined') {
    return {
      result: false,
      message: 'email, fcm_id(o) and password is required'
    }
  }
  const user = await Employee.findOne({ email: param.email });


  if (!user) {
    return { result: false, message: 'email not found' }
  }

  if (user.status == '0') {
    return { result: false, message: 'Your account is deactivated by admin' }
  }
  /*    if(user.email_verification == 0){
         var message  = `Please <a href="${config.URL}#/customer_verification/${user.id}">Click Here </a> To verify your Email`;
         var mail = await SendMailFunction.SendMail(user.email,"Verification Request By Harfa", message);
               return {result:false,message:"Your email is not verified.Verify link sent"};
    }*/

  if (typeof param.fcm_id !== 'undefined') {
      //if id exists update average rating
    if (user._id)
        await employeeRatingsDataRequest(user._id).then(res => {
            avgRating = res.rating;
        });
    var fcm = { fcm_id: param.fcm_id, avgRating }
    Object.assign(user, fcm)
    await user.save()
  }

  if (user && bcrypt.compareSync(param.password, user.hash)) {
    const { hash, userWithoutHash } = user.toObject()
    const token = jwt.sign({ sub: user.id }, config.secret)
    if (user.img_status == '1') {
      user.image = config.URL + 'api/uploads/employee/' + user.image
    }

    var mystr = user.services
    arr = mystr.split(',')
    let ser_arr = []

    for (var i = 0; i < arr.length; i++) {
      var service = await Service.find({ _id: arr[i] })
      if (service.length) {
        ser_arr.push(service[0])
      }
    }
    user.services = JSON.stringify(ser_arr);
    return {
      result: true,
      message: 'Login successfull',
      token: token,
      id: user.id,
      data: user
    }
  } else {
    return { result: false, message: 'Password not matched' }
  }
}

async function getAll() {
    console.log('getting all')
  var output = await Employee.find()

  for (var i = 0; i < output.length; i++) {
    var mystr = output[i].services
    arr = mystr.split(',')
    let ser_arr = []

    for (var j = 0; j < arr.length; j++) {
      var service = await Service.find(ObjectId(arr[j]))
      if (service) {
        ser_arr.push(service[0].service_name)
      }
    }
    output[i].services = ser_arr.toString()
  }
  if (await output) {
    return await output
  } else {
    return { result: false }
  }
}

async function PushNotif(param) {
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

  let sender = new gcm.Sender(config.SERVER_KEY)
  var newdata = {}

  if (param.data !== 'undefined') {
    newdata = param.data
  }
  let message = new gcm.Message({
    notification: {
      title: param.title,
      subtitle: 'ssdid',
      icon: 'your_icon_name',
      body: param.body
    },
    data: newdata
  })

  let output = ''

  return new Promise(function(resolve, reject) {
    sender.sendNoRetry(message, [param.fcm_id], (err, response) => {
      if (err) {
        reject({ result: true, message: err })
      } else {
        resolve({ result: true, message: response })
      }
    })
  })
}

async function Verification(id) {
    console.log('verifying')
  const output = await Employee.findById(id)
  if (output) {
    var userParam = {}
    userParam['email_verification'] = 1
    Object.assign(output, userParam)
    var v = await output.save()

    return { result: true, message: 'Provider verified successfully' }
  } else {
    return { result: false, message: 'Provider Not Found' }
  }
}

async function getById(id, param) {
    console.log('getting by id')
    var avgRating = 0;
  if (typeof id === 'undefined') {
    return { result: false, message: 'id is required' }
  }

  var output = ''
  var arr = [];
  if ((output = await Employee.findById(id).select('-hash'))) {
    await employeeRatingsDataRequest(output._id).then(res => {
        avgRating = res.rating;
    });
    if (typeof param.fcm_id !== 'undefined') {
      var fcm = { fcm_id: param.fcm_id, avgRating }
      Object.assign(output, fcm)
      output = await output.save();
    }

    var mystr = output.services
    arr = mystr.split(',')
    let ser_arr = []

    for (var i = 0; i < arr.length; i++) {
      var service = await Service.find({ _id: arr[i] })
      if (service.length) {
        ser_arr.push(service[0])
      }
    }
    output.services = JSON.stringify(ser_arr)
    if (output.img_status == 1) {
      output.image = config.URL + 'api/uploads/employee/' + output.image
    }
    return { result: true, message: 'employee found', data: output }
  } else {
    return { result: false, message: 'employee not found' }
  }
}

async function CheckMobile(param) {
  if (typeof param.email === 'undefined') {
    return { result: false, message: 'Email is required' }
  }

  var emp_data = ''
  const user1 = await Employee.findOne({ email: param.email })
  if (user1) {
    emp_data = Object.assign(user1, {
      username: param.username,
      image: param.image,
      img_status: 0
    })

    if (typeof param.fcm_id !== 'undefined') {
      var fcm = { fcm_id: param.fcm_id }
      Object.assign(emp_data, fcm)
      var emp_data = await emp_data.save()
    }
    if (emp_data.img_status == 1) {
      emp_data.image = config.URL + 'api/uploads/employee/' + emp_data.image
    }

    var mystr = emp_data.services
    var arr = mystr.split(',')
    let ser_arr = new Array()

    for (var i = 0; i < arr.length; i++) {
      var service = await Service.find({ _id: arr[i] })
      if (service.length) {
        ser_arr.push(service[0])
      }
    }
    emp_data.services = JSON.stringify(ser_arr)
    return { result: true, message: 'Email already Exists', data: emp_data }
  } else {
    /*    var output = '';
     if (output = await Employee.findOne({ email: param.email })) {
         
    if(typeof param.fcm_id !== 'undefined'){
            var fcm ={'fcm_id':param.fcm_id};  
            Object.assign(output,fcm);
            var output = await output.save();
            }
            if(output.img_status ==1 )
            {
             output.image = config.URL+'api/uploads/employee/'+output.image;
            }
                var mystr = output.services;
                   var arr = mystr.split(",");
                   let ser_arr = new Array();
                
                  for (var i = 0; i < arr.length ; i++){
                     var service =   await Service.find({_id:arr[i]});
                     if(service.length){
                     ser_arr.push(service[0]);     
                     }
                }
             output.services = JSON.stringify(ser_arr);
             
       
     
    
        return {result:true,message:'Email is exist',data:output};
    }*/
    return { result: false, message: 'Email not found' }
  }
}

async function create(params) {
  const userParam = JSON.parse(params.data)
  var data
  if (
    typeof userParam.username === 'undefined' ||
    typeof userParam.email === 'undefined' ||
    typeof userParam.image === 'undefined'
  ) {
    return {
      result: false,
      message:
        'username,surname,mobile,address,invoice,services,description,lat(o),lang(o),fcm_id(o)'
    }
  }
  if (userParam.type == 'normal') {
    userParam.image = 'no-image.jpg'
    userParam.img_status = 1
  }

  if (userParam.type == 'google') {
    userParam.password = ''
    userParam.email_verification = 1
    userParam.hash = ''
  }
  if (userParam.password) {
    userParam.hash = bcrypt.hashSync(userParam.password, 10)
  }
  /**look for user in database */
  await Employee.findOne({ email: userParam.email }).then(async user => {
    let emp_data
    if (user) {
      if (userParam.type == 'google') {
        emp_data = Object.assign(user, {
          username: userParam.username,
          image: userParam.image
        })
        if (emp_data.img_status == '1') {
          emp_data.image = config.URL + 'api/uploads/employee/' + emp_data.image
        }
        if (emp_data.status == '0') {
          return {
            result: false,
            message: 'Your account is deactivated by admin'
          }
        }
        data = emp_data
      } else {
        return { result: false, message: 'Email is already Exist' }
      }
    }
    else {
        const emp = new Employee(userParam)
        await emp.save().then(async output => {
          if (output) {

            const message = `Please <a href="${config.URL}employee/verification/${output.id}">Click Here </a> To verify your Email`
            /*var mail = await SendMailFunction.SendMail(userParam.email,"Verification Request By Harfa", message);*/
      
            if (userParam.email_verification === 0) SendMail(userParam.email, 'Email Address Verification', message)
      
            const notification = new Notification({
              type: 'New User',
              order_id: '',
              message: output.username + ' register as Customer',
              notification_for: 'Admin',
              notification_link: '/employee/' + output._id,
              user_id: output._id,
              employee_id: output._id,
              title: 'New Provider'
            })
      
            await notification.save().then(notification => {
              if (notification) console.log('notification saved')
            })
      
            var mystr = output.services
            var arr = mystr.split(',')
            let ser_arr = new Array()
      
            for (var i = 0; i < arr.length; i++) {
              var service = await Service.find({ _id: arr[i] })
              if (service.length) {
                ser_arr.push(service[0])
              }
            }
            output.services = JSON.stringify(ser_arr)
            if (output.img_status == '1') {
              output.image = config.URL + 'api/uploads/employee/' + output.image
            }
            data = output
          } else {
            return { result: false, message: 'Registeration failed try again later' }
          }
        })
    }
  });
  return data
}

async function ForgotPassword(param) {
  if (typeof param.email === 'undefined') {
    return { result: false, message: 'email is required' }
  }
  const user = await Employee.findOne({ email: param.email })

  if (!user) {
    return { result: false, message: 'Email does not exist' }
  }

  const message = {
    from: 'team.harfa@gmail.com', // Sender address
    to: param.email, // List of recipients
    subject: 'Password Recovery Mail', // Subject line
    text: `Hello ${user.username}, \r\n Your password is ${user.password}` // Plain text body
  }

  return new Promise(function(resolve, reject) {
    transport.sendMail(message, function(err, info) {
      if (err) {
        reject({ result: false, message: 'Something went wrong', error: err })
      } else {
        resolve({ result: true, message: 'email sent successfull' })
      }
    })
  })
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

  // copy userParam properties to user
  Object.assign(user, userParam)
  var output = await user.save()

  if (output) {
    return { result: true, message: 'Update successfull', data: output }
  } else {
    return { result: false, message: 'Something went wrong' }
  }
}

async function uploadImage(id, image) {
  if (typeof id === 'undefined' || image == false) {
    return { result: false, message: 'id and image is required' }
  }
  const user = await Employee.findById(id)

  if (!user) {
    return { result: false, message: 'id not found' }
  }

  Object.assign(user, { image: image, img_status: 1 })
  var output = ''
  if ((output = await user.save())) {
    output.image = config.URL + 'api/uploads/employee/' + output.image
    return { result: true, message: 'Image Update successfull', data: output }
  } else {
    return { result: false, message: 'Something went wrong' }
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
  update,
  CheckMobile,
  ForgotPassword,
  PushNotif,
  uploadImage,
  _delete
}
