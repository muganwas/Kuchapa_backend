require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.CONNECTION_STRING, { useCreateIndex: true, useNewUrlParser: true }, function (err, db) {
   
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