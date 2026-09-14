import express from "express";
import downloadController from "../service/download.js";
import downloadValidators from "../utils/validators/download.js";
import validateRequest from "../utils/validateRequest.js";

const router = express.Router();

router.put("/", downloadValidators.incrementDownloadValidator, validateRequest, downloadController.incrementDownload);
router.get("/", downloadValidators.getDownloadCountValidator, validateRequest, downloadController.getDownloadCount);

export default router;
