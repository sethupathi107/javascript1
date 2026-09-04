import express from "express";
const router = express.Router();

router.get("/",(req,res)=>{
    res.send("this will return all the category");
})

router.post("/",(req,res)=>{
    res.send("this will be used to create a new category");
})

router.delete("/",(req,res)=>{
    res.send("this will be used to delete a catefory");
})

export default router;