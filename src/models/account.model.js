const mongoose=require("mongoose")

const accountSchema=new mongoose.Schema({
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"user",
        required:[true,"Account must be associated with a user"],
        index:true      //is is used for the fast search in the database mongo it uses B+tree

    },
    status:{
        enum:{
            values:["ACTIVE","FROZEN","CLOSED"],
            message:"Status can be either ACTIVE,FROZEN or CLOSED"

        }
    },
    currency:{
        type:String,
        required:[true,"Currency is requiredfor creating an acccount"],
        default:"INR"
    },
    {
        timestamps:true
    
})
// compound index
accountSchema.index({user:1,status:1})


const accountModel=mongoose.model("account",accountScheama)
module.exports=accountModel