import { scrapingService } from "../services/scrapService.js";

export async function scrapeUrl(req, res) {
  const { url, source } = req.body;

  if (!url || !source) {
    return res.status(400).json({
      success: false,
      error: "URL and source are required",
    });
  }

  try {
    const scrapingResult = await scrapingService.scrapeWebsite(url);

    if (!scrapingResult.success) {
      return res.status(500).json({
        success: false,
        error: scrapingResult.error,
      });
    }

    const savedToDb = await scrapingService.saveToDatabase(
      url,
      scrapingResult.content,
      source,
      scrapingResult.title
    );

    if (!savedToDb) {
      return res.status(500).json({
        success: false,
        error: "Failed to save to database",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Content scraped and saved successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
}

// Handle full documentation crawling
export async function crawlDocumentation(req, res) {
  const { startUrl, source, maxPages } = req.body;

  if (!startUrl || !source) {
    return res.status(400).json({
      success: false,
      error: "Start URL and source are required",
    });
  }

  try {
    // Start the crawling process asynchronously
    res.status(202).json({
      success: true,
      message: "Crawling started. This may take some time.",
    });

    // Continue crawling after sending the response
    const result = await scrapingService.crawlDocumentation(
      startUrl,
      source,
      maxPages || 100
    );

    console.log(`Crawling completed: ${result.pagesScraped} pages scraped`);
  } catch (error) {
    console.error("Crawling error:", error);
    // We've already sent a response, so we just log the error
  }
}

export default {
  scrapeUrl,
  crawlDocumentation,
};
