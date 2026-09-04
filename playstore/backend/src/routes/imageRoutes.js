import express from "express";
const router = express.Router();

router.get("/:id",(req,res)=>{
    res.send("this will give all the images the app has");
})

router.post("/:id",(req,res)=>{
    res.send("this will be used to upload images to the app");
})

router.delete("/:id",(req,res)=>{
    res.send("this will be used to delete the app's SS");
})
export default router;