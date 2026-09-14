import fs from "fs/promises";
import { logger, logActivity } from "../utils/logger.js";

const APPS_FILE = "./src/jsonfiles/apps.json";

async function getApps() {
    const data = await fs.readFile(APPS_FILE, "utf-8");
    return JSON.parse(data);
}

async function saveApps(apps) {
    await fs.writeFile(APPS_FILE, JSON.stringify(apps, null, 2));
}

async function getAllApps(req, res) {
    try {
        const apps = await getApps();
        res.json(apps);
    } catch (error) {
        logger.error(error.stack || error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}

async function getAppById(req, res) {
    try {
        const apps = await getApps();
        const app = apps.find(app => app.id === Number(req.params.id));

        if (!app) {
            return res.status(404).json({ message: "App not found" });
        }

        res.json(app);
    } catch (error) {
        logger.error(error.stack || error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}

async function createApp(req, res) {
    try {
        const { name, category, description } = req.body;

        if (!name || !category) {
            return res.status(400).json({
                message: "Name and category are required"
            });
        }

        const apps = await getApps();

        const newApp = {
            id: Date.now(),
            name,
            category,
            description: description || "",
            downloads: 0,
            uploaderId: req.user.id
        };

        apps.push(newApp);
        await saveApps(apps);

        logActivity(req.user, "created app", { appId: newApp.id, appName: newApp.name });

        res.status(201).json(newApp);
    } catch (error) {
        logger.error(error.stack || error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}

async function updateApp(req, res) {
    try {
        const { id, name, category, description } = req.body;

        if (!id) {
            return res.status(400).json({ message: "App id is required" });
        }

        const apps = await getApps();
        const app = apps.find(app => app.id === id);

        if (!app) {
            return res.status(404).json({ message: "App not found" });
        }

        if (name) app.name = name;
        if (category) app.category = category;
        if (description !== undefined) app.description = description;

        await saveApps(apps);

        logActivity(req.user, "updated app", { appId: app.id, appName: app.name });

        res.json(app);
    } catch (error) {
        logger.error(error.stack || error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}

async function deleteApp(req, res) {
    try {
        const appId = Number(req.params.id);
        const apps = await getApps();
        const index = apps.findIndex(app => app.id === appId);

        if (index === -1) {
            return res.status(404).json({ message: "App not found" });
        }

        const [deletedApp] = apps.splice(index, 1);
        await saveApps(apps);

        logActivity(req.user, "deleted app", { appId: deletedApp.id, appName: deletedApp.name });

        res.json({ message: "App deleted", app: deletedApp });
    } catch (error) {
        logger.error(error.stack || error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}

export default {
    getAllApps,
    getAppById,
    createApp,
    updateApp,
    deleteApp
};
