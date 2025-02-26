import express from "express";
import scrapeRoutes from "./scrapeRoutes.js";
// Import other route modules here as needed

const router = express.Router();

// Use the imported routes
router.use("/scrape", scrapeRoutes);
// Add other routes here, e.g., router.use("/other", otherRoutes);

export default router;
