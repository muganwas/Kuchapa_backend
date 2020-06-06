const config = require('../config');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('_helpers/db');
const User = db.Services;
const Main_Category = db.Main_Category;
const Sub_Category = db.Sub_Category;

module.exports = {
    authenticate,
    getAll,
    getAllService,
    getById,
    create,
    update,
    _delete
};

async function authenticate({ username, password }) {
    const user = await User.findOne({ username });
    if (user && bcrypt.compareSync(password, user.hash)) {
        const { hash, ...userWithoutHash } = user.toObject();
        const token = jwt.sign({ sub: user.id }, config.secret);
        return {
            ...userWithoutHash,
            token
        };
    }
}

async function getAll() {
    var data = '';
    if(data = await User.find().select('-hash')){
   var tempdata = [];
    for (var i = 0 ; i < data.length ; i++){
       
        var main_c = '';
        var sub_c = '';
        main_c = await Main_Category.find({_id:data[i].main_category});
        sub_c = await Sub_Category.find({_id:data[i].sub_category});
        
         if(main_c.length > 0 && sub_c.length > 0){

           data[i].main_category =main_c[0].main_category;
           data[i].sub_category =sub_c[0].sub_category;
           data[i].image = config.URL+'api/uploads/services/'+data[i].image;
           tempdata.push(data[i]);
        }
        
  
    }
    return  {result:true,message:'Service Found',data:tempdata};
        }else{
    return  {result:false,message:'Service Not Found'};

        }
}

async function getAllService() {
    var data = '';
    if(data = await User.find().select('-hash')){
    for (var i = 0 ; i < data.length ; i++){
          data[i].image = config.URL+'api/uploads/services/'+data[i].image;   
    }
    return  {result:true,message:'Service Found',data:data};
        }else{
    return  {result:false,message:'Service Not Found'};

        }
}

async function getById(id) {
    
    return  await User.findById(id);
}

async function create(userParam) {
    // validate


    const user = new User(userParam);

 
     var output = '';
    if(output = await user.save()){
        return {result:true,message:'Add Service Successfull',data:output};
    }else{
        return {result:false,message:'Something went wrong'};
    }
}

async function update(id, userParam) {
    const user = await User.findById(id);

     if(!user){
        return {result:false,message:'Service not found'};
     }  

    // copy userParam properties to user
    Object.assign(user, userParam);
   var output ='';

     if(output = await user.save()){
        return {result:true,message:'Update Service Successfull',data:output};
    }else{
        return {result:false,message:'Something went wrong'};
    }
}

async function _delete(id) {
      if(await User.findById(id)){
      
         if(await User.findByIdAndRemove(id)){
            return {result:true,message:"Service deleted Successfull"};
         }else{
            
            return {result:false,message:"Something went wrong"};
         }

      }else{
        return {result:false,message:"Service not Found"};
      }

}