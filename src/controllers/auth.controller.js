const userModel=require("../models/user.model")
const jwt=require("jsonwebtoken")

async function userRegisterController(req,res){
    const{email,password,name}=req.body
    const isExits=await userModel.findOne({
email:email

    })
    if(isExits){
        return res.status(422).json( {
            message:"User already exits with email.",
            status:"failed"
        })
    }
    const user=await userModel.create({
        email,password,name
    })
    // now user is created we have to give jwt token for remain login
}

module.exports={
    userRegisterConroller
}        