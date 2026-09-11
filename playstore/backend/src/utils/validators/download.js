import { body, query } from "express-validator";

const incrementDownloadValidator = [
    body("id")
        .notEmpty().withMessage("App id is required")
        .isInt({ min: 1 }).withMessage("App id must be a positive integer")
        .toInt()
];

const getDownloadCountValidator = [
    query("id")
        .notEmpty().withMessage("App id is required")
        .isInt({ min: 1 }).withMessage("App id must be a positive integer")
        .toInt()
];

export default {
    incrementDownloadValidator,
    getDownloadCountValidator
};
