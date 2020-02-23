// const config = require('config.json');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('_helpers/db');


const Main_Category = db.Main_Category;

module.exports = {
    getAll,
    getById,
    create,
    update,
    respond,
    _delete
};

async function respond(socket){

global.socket = await socket;
    var data = await Main_Category.find()
      if(data){
        // socket.emit("ADDED_DATA",data);
      }
}

async function getAll() {
    var data = '';
    if(data = await Main_Category.find()){
//  global.socket.emit("ADDED_DATA",data);
    return  {result:true,message:'Service Found',data:data};
        }else{
    return  {result:false,message:'Service Not Found'};

        }
}

async function getById(id) {
    return await Main_Category.findById(id);
}

async function create(userParam) {
    // validate
console.log(userParam);

    const cat = new Main_Category(userParam);


     var output = '';
    if(output = await cat.save()){
       
        return {result:true,message:'Add Category Successfull',data:output};
    }else{
        return {result:false,message:'Something went wrong'};
    }
}

async function update(id, userParam) {
    const user = await Main_Category.findById(id);

    // validate
       if(!user){
        return {result:false,message:"user not found"};
       }

   
    // copy userParam properties to user
    Object.assign(user, userParam);
  var data ='';
    if(data = await user.save()){
        return {result:true,message:"update Successfull",data:data};

    }else{
        return {result:false,message:"Something went wrong"};
        
    }

}

async function _delete(id) {
   
console.log(id);
   if(await Main_Category.findById(id)){
      
         if(await Main_Category.findByIdAndRemove(id)){
            return {result:true,message:"Category deleted Successfull"};
         }else{
            
            return {result:false,message:"Something went wrong"};
         }

   }else{
        return {result:false,message:"Category not Found"};
   }
}


