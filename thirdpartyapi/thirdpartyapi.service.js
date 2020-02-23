require('dotenv').config();
const config = process.env;
const request = require('request');
const SendMailFunction = require("../_helpers/SendMail");


module.exports = {
    SendSMS,
    UploadFIle,
    SendMail
};




async function SendSMS(param){
    console.log(param);
    if(typeof param.to ==='undefined' || typeof param.otp === 'undefined'){
        return {result:false,message:'to and otp is required'};
    } 
    
    
    const request = require('request')
var formData ={};

    formData['to'] = param.to;
    formData['body'] ="Your otp is "+param.otp+" .";
    
    
    return new Promise(function (resolve , reject) {
           request({
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': 'Basic bGFhYmhhYXRlY2hzb2Z0OkxhYWJoYWFAMjAxOQ=='
                },
                uri: 'https://api.bulksms.com/v1/messages?auto-unicode=true&longMessageMaxParts=30',
                body: JSON.stringify(formData),
                method: 'POST'
              }, function (error, res, body) {
              if (error) {
                reject({result:false,message:'message not sent error found',error:error});
              }
            //   if(body[0].status.type != 'FAILED' || body[0].status.type != 'UNKNOWN' ){
               resolve({result:true,message:"message sent succcessfull",response:body});
            //   }else{
            //      reject({result:false,message:"message not sent",response:body});
            //   }
              
              
            });
    });
        
}




async function SendMail(param){
    
        
        return  await  SendMailFunction.SendMail(param);
    

    
        // Generate test SMTP service account from ethereal.email
        // Only needed if you don't have a real mail account for testing
          let testAccount = await nodemailer.createTestAccount();
        
          // create reusable transporter object using the default SMTP transport
          let transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 587,
            secure: false, // true for 465, false for other ports
            auth: {
              user: "team.laabhaa@gmail.com", // generated ethereal user
              pass: "laabhaa2017*@" // generated ethereal password
            }
          });
        
          // send mail with defined transport object
          let info = await transporter.sendMail({
            from: '"Laabhaa" <team.laabhaa@gmail.com>', // sender address
            to: "pankaj.laabhaa@gmail.com", // list of receivers
            subject: "Hello ✔", // Subject line
            text: "Hello world?", // plain text body
            html: "<b>Hello world?</b>" // html body
          });
        
          console.log("Message sent: %s", info.messageId);
          // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>
        
          // Preview only available when sending through an Ethereal account
          console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
}



async function UploadFIle(file){
    if(typeof file !== "undefined"){
      var  image = config.URL+'api/uploads/chat/'+file;    
       
      return {result : true , file: image, message : "File upload"};
    }else{
        return {result : false , message : "File is required"};
    }
}




