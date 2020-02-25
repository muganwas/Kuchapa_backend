const config = require('config.json');
const mongoose = require('mongoose');
const MONGO_USERNAME = 'harfa';
const MONGO_PASSWORD = 'harfa';
const MONGO_HOSTNAME = '127.0.0.1';
const MONGO_PORT = '27017';
const MONGO_DB = 'harfa';

/*const url = "mongodb://admin:MFbFI68zgWoHb557@SG-harfa-29966.servers.mongodirector.com:27017/local";
 
mongoose.connect(url, { useCreateIndex: false, useNewUrlParser: true });
mongoose.Promise = global.Promise;*/
mongoose.connect("mongodb+srv://muganwas:developer_muganwas_123@harfa-y38gb.azure.mongodb.net/test?retryWrites=true&w=majority",{ useCreateIndex: true, useNewUrlParser: true }, function (err, db) {
   
     if(err) throw err;

     //Write databse Insert/Update/Query code here..
                
});
// console.log(url);
module.exports = {
    User: require('../users/user.model'),
    Contact: require('../contact/contact.model'),
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