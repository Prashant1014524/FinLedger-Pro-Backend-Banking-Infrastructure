const mongoose = require("mongoose");
const bcrypt=require("bcryptjs")


const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required for creating a user"],
      trim: true,
      lowercase: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please fill a valid email address",
      ],
      unique: [true, "Email already exists"],
    },

    name: {
      type: String,
      required: [true, "Name is required for creating an account"],
    },

    password: {
      type: String,
      required: [true, "Password is required for creating an account"],
      minlength: [6, "Password should contain more than 6 characters"],
      select: false,
    },
  },
  {
    timestamps: true,
  }
);
// this will convert the password into hash and store it to the database
userSchema.pre("save",async function(){
    if(!this.isModified("password")){
        return 
    }
    const hash=await bcrypt.hash(this.password,10)
    this.password=hash
    return
})
// this will compare the passowrd stored in DB and the passwoed entet by the user

userSchema.methods.comparePassword= async function(password){
    return await bcrypt.compare(password,this.password)

}
const userModel=mongoose.model("user",userSchema)
module.exports=userModel

