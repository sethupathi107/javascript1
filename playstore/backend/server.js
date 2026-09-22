import express from "express";
import authRoutes from "./src/routes/auth.js";
import image from "./src/routes/image.js";
import application from "./src/routes/app.js";
import category from "./src/routes/category.js";
import admin from "./src/routes/admin.js";
import exportRoutes from "./src/routes/export.js";
import auth from "./src/middlewares/auth.js"
import requireAdmin from "./src/middlewares/requireAdmin.js"
import DbTransport from "./src/utils/dbTransport.js";
import { Logs } from "./src/sequelize/config/database.js";
import { logger } from "./src/utils/logger.js";
import "./src/utils/mailWorker.js";
import "./src/utils/exportWorker.js";
import bullBoardAdapter from "./src/utils/bullBoard.js";
import { ensureApplicationsIndex } from "./src/opensearch/opensearchIndex.js";
import "./src/opensearch/searchIndexWorker.js";

await ensureApplicationsIndex();


logger.add(new DbTransport({ level: "info" }, Logs));

const app = express(); 
app.use(express.json())
app.use("/v1/sign",authRoutes);
app.use("/queues", bullBoardAdapter.getRouter());
app.use(auth);
app.use("/v1/app",application);
app.use("/v1/images",image);
app.use("/v1/category",category);
app.use("/v1/admin",requireAdmin,admin);
app.use("/v1/admin/export",requireAdmin,exportRoutes);

app.listen(4000, () => console.log('Server running on port 4000'));