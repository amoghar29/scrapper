// scrapeRoutes.ts
import express from "express";
import scrapeController from "../controllers/scrapeController.js";

const router = express.Router();

// Define routes
router.post("/url", scrapeController.scrapeUrl);
router.post("/crawl", scrapeController.crawlDocumentation);

export default router;