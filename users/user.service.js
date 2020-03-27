const config = require('../config')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const db = require('_helpers/db')
const User = db.User
const Notification = db.Notification
const SendMail = require('../_helpers/SendMail')

/*  let transport = nodemailer.createTransport({
        host: config.email_host,
        port: config.email_port,
        service: "gmail",
        secure:false,
        auth: {
          user: config.email_user,
          pass: config.email_passwrord
        }
    });transport*/

module.exports = {
  authenticate,
  Verification,
  getAll,
  get_search,
  getById,
  create,
  update,
  CheckMobile,
  ForgotPassword,
  uploadImage,
  _delete
}

async function authenticate(param) {
  const user = await User.findOne({ email: param.email })

  if (!user) {
    return { result: false, message: 'Email does not exist' }
  }

  if (user.status == '0') {
    return { result: false, message: 'Your account is deactivated by admin' }
  }
  /* console.log(user);*/

  /*  if(user.email_verification == '0'){
         var message  = `Please <a href="${config.URL}#/customer_verification/${user.id}">Click Here </a> To verify your Email`;
         var mail = await SendMailFunction.SendMail(user.email,"Verification Request By Harfa", message);
             return {result:false,message:"Your email is not verified.Verify link sent"};
    }*/

  if (user && bcrypt.compareSync(param.password, user.hash)) {
    const { hash, userWithoutHash } = user.toObject()
    const token = jwt.sign({ sub: user.id }, config.secret)
    if (typeof param.fcm_id !== 'undefined') {
      var fcm = { fcm_id: param.fcm_id }

      Object.assign(user, fcm)
      user1 = await user.save()
    }
    if (user.img_status == '1') {
      user.image = config.URL + 'api/uploads/users/' + user.image
    }
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
  var data = await User.find().select('-hash')
  if (data.length) {
    return { result: true, message: 'User Found', data: data }
  } else {
    return { result: false, message: 'User Not Found' }
  }
}

async function get_search(param) {
  var data = await User.find({
    $or: [
      { username: { $regex: param.search.value, $options: 'i' } },
      { mobile: { $regex: param.search.value, $options: 'i' } }
    ]
  }).select('-hash')
  var data_all = await User.find().select('-hash')
  var recordsTotal = data_all.length
  var recordsFiltered = data.length
  if (data) {
    return {
      result: true,
      message: 'User Found',
      data: data,
      recordsTotal: recordsTotal,
      recordsFiltered: recordsFiltered
    }
  } else {
    return { result: false, message: 'User Not Found' }
  }
}

async function getById(id, param) {
  var output = ''
  if ((output = await User.findById(id).select('-hash'))) {
    if (typeof param.fcm_id !== 'undefined') {
      var fcm = { fcm_id: param.fcm_id }
      Object.assign(output, fcm)
      user1 = await output.save()
    }
    if (output.img_status == 1) {
      output.image = config.URL + 'api/uploads/users/' + output.image
    }
    return { result: true, message: 'Customer Found', data: output }
  } else {
    return { result: false, message: 'Customer Not Found' }
  }
}

async function Verification(id) {
  const output = await User.findById(id)
  if (output) {
    var userParam = {}
    userParam['email_verification'] = 1
    Object.assign(output, userParam)
    var v = await output.save()

    return { result: true, message: 'Customer verified successfully' }
  } else {
    return { result: false, message: 'Customer Not Found' }
  }
}

async function CheckMobile(param) {
  if (typeof param.mobile === 'undefined') {
    return { result: false, message: 'mobile is required' }
  }
  var output = ''
  if ((output = await User.findOne({ mobile: param.mobile }))) {
    if (param.fcm_id !== 'undefined') {
      var fcm = { fcm_id: param.fcm_id }
      Object.assign(output, fcm)
      var output = await output.save()
    }

    return {
      result: true,
      message: 'Mobile -> "' + param.mobile + '" is exist',
      data: output
    }
  } else {
    return { result: false, message: 'mobile not found' }
  }
}

async function create(userParam, image) {
  if (typeof userParam.username === 'undefined') {
    return {
      result: false,
      message:
        'username,email,password,dob, acc_type(Individual,Company) and image  is required'
    }
  }
  if (userParam.type == 'normal') {
    if (image != '') {
      userParam.image = image
      userParam.img_status = 1
      userParam.email_verification = 1
    }
  } else {
    userParam.email_verification = 1
  }

  if (userParam.password) {
    userParam.hash = bcrypt.hashSync(userParam.password, 10)
  }
  var output = ''

  const user1 = await User.findOne({ email: userParam.email })

  if (user1) {
    if (userParam.type == 'google') {
      var output = Object.assign(user1, {
        username: userParam,
        image: userParam.image,
        img_status: userParam.img_status
      })
      if (output.img_status == '1') {
        output.image = config.URL + 'api/uploads/users/' + output.image
      }
      if (output.status == '0') {
        return {
          result: false,
          message: 'Your account is deactivated by admin'
        }
      }
      return { result: true, message: 'Email is already Exists', data: output }
    } else {
      return { result: false, message: 'Email is already Exist' }
    }
  }

  const user = new User(userParam)

  var data = ''
  if ((data = await user.save())) {
    console.log(data)
    if (data.img_status == '1') {
      data.image = config.URL + 'api/uploads/users/' + data.image
    }

    const message = `Please <a href="${config.URL}#/customer_verification/${data.id}">Click Here </a> To verify your Email`
    /* var mail = await SendMailFunction.SendMail(userParam.email,"Verification Request By Harfa", message);*/

    SendMail(userParam.email, 'Email Address Verification', message)

    const notification = new Notification({
      type: 'New User',
      order_id: '',
      message: userParam.username + ' register as Customer',
      notification_for: 'Admin',
      notification_link: '/user/' + data._id,
      user_id: data._id,
      employee_id: data._id,
      title: 'New Customer'
    })

    await notification.save()

    return { result: true, message: 'Register Successfull', data: data }
  } else {
    return { result: false, message: 'Something went wrong' }
  }
}

async function update(id, userParam) {
  const user = await User.findById(id)

  // validate

  if (!user) return { result: false, message: 'Something went wrong' }

  if (
    user.mobile !== userParam.mobile &&
    (await User.findOne({ mobile: userParam.mobile }))
  ) {
    return {
      result: false,
      message: 'Username "' + userParam.mobile + '" is already taken'
    }
  }

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
  const user = await User.findById(id)

  if (!user) {
    return { result: false, message: 'id not found' }
  }

  Object.assign(user, { image: image, img_status: 1 })
  var output = ''
  if ((output = await user.save())) {
    data.image = config.URL + 'api/uploads/users/' + output.image

    return { result: true, message: 'Image Update successfull', data: output }
  } else {
    return { result: false, message: 'Something went wrong' }
  }
}

async function ForgotPassword(param) {
  if (typeof param.email === 'undefined') {
    return { result: false, message: 'email is required' }
  }
  const user = await User.findOne({ email: param.email })

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
        resolve({ result: true, message: 'email sent' })
      }
    })
  })
}

async function _delete(id) {
  await User.findByIdAndRemove(id)
}
