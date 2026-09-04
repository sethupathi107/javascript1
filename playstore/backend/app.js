import express from "express";
import signup from "./src/routes/signin-signup.js";
import image from "./src/routes/imageRoutes.js";
import application from "./src/routes/appRoutes.js";
import category from "./src/routes/categoryRoutes.js";

const app = express();
// app.use("/api")
app.use("/v1/login",signup);
app.use("/v1/app",application);
app.use("/v1/images",image);
app.use("/v1/category",category);

app.listen(8000,()=>console.log("the surver is running on port 8000"));