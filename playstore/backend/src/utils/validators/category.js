import { body } from "express-validator";

const createCategoryValidator = [
    body("name")
        .trim()
        .notEmpty().withMessage("Category name is required")
        .isLength({ min: 1, max: 100 }).withMessage("Category name must be between 1 and 100 characters")
];

const deleteCategoryValidator = [
    body("id")
        .notEmpty().withMessage("Category id is required")
        .isInt({ min: 1 }).withMessage("Category id must be a positive integer")
        .toInt()
];

export default {
    createCategoryValidator,
    deleteCategoryValidator
};
