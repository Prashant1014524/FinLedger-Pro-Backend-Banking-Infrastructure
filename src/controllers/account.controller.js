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

async function getUserAccountsController(req,res){
    const accounts=await accountModel.find({user:req.user._id});
    res.status(200).json({
        accounts
    })

}

async function getAccountBalanceController(req,res){
    const {accountId}=req.params;

const account=await accountModel.findOne({
    _id:accountId,
    user:req.user._id
})
if(!account){
    return res.status(404).json({
        message:"Account not found"
    })
}

const balance=await account.getBalance();
res.status(200).json({
    accountId:account._id,
    balance:balance
})
}


module.exports={
    createAccountController,
    getUserAccountsController,
    getAccountBalanceController
}