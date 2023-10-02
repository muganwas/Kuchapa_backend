const config = require('../config');
const bcrypt = require('bcryptjs');
const db = require('_helpers/db');
const admin = require('firebase-admin');
const User = db.User;
const Employee = db.Employee;
const { EmployeeRatingsDataRequest } = require('../jobrequest/jobrequest.service');
const Notification = db.Notification
const SendMail = require('../_helpers/SendMail');
const { imageExists, fetchCountryCodes } = require('../misc/helperFunctions');

async function authenticate(param) {
  var avgRating;
  var user = await User.findOne({ email: param.email })

  if (!user) {
    return { result: false, message: 'Email does not exist' }
  }

  if (user.status == '0') {
    return { result: false, message: 'Your account is deactivated by admin' }
  }

  if (user.email_verification == '0') {
    var message = `Please <a href="${config.URL}users/verification/${user.id}">Click Here </a> to verify your Email`
    SendMail(user.email, 'Verification Request By Kuchapa', message)
    return {
      result: false,
      message: 'Your email is not verified. We sent you a link'
    }
  }

  if ((user && bcrypt.compareSync(param.password, user.hash)) || param.loginType === 'Firebase') {
    if (typeof param.fcm_id !== 'undefined') {
      if (user._id)
        await EmployeeRatingsDataRequest(user._id).then(res => {
          avgRating = res.rating;
        });
      var fcm = { fcm_id: param.fcm_id, avgRating }

      Object.assign(user, fcm);
      await user.save();
    }
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
  try {
    const { page = 1, limit = 10 } = query;
    const numLimit = Number(limit);
    const numSkip = (Number(page) - 1) * Number(limit);
    var data = await User.find().select('-hash')
      // We multiply the "limit" variables by one just to make sure we pass a number and not a string
      .limit(numLimit)
      .skip(numSkip)
      // We sort the data by the date of their creation in descending order (user 1 instead of -1 to get ascending order)
      .sort({ createdDate: 1 });
    data = data.toJSON();
    var count = 0;
    var totalPages = 1;
    count = await User.countDocuments();
    totalPages = Math.ceil(count / limit);
    const country = await fetchCountryCodes();
    if (data.length) {
      data.map(async (user, i) => {
        data[i]['image_available'] = await imageExists(data[i].image);
        data[i] = Object.assign(data[i], country.data);
      })
      return { result: true, message: 'Users Found', data: data, metadata: { totalPages, page, limit } };
    } else {
      return { result: false, message: 'Users Not Found' };
    }
  } catch (e) {
    return { result: false, message: e.message };
  }
}

async function getById(id, param) {
  var output = '';
  var avgRating = 0;
  if ((output = await User.findById(id).select('-hash'))) {
    if (typeof param.fcm_id !== 'undefined') {
      if (output._id)
        await EmployeeRatingsDataRequest(output._id).then(res => {
          avgRating = res.rating;
        });
      var fcm = { fcm_id: param.fcm_id, avgRating }
      Object.assign(output, fcm);
      await output.save()
    }
    var data = output.toJSON();
    data['image_available'] = await imageExists(output.image);
    const country = await fetchCountryCodes();
    data = Object.assign(data, country.data);
    return { result: true, message: 'Customer Found', data }
  } else {
    return { result: false, message: 'Customer Not Found' }
  }
}

const findUserById = async id => {
  var output = await User.findById(id);
  output = output.toJSON();
  if (output) {
    output['image_available'] = await imageExists(output.image);
    const country = await fetchCountryCodes();
    output = Object.assign(output, country.data);
    return { result: true, data: output, message: 'Customer found successfully' }
  } else {
    return { result: false, message: 'Customer Not Found' }
  }
}

async function Verification(id) {
  var output = await User.findById(id)
  if (output) {
    var userParam = {}
    userParam['email_verification'] = 1
    Object.assign(output, userParam)
    await output.save()
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
      message: 'Mobile number ' + param.mobile + ' already exists',
      data: output
    }
  } else {
    return { result: false, message: 'mobile not found' }
  }
}

async function create(params) {
  const userParam = params.data;
  const mobile = userParam.mobile
  const email = userParam.email
  const image = userParam.image
  const username = userParam.username
  let data;
  if (
    (typeof mobile === 'undefined' || mobile && mobile.length === 0) &&
    ((typeof username === 'undefined' || username && username.length === 0) ||
      (typeof email === 'undefined' || email && email.length === 0))
  ) {
    return {
      result: false,
      message:
        'username,email,password,dob, acc_type(Individual,Company) and image  is required'
    }
  }
  if (userParam.type === 'normal') {
    if (image !== undefined && image !== '') {
      userParam.img_status = 1
    }
    userParam.email_verification = 0
  } else {
    userParam.email_verification = 1
  }

  if (userParam.password) {
    userParam.hash = bcrypt.hashSync(userParam.password, 10)
  }

  if ((typeof mobile !== 'undefined' && mobile.length > 0) && (typeof email === 'undefined' || email && email.length === 0)) {
    /** mobile based user search */
    try {
      const user = await User.findOne({ mobile });
      if (user) {
        if (userParam.type === 'google' || userParam.type === 'facebook' || userParam.type === 'phone') {
          const output = Object.assign(user.toJSON(), {
            username,
            image: userParam.image,
            img_status: userParam.img_status
          });
          if (output.status === '0') {
            return {
              result: false,
              message: 'Your account is deactivated by admin'
            }
          }
          output['image_available'] = await imageExists(output.image);
          const country = await fetchCountryCodes();
          output = Object.assign(output, country.data);
          return {
            result: true, message: 'You signed in successfully.', data: output
          };
        } else {
          return { result: false, message: 'Email already Exist' };
        }
      } else {
        userParam.password && delete userParam.password;
        const user = new User(userParam);
        try {
          const res = await user
            .save();
          data = res.toJSON();
          if (data) {
            const message = `Please <a href="${config.URL}users/verification/${data.id}">Click Here </a> To verify your Email`
            /**send verification email if not verified */
            if (userParam.email_verification === 0 || userParam.email_verification === undefined) SendMail(userParam.email, 'Email Address Verification', message)
            const notification = new Notification({
              type: 'New User',
              order_id: '',
              message: userParam.username + ' registered as a Customer',
              notification_for: 'Admin',
              notification_by: 'Customer',
              notification_link: '/user/' + data._id,
              user_id: data._id,
              title: 'New Customer'
            });
            const notificationRes = await notification.save();
            data['image_available'] = await imageExists(data.image);
            const country = await fetchCountryCodes();
            data = Object.assign(data, country.data);
            if (notificationRes) {
              return {
                result: true,
                message: 'You signed up successfully.',
                data
              };
            }
            return {
              result: true,
              message: 'You signed up successfully with some errors.',
              data
            };
          } else {
            return { result: false, message: 'Something went wrong' }
          }
        } catch (e) {
          return {
            result: false,
            message: 'Something went wrong',
            error: e.message
          }
        };
      }
    } catch (error) {
      return { result: false, message: error.message }
    };
  }
  else {
    /** email based user search */
    try {
      const existingUser = await User.findOne({ email: userParam.email });
      if (existingUser) {
        if (userParam.type === 'google' || userParam.type === 'facebook') {
          var output = Object.assign(existingUser.toJSON(), {
            username: userParam.username,
            image: userParam.image,
            img_status: userParam.img_status
          })
          if (output.status == '0') {
            return {
              result: false,
              message: 'Your account is deactivated by admin'
            }
          }
          output['image_available'] = await imageExists(output.image);
          const country = await fetchCountryCodes();
          output = Object.assign(output, country.data);
          return {
            result: true, message: 'You signed in successfully.', data: output
          };
        } else {
          return { result: false, message: 'Email already Exist' }
        }
      } else {
        const user = new User(userParam);
        try {
          const res = await user.save();
          data = res.toJSON();
          if (data) {
            const message = `Please <a href="${config.URL}users/verification/${data.id}">Click Here </a> To verify your Email`
            /**send verification email if not verified */
            if (userParam.email_verification === 0)
              SendMail(userParam.email, 'Email Address Verification', message)
            const notification = new Notification({
              type: 'New User',
              order_id: '',
              message: userParam.username + ' registered as a Customer',
              notification_for: 'Admin',
              notification_by: 'Customer',
              notification_link: '/user/' + data._id,
              user_id: data._id,
              title: 'New Customer'
            })
            const notificationRes = await notification.save();
            data['image_available'] = await imageExists(data.image);
            const country = await fetchCountryCodes();
            data = Object.assign(data, country.data);
            if (notificationRes) {
              return {
                result: true,
                message: 'You signed up successfully.',
                data
              };
            }
            return {
              result: true,
              message: 'You singed up successfully with some errors.',
              data
            };
          } else {
            return { result: false, message: 'Something went wrong' }
          }
        } catch (e) {
          return {
            result: false,
            message: 'Something went wrong',
            error: e.message
          }
        };
      }
    } catch (error) {
      return { result: false, message: error.message }
    };
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

  Object.assign(user, userParam);
  var output = await user.save();
  output = output.toJSON();
  output['image_available'] = await imageExists(output.image);
  const country = await fetchCountryCodes();
  output = Object.assign(output, country.data);
  if (output) {
    return { result: true, message: 'Update successfull', data: output }
  } else {
    return { result: false, message: 'Something went wrong' }
  }
}

async function uploadImage(body) {
  const { userId, uri } = body;
  if (!userId || !uri) {
    return { result: false, message: 'id and image is required' }
  }
  const user = await User.findById(userId)

  if (!user) {
    return { result: false, message: 'id not found' }
  }
  try {
    Object.assign(user, { image: uri, img_status: 1 });
    var output = await user.save();
    output = output.toJSON();
    output['image_available'] = await imageExists(output.image);
    const country = await fetchCountryCodes();
    output = Object.assign(output, country.data);
    return { result: true, message: 'Image Update successfull', data: output }
  } catch (e) {
    return { result: false, message: e.message }
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
  await SendMail(
    param.email,
    'Password Recovery Mail',
    `Hello ${user.username}, \r\n Your password is ${user.password}`
  )
}

async function fetchDBStatuses(body) {
  try {
    const { userIds, userType } = body;
    if (!userIds || !Array.isArray(userIds)) return { result: false, message: 'userIds should be an array of ids' };
    const liveStatuses = {};
    const usersRef = userType === 'Client' ? Employee.find().where('_id').in(userIds) : User.find().where('_id').in(userIds);
    const users = await usersRef.exec();
    for (let i = 0; i < users.length; i++) {
      const id = users[i]._id;
      const status = users[i].online;
      liveStatuses[id] = status;
    }
    return { result: true, message: 'Statuses fetched successfully.', data: liveStatuses };
  } catch (e) {
    return { result: false, message: e.message };
  }
}

async function _delete(id) {
  await User.findByIdAndRemove(id)
}

module.exports = {
  authenticate,
  Verification,
  fetchDBStatuses,
  getAll,
  getById,
  create,
  update,
  findUserById,
  CheckMobile,
  ForgotPassword,
  uploadImage,
  _delete
}
