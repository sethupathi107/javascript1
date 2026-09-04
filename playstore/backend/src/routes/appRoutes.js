import express from "express";
const router = express.Router();

router.get("/",(req,res)=>{
    res.send("this endpoint will return all the apps");
})

router.get("/:id",(req,res)=>{
    res.send("this endpoint will give the exact app")
})

router.post("/",(req,res)=>{
    res.send("this will be used to create a app")
})

router.put("/",(req,res)=>{
    res.send("this will be used to update the existing app");
})

router.delete("/:id",(req,res)=>{
    res.send("this will be used to delete the app")
})

export default router;