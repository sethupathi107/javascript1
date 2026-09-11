import fs from "fs/promises";
import { logger, logActivity } from "../utils/logger.js";

const USERS_FILE = "./src/jsonfiles/users.json";
const APPS_FILE = "./src/jsonfiles/apps.json";
const DOWNLOAD_LOGS_FILE = "./src/jsonfiles/downloadLogs.json";

async function readJson(path) {
    const data = await fs.readFile(path, "utf-8");
    return JSON.parse(data);
}

async function getActivity(req, res) {
    try {
        const [users, apps, downloadLogs] = await Promise.all([
            readJson(USERS_FILE),
            readJson(APPS_FILE),
            readJson(DOWNLOAD_LOGS_FILE)
        ]);

        const usersById = new Map(users.map(user => [user.id, user]));

        const apps_ = apps.map(app => {
            const uploader = usersById.get(app.uploaderId);
            return {
                ...app,
                uploader: uploader
                    ? { id: uploader.id, name: uploader.name, email: uploader.email }
                    : null
            };
        });

        const downloadActivity = downloadLogs.map(log => {
            const user = usersById.get(log.userId);
            const app = apps.find(app => app.id === log.appId);
            return {
                ...log,
                userName: user ? user.name : null,
                appName: app ? app.name : null
            };
        });

        logActivity(req.user, "viewed the admin activity dashboard");

        res.json({
            totalUsers: users.length,
            totalApps: apps.length,
            totalDownloads: downloadLogs.length,
            apps: apps_,
            downloadActivity,
            users: users.map(({ password, resetToken, refreshTokens, ...safe }) => safe)
        });
    } catch (error) {
        logger.error(error.stack || error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}

export default {
    getActivity
};
