import express from "express";
import imageController from "../controller/image.js";
import imageValidators from "../utils/validators/image.js";
import validateRequest from "../utils/validateRequest.js";

const router = express.Router();

router.get("/:id", imageValidators.appIdParamValidator, validateRequest, imageController.getAppImages);
router.post("/:id", imageValidators.addAppImageValidator, validateRequest, imageController.addAppImage);
router.delete("/:id", imageValidators.deleteAppImageValidator, validateRequest, imageController.deleteAppImage);

export default router;
