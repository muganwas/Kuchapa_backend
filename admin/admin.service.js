const config = require('config.json');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('_helpers/db');
const Admin = db.Admin;
const User = db.User;
const Employee = db.Employee;

module.exports = {
    authenticate,
    getAll,
    create,
     getById,
     update,
     dashboard,
    ChangePassword
};

async function authenticate({ email, password }) {
    const admin = await Admin.findOne({ email });
    
    // if (admin && bcrypt.compareSync(password, admin.hash)) {
     if(!admin){
        return {result:false,message:"email not found"};
     }   

    if (admin &&  bcrypt.compareSync(password, admin.hash) ) {
        const { hash, userWithoutHash } = admin.toObject();
        const token = jwt.sign({ sub: admin.id }, config.secret);
         
        return {result:true,message:'Login successfull',token:token,id:admin.id};
    }else{

        return {result:false,message:"Password not matched"};
    }
}

async function ChangePassword(id,param) {
    const admin = await Admin.findById(id);

     // if (admin && bcrypt.compareSync(password, admin.hash)) {
     if(!admin){
        return {result:false,message:"admin not found"};
     }   
    
    if (admin && bcrypt.compareSync(param.cpassword, admin.hash)) {
       admin.hash = bcrypt.hashSync(param.password, 10);
      Object.assign(admin, {password:param.password,hash:admin.hash});
        if(await admin.save()){
          return {result:true,message:'Update password successfull'};
        }else{
        return {result:false,message:"Something went wrong"};
            
        }
    }else{
        return {result:false,message:"current Password not matched"};
    }
}


async function getById(id) {
     var output = '';
    if(output =  await Admin.findById(id).select('-hash')){

      return  output;
    }else{
      return  {result:false,message:'admin Not Found'};
    }

}

async function dashboard() {
    let customer = 0;
    let provider = 0;
    let pie =[33 , 33 , 33];
    
     customer = await User.countDocuments();
     var p  = await Employee.find({ paying : "Yes"}).countDocuments();
     var np  = await Employee.find({ paying : "No"}).countDocuments();
  
     provider = p + np;
     var total = customer + provider;
      pie[0] = Math.round(customer / total *100); 
      pie[1] = Math.round(p / total *100); 
      pie[2] = Math.round(np / total *100); 
  
    return {result:true,customer:customer, provider:provider, pie : pie};
}



async function getAll() {
    // console.log(Admin.find());
return await Admin.find();
}


async function update(id, userParam) {
    const user = await Admin.findById(id);
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


async function create(userParam) {
    // validate
    if (await Admin.findOne({ email: userParam.email })) {
        throw 'Email "' + userParam.username + '" is already taken';
    }

    var admin = new Admin(userParam);

    // hash password
    if (userParam.password) {
        admin.hash = bcrypt.hashSync(userParam.password, 10);
        
    }
    var c = await admin.save();
    console.log(admin);
    // save user
    console.log(c);
}