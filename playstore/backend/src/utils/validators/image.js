import { body, param } from "express-validator";

const appIdParam = param("id")
    .notEmpty().withMessage("App id is required")
    .isInt({ min: 1 }).withMessage("App id must be a positive integer")
    .toInt();

const appIdParamValidator = [
    appIdParam
];

const addAppImageValidator = [
    appIdParam,
    body("url")
        .trim()
        .notEmpty().withMessage("Image url is required")
        .isURL().withMessage("Image url must be a valid URL")
];

const deleteAppImageValidator = [
    appIdParam,
    body("imageId")
        .notEmpty().withMessage("imageId is required")
        .isInt({ min: 1 }).withMessage("imageId must be a positive integer")
        .toInt()
];

export default {
    appIdParamValidator,
    addAppImageValidator,
    deleteAppImageValidator
};
