import express from "express";
import adminController from "../service/admin.js";

const router = express.Router();

router.get("/activity", adminController.getActivity);

export default router;
