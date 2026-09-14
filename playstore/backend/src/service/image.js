import fs from "fs/promises";
import { logger, logActivity } from "../utils/logger.js";

const IMAGES_FILE = "./src/jsonfiles/images.json";

async function getImages() {
    const data = await fs.readFile(IMAGES_FILE, "utf-8");
    return JSON.parse(data);
}

async function saveImages(images) {
    await fs.writeFile(IMAGES_FILE, JSON.stringify(images, null, 2));
}

async function getAppImages(req, res) {
    try {
        const appId = Number(req.params.id);
        const images = await getImages();
        const appImages = images.filter(image => image.appId === appId);

        res.json(appImages);
    } catch (error) {
        logger.error(error.stack || error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}

async function addAppImage(req, res) {
    try {
        const appId = Number(req.params.id);
        const { url } = req.body;

        if (!url) {
            return res.status(400).json({ message: "Image url is required" });
        }

        const images = await getImages();

        const newImage = {
            id: Date.now(),
            appId,
            url
        };

        images.push(newImage);
        await saveImages(images);

        logActivity(req.user, "added an image to app", { appId, imageId: newImage.id });

        res.status(201).json(newImage);
    } catch (error) {
        logger.error(error.stack || error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}

async function deleteAppImage(req, res) {
    try {
        const appId = Number(req.params.id);
        const { imageId } = req.body;

        if (!imageId) {
            return res.status(400).json({ message: "imageId is required" });
        }

        const images = await getImages();
        const index = images.findIndex(
            image => image.appId === appId && image.id === imageId
        );

        if (index === -1) {
            return res.status(404).json({ message: "Image not found" });
        }

        const [deletedImage] = images.splice(index, 1);
        await saveImages(images);

        logActivity(req.user, "deleted an image from app", { appId, imageId: deletedImage.id });

        res.json({ message: "Image deleted", image: deletedImage });
    } catch (error) {
        logger.error(error.stack || error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}

export default {
    getAppImages,
    addAppImage,
    deleteAppImage
};
