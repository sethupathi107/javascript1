import fs from "fs/promises";
import { logger, logActivity } from "../utils/logger.js";

const CATEGORIES_FILE = "./src/jsonfiles/categories.json";

async function getCategories() {
    const data = await fs.readFile(CATEGORIES_FILE, "utf-8");
    return JSON.parse(data);
}

async function saveCategories(categories) {
    await fs.writeFile(CATEGORIES_FILE, JSON.stringify(categories, null, 2));
}

async function getAllCategories(req, res) {
    try {
        const categories = await getCategories();
        res.json(categories);
    } catch (error) {
        logger.error(error.stack || error.message);

        res.status(500).json({ message: "Internal server error" });
    }
}

async function createCategory(req, res) {
    try {
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({ message: "Category name is required" });
        }

        const categories = await getCategories();

        const existingCategory = categories.find(category => category.name === name);

        if (existingCategory) {
            return res.status(409).json({ message: "Category already exists" });
        }

        const newCategory = {
            id: Date.now(),
            name
        };

        categories.push(newCategory);
        await saveCategories(categories);

        logActivity(req.user, "created category", { categoryId: newCategory.id, name: newCategory.name });

        res.status(201).json(newCategory);
    } catch (error) {
        logger.error(error.stack || error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}

async function deleteCategory(req, res) {
    try {
        const { id } = req.body;

        if (!id) {
            return res.status(400).json({ message: "Category id is required" });
        }

        const categories = await getCategories();
        const index = categories.findIndex(category => category.id === id);

        if (index === -1) {
            return res.status(404).json({ message: "Category not found" });
        }

        const [deletedCategory] = categories.splice(index, 1);
        await saveCategories(categories);

        logActivity(req.user, "deleted category", { categoryId: deletedCategory.id, name: deletedCategory.name });

        res.json({ message: "Category deleted", category: deletedCategory });
    } catch (error) {
        logger.error(error.stack || error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}

export default {
    getAllCategories,
    createCategory,
    deleteCategory
};
