const accountModel=require("../models/account.model");
// now we have to chekc that the request is coming form a logged in user or not so for this we will check the token in the cookie attached and we will use the middleware for this

async function createAccountController(req,res){
    const user=req.user;
    const account=await accountModel.create({
        user:user._id
    });

    // console.log("Account created:", account);
    // console.log("Database:", accountModel.db.name);
    // console.log("Collection:", accountModel.collection.name);
    res.status(201).json({
        account
    })
}
module.exports={
    createAccountController
}