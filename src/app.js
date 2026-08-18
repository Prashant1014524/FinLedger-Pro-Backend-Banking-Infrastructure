const express=require("express")
const authRouter=require("./routes/auth.routes")
const app=express()
app.use(express.json())
app.use("/api/auth",authRouter)     //jin bhi api ka end point /api/auth hit hoga sb authroute.js pr route hongi
module.exports=app