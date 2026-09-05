
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
app.get("/",(req,res)=>{
    res.send("Ledger Service is up and running")
})
app.use("/api/auth", authRouter)
app.use("/api/accounts", accountRouter)
app.use("/api/transactions", transactionRoutes)

// Centralized error handling middleware
app.use((err, req, res, next) => {
    console.error("Global Error Handler caught:", err);
    res.status(err.status || 500).json({
        message: err.message || "Internal Server Error",
        status: "error"
    });
});

module.exports = app


