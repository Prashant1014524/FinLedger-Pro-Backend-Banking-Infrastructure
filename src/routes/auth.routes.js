const express=require("express")
const authController=require("../controllers/auth.controller")
const router=express.Router()

//POST /api/auth/register
router.post("/register",authController.userRegisterConroller)

module.exports=app