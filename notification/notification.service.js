const config = require('../config');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('_helpers/db');
var mongoose = require('mongoose');
const Job = db.Job;
const JobRequest = db.JobRequest;
const Notification = db.Notification;
const Employee = db.Employee;
const gcm = require("node-gcm");


const shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];


module.exports = {
    AddReviewRequest,
    GetCustomerNotification,
    GetAdminNotification
};






async function AddReviewRequest(param){
     if(typeof param.user_id === 'undefined' ||
        typeof param.employee_id === 'undefined' ||
        typeof param.order_id === 'undefined' ||
        typeof param.notification.title === 'undefined' ||
        typeof param.notification.body === 'undefined'){
           return  {result:false,message:'user_id,employee_id,order_id,notification.title,notification.body and notification(o) is required'};
        }
 
            
      var save = {};
      save['user_id'] =param.user_id;
      save['employee_id'] =param.employee_id;
      save['order_id'] =param.order_id;
      save['title'] =param.notification.title;
      save['message'] =param.notification.body;
      save['type'] ="ReviewRequest";
      save['notification_by'] ="Employee";
      
       var order_id =mongoose.Types.ObjectId(param.order_id);
    //   console.log(order_id);
      var customer_review = await JobRequest.findById(order_id);
      if(customer_review){
          var update_customer_review = {};
          update_customer_review['customer_review'] = 'Requested';
        Object.assign(customer_review, update_customer_review);
        
        
        var customer_review_output = await customer_review.save();
        //   console.log(customer_review_output);
      }else{
          return {result:false,message:'Service not found'};
      }
          
   const notif_save = new Notification(save);
   
   var output ={};
   if(output = await notif_save.save()){
       var notif = {};
       if(param.notification !== 'undefined'){
            notif = await PushNotif(param.notification);      
       
       }
      
     return {result:true,'message':'Add request successfull','notification':notif,data:output}; 
   }else{
    
     return {result:false,message:'Something went wrong while request for review'};   
   }
   
}



async function GetCustomerNotification(id){
    
    if(typeof id === 'undefined'){
      return {result:false,message:'id is required'};   
    }
    
        
    var notif = await Notification.aggregate([
                {$match: { user_id: {$gte:id}}  }, 
                     {
                     "$project": {
                      "employee_id": {
                        "$toObjectId": "$employee_id"
                      }, 
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
                            foreignField: "_id",
                            as: "employee_details"
                        }
                   }
               ]);

    var output = new Array();
    if(notif.length > 0 ){
      
      
        for(var i = 0 ; i < notif.length;i++){
            
            if(notif[i].notification_for == 'Admin'){
                continue;
            }
            
            if(notif[i].notification_by == 'Employee'){
               var d = new Date(notif[i].createdDate);
                notif[i].createdDate = ("0" + d.getDate()).slice(-2)+'-'+shortMonths[d.getMonth()]+'-'+d.getFullYear();  
                
              notif[i].employee_details = notif[i].employee_details[0];
              notif[i].employee_details.image = config.URL+'api/uploads/employee/'+notif[i].employee_details.image;
            output.push(notif[i]);
                
            }  
        }
        // console.log(output);
      return {result:true,message:'Data found',data:output }; 
    }else{
      return {result:false,message:'Data not found'};
    }
}




async function GetAdminNotification(){
    return await Notification.find({notification_for : "Admin", status : "0"});
}





async function PushNotif(param){
  /*  console.log(param);*/
  if(typeof param.fcm_id === 'undefined' || typeof param.title === 'undefined' || typeof param.body == 'undefined'){
     return {result:false,message:'fcm_id,title,data(o) and body is required'}
 }
 
 
 
      let sender = new gcm.Sender(config.SERVER_KEY);
    var newdata ={};
    
    if(param.data !== 'undefined'){
        newdata = param.data;
    }
    let message = new gcm.Message({
                        notification: {
                            title: param.title,
                            subtitle: "ssdid",
                            icon: "your_icon_name",
                            body: param.body,
                        },
                        data: newdata,
                    });

let output = '';
     
return new Promise(function (resolve , reject) {
    sender.sendNoRetry(message, [param.fcm_id], (err, response) => {
            if (err){
              reject({result:true,message:err});             
            }
            else{
              resolve({result:true,message:response});
            }
        });
        });
        

}



