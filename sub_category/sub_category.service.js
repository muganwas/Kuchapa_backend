const config = require('config.json');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('_helpers/db');
const Sub_Category = db.Sub_Category;
const Main_category = db.Main_Category;

module.exports = {
    getAll,
    getById,
    getByMId,
    create,
    update,
    _delete
};


async function getAll() {
    var data = '';
    if(data = await Sub_Category.find()){
    var tempdata = [];
    
      for(var i = 0 ; i <data.length; i++){
        var m_cat = '';
        m_cat = await Main_category.find({id:data[i].main_category});
        console.log(m_cat);
        if(m_cat.length){
            
          data[i].main_category = m_cat[0].main_category;
        }  
      }
    return  {result:true,message:'Service Found',data:data};
        }else{
    return  {result:false,message:'Service Not Found'};

        }
}

async function getById(id) {
    return await Sub_Category.findById(id);
}
async function getByMId(id) {
    var data = ''; 
     if(data = await Sub_Category.find({main_category:id})){
        return  {result:true,message:'Sub Category Found',data:data};
     }else{
        return  {result:false,message:'Sub Category Not Found'};
     }

}

async function create(userParam) {
    // validate

    const cat = new Sub_Category(userParam);


     var output = '';
    if(output = await cat.save()){
        return {result:true,message:'Add Category Successfull',data:output};
    }else{
        return {result:false,message:'Something went wrong'};
    }
}

async function update(id, userParam) {
    const user = await Sub_Category.findById(id);

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
   
   if(await Sub_Category.findById(id)){
      
         if(await Sub_Category.findByIdAndRemove(id)){
            return {result:true,message:"Category deleted Successfull"};
         }else{
            
            return {result:false,message:"Something went wrong"};
         }

   }else{
        return {result:false,message:"Category not Found"};
   }
}


