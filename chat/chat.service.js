const config = require('config.json');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('_helpers/db');
const Job = db.Job;
const Employee = db.Employee;
const Chat = db.Chat;





module.exports = {
    create,
    respond
};

async function respond(socket){

global.socket = await socket;
    // var data = await Job.find()
    //   if(data){
    //     socket.emit("JOB_ADD","asd");
    //   }
}



async function create(userParam) {
     if(typeof userParam.sender_id === 'undefined' || typeof userParam.receiver_id === 'undefined' || typeof userParam.message === 'undefined'){
        return {result:false,message:'sender_id, receiver_id and message is required'}
    }
    

    const chat = new Chat(userParam);
        

     var output = await chat.save();
    if(output){
       global.socket.emit(`${userParam.sender_id}-${userParam.receiver_id}`,output);
        return {result:true,message:'Add Successfull',data:output};
    }else{
        return {result:false,message:'Something went wrong'};
    }
}


   


