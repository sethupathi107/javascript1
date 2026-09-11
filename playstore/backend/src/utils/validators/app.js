import { body, param } from "express-validator";

const idParam = param("id")
    .notEmpty().withMessage("App id is required")
    .isInt({ min: 1 }).withMessage("App id must be a positive integer")
    .toInt();

const createAppValidator = [
    body("name")
        .trim()
        .notEmpty().withMessage("Name is required")
        .isLength({ min: 1, max: 150 }).withMessage("Name must be between 1 and 150 characters"),
    body("category")
        .trim()
        .notEmpty().withMessage("Category is required")
        .isLength({ min: 1, max: 100 }).withMessage("Category must be between 1 and 100 characters"),
    body("description")
        .optional()
        .isString().withMessage("Description must be a string")
        .isLength({ max: 2000 }).withMessage("Description must be at most 2000 characters")
];

const updateAppValidator = [
    body("id")
        .notEmpty().withMessage("App id is required")
        .isInt({ min: 1 }).withMessage("App id must be a positive integer")
        .toInt(),
    body("name")
        .optional()
        .trim()
        .isLength({ min: 1, max: 150 }).withMessage("Name must be between 1 and 150 characters"),
    body("category")
        .optional()
        .trim()
        .isLength({ min: 1, max: 100 }).withMessage("Category must be between 1 and 100 characters"),
    body("description")
        .optional()
        .isString().withMessage("Description must be a string")
        .isLength({ max: 2000 }).withMessage("Description must be at most 2000 characters")
];

const appIdParamValidator = [
    idParam
];

export default {
    createAppValidator,
    updateAppValidator,
    appIdParamValidator
};
