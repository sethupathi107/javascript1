// Seed script for the Playstore backend.
//
// This is NOT a database seeder - it never touches Postgres directly. It
// drives the already-running server through its real HTTP API (the same
// one the Postman collection hits) with real signups, real sign-ins, real
// multipart file uploads and real downloads - exactly the traffic a fleet
// of real users would produce, just automated and concurrent (like a load
// test). Every row goes through the app's own validation, bcrypt hashing,
// cache invalidation, search-index queueing, etc.
//
// Usage:
//   1. Start the server as normal (e.g. `docker compose up --build`, or
//      `npm run dev` if running outside Docker).
//   2. In a second terminal, from this directory: `npm run seed`
//
// Nothing needs cleaning up by hand - `docker compose down -v` drops the
// postgres_data volume and wipes everything this script created.
//
// Scale note: SEED_APP_COUNT defaults to 1,000,000. That's ~1M real
// multipart HTTP requests against a single Node process + Postgres + Redis
// + OpenSearch, so this is genuinely a load test, not a quick fixture -
// expect it to run for a while (throughput is printed live so you can see
// the actual rate and ETA on your machine). Lower SEED_APP_COUNT for a
// quick smoke run.
//
// Config (all optional, read from process.env):
//   SEED_BASE_URL               default http://localhost:9000 (docker compose's
//                                host port; use http://localhost:4000 if running
//                                `npm run dev` directly on the host)
//   SEED_APP_COUNT               default 1,000,000
//   SEED_USER_COUNT               default 500 (real accounts, reused across many
//                                uploads/downloads each - same as real usage)
//   SEED_CONCURRENCY              default 150 (parallel in-flight requests per phase)
//   SEED_MAX_DOWNLOADS_PER_APP    default 2 (installs/downloads per app, 0..N -
//                                at 1M apps this is already up to 2M extra requests)
//   SEED_IMAGE_ATTACH_RATE        default 0.15 (fraction of apps that get images)
//   SEED_MAX_RETRIES              default 3 (per request, on network error or 5xx)
//   SEED_PROGRESS_INTERVAL_MS     default 2000 (how often progress/rate is printed)

import { randomUUID, randomBytes, randomInt } from "node:crypto";
import http from "node:http";
import https from "node:https";
import { Agent as HttpAgent } from "node:http";
import { Agent as HttpsAgent } from "node:https";
import { URL } from "node:url";

const BASE_URL = process.env.SEED_BASE_URL || "http://localhost:9000";
const USER_COUNT = Number(process.env.SEED_USER_COUNT) || 500;
const APP_COUNT = Number(process.env.SEED_APP_COUNT) || 1_000_000;
const CONCURRENCY = Number(process.env.SEED_CONCURRENCY) || 150;
const MAX_DOWNLOADS_PER_APP = Number(process.env.SEED_MAX_DOWNLOADS_PER_APP) || 2;
const IMAGE_ATTACH_RATE = Number(process.env.SEED_IMAGE_ATTACH_RATE) || 0.15;
const MAX_RETRIES = Number(process.env.SEED_MAX_RETRIES) || 3;
const PROGRESS_INTERVAL_MS = Number(process.env.SEED_PROGRESS_INTERVAL_MS) || 2000;
const SEED_PASSWORD = "Seed@12345";
const RUN_TAG = randomUUID().slice(0, 8); // keeps re-runs collision-free (unique emails each time)

// keep-alive agents so thousands of sequential requests reuse TCP
// connections instead of a fresh handshake each time - this matters a lot
// once CONCURRENCY gets into the hundreds
const httpAgent = new HttpAgent({ keepAlive: true, maxSockets: CONCURRENCY * 2 });
const httpsAgent = new HttpsAgent({ keepAlive: true, maxSockets: CONCURRENCY * 2 });

// ---------------------------------------------------------------------
// streaming, bounded-concurrency runner - runs `total` iterations of
// worker(index) with up to `concurrency` in flight at once. Unlike
// building a `total`-length array up front, this stays O(1) in memory
// regardless of whether `total` is 100 or 100,000,000 - required once
// APP_COUNT/downloads reach into the millions.
// ---------------------------------------------------------------------
async function runPool(total, worker, concurrency, onProgress) {
    let cursor = 0;
    let ok = 0;
    let failed = 0;

    const progressTimer = onProgress ? setInterval(() => onProgress({ done: ok + failed, ok, failed, total }), PROGRESS_INTERVAL_MS) : null;

    async function runner() {
        while (cursor < total) {
            const index = cursor++;
            try {
                const success = await worker(index);
                if (success === false) failed++;
                else ok++;
            } catch {
                failed++;
            }
        }
    }

    await Promise.all(Array.from({ length: Math.min(concurrency, total) || 1 }, runner));
    if (progressTimer) clearInterval(progressTimer);
    if (onProgress) onProgress({ done: ok + failed, ok, failed, total }); // final line
    return { ok, failed };
}

function formatRate(count, ms) {
    const perSec = ms > 0 ? count / (ms / 1000) : 0;
    return perSec.toFixed(1);
}

function formatEta(remaining, perSec) {
    if (perSec <= 0) return "unknown";
    const secs = remaining / perSec;
    if (secs < 60) return `${secs.toFixed(0)}s`;
    if (secs < 3600) return `${(secs / 60).toFixed(1)}m`;
    return `${(secs / 3600).toFixed(1)}h`;
}

function makeProgressPrinter(label, startedAt) {
    return ({ done, ok, failed, total }) => {
        const elapsedMs = Date.now() - startedAt;
        const rate = formatRate(done, elapsedMs);
        const eta = formatEta(total - done, done / (elapsedMs / 1000));
        process.stdout.write(
            `  ${label}: ${done}/${total} (ok ${ok}, failed ${failed}) - ${rate}/s - ETA ${eta}          \r`
        );
    };
}

// ---------------------------------------------------------------------
// HTTP helpers
// ---------------------------------------------------------------------
// Node's global fetch() refuses a body on GET/HEAD (per the Fetch spec),
// but this API deliberately reads applicationId/imageId etc. from the body
// on several GET routes (GET /v1/app/id, /v1/app/download, /v1/images,
// /v1/images/appImage) - so those need a raw http/https request instead.
function rawRequest(method, url, { token, json } = {}) {
    return new Promise((resolve, reject) => {
        const target = new URL(url);
        const lib = target.protocol === "https:" ? https : http;
        const agent = target.protocol === "https:" ? httpsAgent : httpAgent;
        const payload = json !== undefined ? Buffer.from(JSON.stringify(json)) : null;

        const headers = {};
        if (payload) {
            headers["Content-Type"] = "application/json";
            headers["Content-Length"] = payload.length;
        }
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const req = lib.request(
            target,
            { method, headers, agent },
            (res) => {
                const chunks = [];
                res.on("data", (c) => chunks.push(c));
                res.on("end", () => {
                    const body = Buffer.concat(chunks).toString("utf8");
                    let parsed = null;
                    try {
                        parsed = body ? JSON.parse(body) : null;
                    } catch {
                        // non-JSON response (e.g. a streamed file download) - fine, caller
                        // only cares about status for those.
                    }
                    resolve({ status: res.statusCode, json: parsed, raw: body });
                });
            }
        );
        req.on("error", reject);
        if (payload) req.write(payload);
        req.end();
    });
}

async function apiJson(method, path, { token, json } = {}) {
    const res = await fetch(`${BASE_URL}${path}`, {
        method,
        headers: {
            ...(json !== undefined ? { "Content-Type": "application/json" } : {}),
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: json !== undefined ? JSON.stringify(json) : undefined,
    });
    const text = await res.text();
    let parsed = null;
    try {
        parsed = text ? JSON.parse(text) : null;
    } catch {
        // ignore
    }
    return { status: res.status, json: parsed };
}

async function apiForm(method, path, { token, fields, file }) {
    const form = new FormData();
    for (const [key, value] of Object.entries(fields)) {
        if (value !== undefined && value !== null) form.append(key, String(value));
    }
    if (file) {
        form.append(file.field, new Blob([file.buffer], { type: file.type }), file.filename);
    }
    const res = await fetch(`${BASE_URL}${path}`, {
        method,
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: form,
    });
    const text = await res.text();
    let parsed = null;
    try {
        parsed = text ? JSON.parse(text) : null;
    } catch {
        // ignore
    }
    return { status: res.status, json: parsed };
}

async function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
}

// Retries a request a few times on network errors or 5xx - at this scale,
// a handful of connection resets under sustained load is normal and
// shouldn't fail the whole run.
async function withRetries(fn) {
    let lastError;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            const res = await fn();
            if (res.status && res.status < 500) return res;
            lastError = new Error(`HTTP ${res.status}`);
        } catch (error) {
            lastError = error;
        }
        if (attempt < MAX_RETRIES) await sleep(100 * attempt);
    }
    throw lastError;
}

async function waitForServer() {
    const attempts = 30;
    for (let i = 1; i <= attempts; i++) {
        try {
            await apiJson("POST", "/v1/sign/signin", { json: { email: "healthcheck@seed.test", password: "x" } });
            return;
        } catch {
            process.stdout.write(`Waiting for server at ${BASE_URL} (${i}/${attempts})...\r`);
            await sleep(2000);
        }
    }
    throw new Error(
        `Could not reach ${BASE_URL} after ${attempts} attempts. Is the server running? ` +
        `(docker compose up, or npm run dev - and check SEED_BASE_URL matches how you started it)`
    );
}

// ---------------------------------------------------------------------
// fake data generators (kept dependency-free; App.name/description and
// Category.name have tight length limits enforced at the model level -
// see src/sequelize/models/App.js and Category.js - so these stay short)
// ---------------------------------------------------------------------
const FIRST_NAMES = ["alex", "sam", "jordan", "taylor", "morgan", "casey", "riley", "jamie", "drew", "avery", "quinn", "reese", "harper", "rowan", "skyler", "dakota", "emerson", "finley", "parker", "sage"];
const LAST_NAMES = ["chen", "patel", "garcia", "kim", "smith", "nguyen", "khan", "silva", "muller", "rossi", "kumar", "ivanov", "sato", "diaz", "cohen", "brooks", "reed", "hart", "fox", "lane"];

const ADJECTIVES = ["Quick", "Smart", "Bright", "Swift", "Prime", "Nova", "Cloud", "Pixel", "Zen", "Turbo", "Fresh", "Bold", "Clever", "Rapid", "Vivid", "Cosmic", "Silver", "Golden", "Mint", "Echo"];
const NOUNS = ["Notes", "Tracker", "Chat", "Camera", "Timer", "Wallet", "Planner", "Player", "Scanner", "Diary", "Mapper", "Editor", "Vault", "Journal", "Fitness", "Recipe", "Weather", "Budget", "Focus", "Sketch"];

const DESCRIPTIONS = [
    "Fast and simple for everyday tasks.",
    "Your all-in-one productivity companion.",
    "Beautifully designed, lightning fast.",
    "Stay organized, stay ahead.",
    "Small app, big impact.",
    "Built for speed and simplicity.",
    "The easiest way to get things done.",
    "Minimal design, maximum function.",
    "Your daily companion app.",
    "Powerful tools, simple interface.",
];

const CATEGORY_NAMES = [
    "Games", "Tools", "Social", "Music", "Video",
    "Photography", "Education", "Finance", "Health & Fitness", "Productivity",
    "Shopping", "Travel", "Weather", "News", "Sports",
    "Food & Drink", "Lifestyle", "Business", "Books", "Kids",
];

function pick(arr) {
    return arr[randomInt(0, arr.length)];
}

function makeUser(i) {
    const username = `${pick(FIRST_NAMES)}${pick(LAST_NAMES)}${randomInt(10, 9999)}`;
    return {
        name: username,
        email: `${username}.${RUN_TAG}.${i}@seed.test`,
        password: SEED_PASSWORD,
    };
}

function makeAppPayload() {
    const name = `${pick(ADJECTIVES)} ${pick(NOUNS)} ${randomInt(1, 999999)}`.slice(0, 50);
    const description = pick(DESCRIPTIONS);
    return { name, description };
}

// 1x1 transparent PNG - just enough to pass uploadImage.js's mimetype filter
const PNG_1x1 = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
    "base64"
);

// small and fixed rather than random per-app - at a million uploads,
// keeping this tiny and constant matters a lot for disk usage/inodes and
// upload latency; the goal is realistic traffic shape, not realistic file
// contents
const APK_BUFFER = randomBytes(256);

// ---------------------------------------------------------------------
// seeding steps
// ---------------------------------------------------------------------
// Real lifecycle per virtual user: signup (issues an initial session),
// then an explicit sign-in call right after - mirrors a real client that
// signs up once and then authenticates fresh on every future session,
// rather than holding onto the signup response's token forever.
async function createUsers(count) {
    console.log(`\nCreating ${count} users (signup + signin)...`);
    const users = new Array(count);
    const startedAt = Date.now();

    const { ok, failed } = await runPool(
        count,
        async (i) => {
            const spec = makeUser(i);
            const signupRes = await withRetries(() => apiJson("POST", "/v1/sign/signup", { json: spec }));
            if (signupRes.status !== 201 || !signupRes.json?.safeUser?.id) return false;

            const signinRes = await withRetries(() =>
                apiJson("POST", "/v1/sign/signin", { json: { email: spec.email, password: spec.password } })
            );
            if (signinRes.status !== 200 || !signinRes.json?.accessToken) return false;

            users[i] = { id: signupRes.json.safeUser.id, email: spec.email, accessToken: signinRes.json.accessToken };
            return true;
        },
        Math.min(CONCURRENCY, 50), // bcrypt (cost 10) is CPU-bound server-side - piling on more
        // concurrency here just queues on the server's libuv threadpool, it doesn't help
        makeProgressPrinter("users", startedAt)
    );

    console.log();
    const created = users.filter(Boolean);
    console.log(`  -> ${ok} created, ${failed} failed`);
    if (created.length === 0) throw new Error("No users could be created - aborting (check the server logs).");
    return created;
}

async function ensureCategories(token) {
    console.log(`\nEnsuring ${CATEGORY_NAMES.length} categories exist...`);
    // Deliberately does NOT start from a GET /v1/category listing - that
    // route is Redis-cached (key 'category:all', TTL = EXP seconds) and if
    // Postgres was ever reset out-of-band (e.g. a manual TRUNCATE) without
    // also clearing Redis, that list can describe category rows that no
    // longer exist, which then makes every app insert fail its categoryId
    // foreign key. POST /v1/category's own "does this name exist" check
    // reads Postgres directly (bypassing the cache), so always attempting
    // a create first is the reliable path; GET is only used as a fallback
    // once a 409 has confirmed (via that direct DB check) the row is real.
    const categories = new Array(CATEGORY_NAMES.length);
    await runPool(CATEGORY_NAMES.length, async (i) => {
        const name = CATEGORY_NAMES[i];
        const res = await withRetries(() => apiJson("POST", "/v1/category", { token, json: { name } }));
        if (res.status === 201) {
            categories[i] = res.json;
            return true;
        }
        if (res.status === 409) {
            const refreshed = await apiJson("GET", "/v1/category", { token });
            categories[i] = (refreshed.json || []).find((c) => c.name === name) || null;
            return !!categories[i];
        }
        return false;
    }, CONCURRENCY);

    const ready = categories.filter(Boolean);
    console.log(`  -> ${ready.length}/${CATEGORY_NAMES.length} categories ready`);
    if (ready.length === 0) throw new Error("No categories available - aborting.");
    return ready;
}

// Only application ids are kept around afterwards (not the whole app
// object) - at 1,000,000 apps that's the difference between ~36MB and
// several hundred MB of JS heap for this array.
function buildAppRequest(i, uploader, category) {
    const { name, description } = makeAppPayload();
    return () =>
        apiForm("POST", "/v1/app", {
            token: uploader.accessToken,
            fields: { name, categoryId: category.id, description },
            file: {
                field: "appFile",
                buffer: APK_BUFFER,
                type: "application/vnd.android.package-archive",
                filename: `app-${i}.apk`,
            },
        });
}

async function createApps(count, users, categories) {
    // Canary: create exactly one real app before committing to a pool of
    // (potentially) a million. If auth/categoryId/upload plumbing is
    // broken, this fails fast in ~1 request instead of after burning
    // through the entire run as all-failed (which is exactly what a stale
    // Redis-cached category id did during testing - see ensureCategories).
    console.log(`\nCanary check: creating 1 app before starting the full run of ${count}...`);
    const canaryRes = await withRetries(buildAppRequest(-1, pick(users), pick(categories)));
    if (canaryRes.status !== 201 || !canaryRes.json?.id) {
        throw new Error(
            `Canary app creation failed (status ${canaryRes.status}, body ${JSON.stringify(canaryRes.json)}). ` +
            `Aborting before the full run. If you reset the database manually (e.g. a raw TRUNCATE) without also ` +
            `clearing Redis, GET /v1/category can still serve stale cached ids - flush Redis ` +
            `(docker compose exec redis redis-cli FLUSHALL, or docker compose down -v) and try again.`
        );
    }
    console.log("  -> canary OK");

    console.log(`\nCreating ${count} apps...`);
    const appIds = new Array(count);
    appIds[0] = canaryRes.json.id;
    const startedAt = Date.now();

    await runPool(
        count - 1,
        async (i) => {
            const uploader = pick(users);
            const category = pick(categories);
            const res = await withRetries(buildAppRequest(i, uploader, category));

            if (res.status !== 201 || !res.json?.id) return false;
            appIds[i + 1] = res.json.id;
            return true;
        },
        CONCURRENCY,
        makeProgressPrinter("apps", startedAt)
    );

    console.log();
    const apps = appIds.filter(Boolean);
    console.log(`  -> ${apps.length}/${count} apps created`);
    return apps;
}

async function addImages(appIds, users) {
    const attachCount = Math.round(appIds.length * IMAGE_ATTACH_RATE);
    console.log(`\nAdding images to ~${attachCount} apps...`);
    const startedAt = Date.now();
    let created = 0;

    await runPool(
        appIds.length,
        async (i) => {
            if (Math.random() >= IMAGE_ATTACH_RATE) return true; // not selected, not a failure
            const appId = appIds[i];
            const user = pick(users);
            const imageCount = randomInt(1, 3);
            for (let n = 0; n < imageCount; n++) {
                const res = await withRetries(() =>
                    apiForm("POST", "/v1/images", {
                        token: user.accessToken,
                        fields: { applicationId: appId },
                        file: { field: "image", buffer: PNG_1x1, type: "image/png", filename: `screenshot-${n}.png` },
                    })
                );
                if (res.status === 201) created++;
            }
            return true;
        },
        CONCURRENCY,
        makeProgressPrinter("apps scanned for images", startedAt)
    );

    console.log();
    console.log(`  -> ${created} images created`);
}

async function simulateDownloads(appIds, users) {
    const totalSlots = appIds.length * MAX_DOWNLOADS_PER_APP;
    console.log(`\nSimulating downloads/installs (up to ${MAX_DOWNLOADS_PER_APP} per app, ${totalSlots} slots)...`);
    const startedAt = Date.now();

    const { ok } = await runPool(
        totalSlots,
        async (i) => {
            const appId = appIds[i % appIds.length];
            // skip roughly half the slots so not every app hits the max - a more
            // realistic long-tail distribution than a flat count per app
            if (Math.random() < 0.5) return true;
            const user = pick(users);
            const res = await withRetries(() =>
                rawRequest("GET", `${BASE_URL}/v1/app/download`, {
                    token: user.accessToken,
                    json: { applicationId: appId },
                })
            );
            return res.status === 200;
        },
        CONCURRENCY,
        makeProgressPrinter("downloads", startedAt)
    );

    console.log();
    console.log(`  -> ${ok} downloads recorded`);
}

// ---------------------------------------------------------------------
// main
// ---------------------------------------------------------------------
async function main() {
    const startedAt = Date.now();
    console.log("Playstore backend seeder");
    console.log("=========================");
    console.log(`base_url:             ${BASE_URL}`);
    console.log(`users:                ${USER_COUNT}`);
    console.log(`apps:                 ${APP_COUNT}`);
    console.log(`concurrency:          ${CONCURRENCY}`);
    console.log(`max downloads/app:    ${MAX_DOWNLOADS_PER_APP}`);
    console.log(`image attach rate:    ${IMAGE_ATTACH_RATE}`);
    console.log(`run tag:              ${RUN_TAG}`);
    if (APP_COUNT >= 100_000) {
        console.log(
            `\nThis is a real load test against a live single-process server - at this scale, expect it\n` +
            `to take a while. Live throughput/ETA prints below once app creation starts.`
        );
    }

    await waitForServer();
    console.log(`Server is up at ${BASE_URL}.`);

    const users = await createUsers(USER_COUNT);
    const categories = await ensureCategories(users[0].accessToken);
    const appIds = await createApps(APP_COUNT, users, categories);
    if (appIds.length > 0) {
        await addImages(appIds, users);
        await simulateDownloads(appIds, users);
    }

    const elapsedSec = ((Date.now() - startedAt) / 1000).toFixed(1);
    console.log("\nDone.");
    console.log(`  users:      ${users.length}`);
    console.log(`  categories: ${categories.length}`);
    console.log(`  apps:       ${appIds.length}`);
    console.log(`  elapsed:    ${elapsedSec}s`);
    console.log(`\nAll seeded users share the password: ${SEED_PASSWORD}`);
    console.log(`Sample login: ${users[0].email} / ${SEED_PASSWORD}`);
    console.log(`\nRun \`docker compose down -v\` to wipe all of this (and everything else in postgres_data).`);
}

main().catch((error) => {
    console.error("\nSeeding failed:", error.message);
    process.exit(1);
});
