const config = require('config.json');
const db = require('_helpers/db');
const Contact = db.Contact;
const SendMailFunction = require("../_helpers/SendMail");

//   let transport = nodemailer.createTransport({
//         host: config.email_host,
//         port: config.email_port,
//         service: "gmail",
//         secure:false,
//         auth: {
//           user: config.email_user,
//           pass: config.email_passwrord
//         }
//     });transport

module.exports = {

    create,
   _delete
};



async function create(userParam) {
       const user = new Contact(userParam);
       
     var data = '';
     if(data = await user.save()){
            var message  = userParam.message;
            //var mail = await SendMailFunction.SendMail(userParam.email,"Verification Request By Harfa", message);
            return {result:true , message:'Mail Sent Successfully'};
     }else{
        return {result:false , message:'Something went wrong'};
    }  
}




async function _delete(id) {
    await User.findByIdAndRemove(id);
}