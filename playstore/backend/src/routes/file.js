import express from "express";
import appController from "../service/file.js";
import appValidators from "../utils/validators/app.js";
import validateRequest from "../utils/validateRequest.js";

const router = express.Router();

router.get("/", appController.getAllApps);
router.get("/:id", appValidators.appIdParamValidator, validateRequest, appController.getAppById);
router.post("/", appValidators.createAppValidator, validateRequest, appController.createApp);
router.put("/", appValidators.updateAppValidator, validateRequest, appController.updateApp);
router.delete("/:id", appValidators.appIdParamValidator, validateRequest, appController.deleteApp);

export default router;
