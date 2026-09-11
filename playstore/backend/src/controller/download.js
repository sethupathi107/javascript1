import fs from "fs/promises";
import { logger, logActivity } from "../utils/logger.js";

const APPS_FILE = "./src/jsonfiles/apps.json";
const DOWNLOAD_LOGS_FILE = "./src/jsonfiles/downloadLogs.json";

async function getApps() {
    const data = await fs.readFile(APPS_FILE, "utf-8");
    return JSON.parse(data);
}

async function saveApps(apps) {
    await fs.writeFile(APPS_FILE, JSON.stringify(apps, null, 2));
}

async function getDownloadLogs() {
    const data = await fs.readFile(DOWNLOAD_LOGS_FILE, "utf-8");
    return JSON.parse(data);
}

async function saveDownloadLogs(logs) {
    await fs.writeFile(DOWNLOAD_LOGS_FILE, JSON.stringify(logs, null, 2));
}

async function incrementDownload(req, res) {
    try {
        const { id } = req.body;

        if (!id) {
            return res.status(400).json({ message: "App id is required" });
        }

        const apps = await getApps();
        const app = apps.find(app => app.id === id);

        if (!app) {
            return res.status(404).json({ message: "App not found" });
        }

        app.downloads += 1;
        await saveApps(apps);

        const logs = await getDownloadLogs();
        logs.push({
            id: Date.now(),
            appId: id,
            userId: req.user.id,
            timestamp: new Date().toISOString()
        });
        await saveDownloadLogs(logs);

        logActivity(req.user, "downloaded app", { appId: app.id, appName: app.name });

        res.json({ message: "Download counted", downloads: app.downloads });
    } catch (error) {
        logger.error(error.stack || error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}

async function getDownloadCount(req, res) {
    try {
        const { id } = req.query;

        if (!id) {
            return res.status(400).json({ message: "App id is required" });
        }

        const apps = await getApps();
        const app = apps.find(app => app.id === Number(id));

        if (!app) {
            return res.status(404).json({ message: "App not found" });
        }

        res.json({ downloads: app.downloads });
    } catch (error) {
        logger.error(error.stack || error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}

export default {
    incrementDownload,
    getDownloadCount
};
