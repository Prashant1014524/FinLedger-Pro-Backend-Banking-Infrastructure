
// app.js two main things server creation and server config api's middleware 
const express=require("express")
const cookieParser=require("cookie-parser")

const app=express()
app.use(express.json())
app.use(cookieParser())

// routes
const authRouter=require("./routes/auth.routes")
const accountRouter=require("./routes/account.routes")
const transactionRoutes=require("./routes/transaction.routes")
// use routes
app.use("/api/auth",authRouter) //jin bhi api ka end point /api/auth hit hoga sb authroute.js pr route hongi
app.use("/api/accounts",accountRouter)
app.use("/api/transactions",transactionRoutes)
module.exports=app


