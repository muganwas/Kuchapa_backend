const mongoose = require('mongoose');
/*const config = require('config.json');
const MONGO_USERNAME = 'harfa';
const MONGO_PASSWORD = 'harfa';
const MONGO_HOSTNAME = '127.0.0.1';
const MONGO_PORT = '27017';
const MONGO_DB = 'harfa';*/
const url = 'mongodb+srv://harfa:harfa123@cluster0-srtxb.mongodb.net/test?retryWrites=true&w=majority';

mongoose.connect(url, { useCreateIndex: true, useNewUrlParser: true });
mongoose.Promise = global.Promise;
// console.log(url);
module.exports = {
    User: require('../users/user.model'),
    Admin: require('../admin/admin.model'),
    Employee: require('../employee/employee.model'),
    Services: require('../services/service.model'),
    Main_Category: require('../main_category/main_category.model'),
    Sub_Category: require('../sub_category/sub_category.model'),
    Job: require('../job/job.model'),
    Chat: require('../chat/chat.model'),
    JobRequest: require('../jobrequest/jobrequest.model'),
    Notification: require('../notification/notification.model')
};