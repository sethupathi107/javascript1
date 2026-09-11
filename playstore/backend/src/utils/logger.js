import fs from "fs";
import path from "path";
import winston from "winston";

const LOG_DIR = "logs";

if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR);
}

const { combine, timestamp, printf, colorize } = winston.format;

const plainFormat = printf(({ timestamp, level, message }) => {
    return `${timestamp} [${level.toUpperCase()}] ${message}`;
});

// General app logger — server errors / system-level events.
// Replaces console.log/console.error across controllers.
export const logger = winston.createLogger({
    level: "info",
    format: combine(timestamp({ format: "YYYY-MM-DD HH:mm:ss" }), plainFormat),
    transports: [
        new winston.transports.Console({
            format: combine(colorize(), timestamp({ format: "YYYY-MM-DD HH:mm:ss" }), plainFormat)
        }),
        new winston.transports.File({ filename: path.join(LOG_DIR, "error.log"), level: "error" }),
        new winston.transports.File({ filename: path.join(LOG_DIR, "combined.log") })
    ]
});

// User-level activity logger — one line per thing a user did
// (signed in, uploaded an app, downloaded an app, etc).
const activityLogger = winston.createLogger({
    level: "info",
    format: combine(timestamp({ format: "YYYY-MM-DD HH:mm:ss" }), plainFormat),
    transports: [
        new winston.transports.Console({
            format: combine(colorize(), timestamp({ format: "YYYY-MM-DD HH:mm:ss" }), plainFormat)
        }),
        new winston.transports.File({ filename: path.join(LOG_DIR, "user-activity.log") })
    ]
});

/**
 * Logs one line describing what a user did.
 * @param {{id?: any, name?: string, email?: string}|null|undefined} user
 * @param {string} action - e.g. "downloaded app", "signed in"
 * @param {object} [meta] - extra structured detail, e.g. { appId, appName }
 */
export function logActivity(user, action, meta = {}) {
    const who = user
        ? `${user.name || user.email || "user"} (id: ${user.id})`
        : "Unknown user";

    const detail = Object.keys(meta).length ? ` — ${JSON.stringify(meta)}` : "";

    activityLogger.info(`${who} ${action}${detail}`);
}

export default logger;