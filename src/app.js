
// app.js two main things server creation and server config api's middleware 
const express=require("express")
const cookieParser=require("cookie-parser")
const authRouter=require("./routes/auth.routes")
const app=express()
app.use(express.json())
app.use(cookieParser())
app.use("/api/auth",authRouter)     //jin bhi api ka end point /api/auth hit hoga sb authroute.js pr route hongi
module.exports=app

