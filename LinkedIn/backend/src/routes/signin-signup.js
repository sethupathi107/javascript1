import express from "express";
const router = express.Router();

router.post("register",(req,res)=>{
    res.send("this is for register");
})

router.post("login",(req,res)=>{
    res.send("this is for login");
})

router.post("logout",(req,res)=>{
    res.send("this is for logout");
})

router.post("refresh-token",(req,res)=>{
    res.send("this is for refresh-token");
})

export default router;