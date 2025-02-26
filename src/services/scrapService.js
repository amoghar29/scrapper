// scrapService.ts
import puppeteer from "puppeteer";
import * as cheerio from "cheerio";
import DocumentModel from "../models/documentModel.js";

/**
 * Scrapes a single page and extracts its content
 */
async function scrapeWebsite(url) {
  try {
    const browser = await puppeteer.launch({
      headless: "shell", // Use new headless mode for better performance
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle0", timeout: 60000 });
    const content = await page.content();
    
    // Get page title
    const title = await page.title();

    const $ = cheerio.load(content);

    // Remove script tags, style tags, and comments
    $("script").remove();
    $("style").remove();
    $("noscript").remove();
    $("nav").remove();
    $("footer").remove();
    $("header").remove();
    
    const mainContentSelectors = [
      'main', '.main-content', '.documentation', '.docs-content', 
      'article', '.content', '#content', '.documentation-content'
    ];
    
    let mainContent = '';
    
    for (const selector of mainContentSelectors) {
      const selectedContent = $(selector).text().trim();
      if (selectedContent.length > 200) {
        mainContent = selectedContent;
        break;
      }
    }
    
    if (!mainContent) {
      mainContent = $("body").text();
    }
    
    const cleanedContent = mainContent
      .replace(/\s+/g, " ")
      .replace(/\n+/g, "\n")
      .trim();

    await browser.close();

    return {
      success: true,
      content: cleanedContent,
      title
    };
  } catch (error) {
    console.error(`Error scraping ${url}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Recursively crawls a documentation site and extracts all pages
 */
async function crawlDocumentation(startUrl, source, maxPages = 200) {
  const visited = new Set();
  const toVisit = [startUrl];
  let pagesScraped = 0;
  
  try {
    const browser = await puppeteer.launch({
      headless: "shell",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const urlObj = new URL(startUrl);
    const baseDomain = urlObj.hostname;
    
    while (toVisit.length > 0 && pagesScraped < maxPages) {
      const currentUrl = toVisit.shift();
      
      if (visited.has(currentUrl)) continue;
      
      visited.add(currentUrl);
      console.log(`Scraping ${currentUrl}`);
      
      try {
        const page = await browser.newPage();
        await page.goto(currentUrl, { waitUntil: "networkidle0", timeout: 60000 });
        
        const scrapingResult = await scrapeWebsite(currentUrl);
        
        if (scrapingResult.success) {
          await saveToDatabase(
            currentUrl,
            scrapingResult.content,
            source,
            scrapingResult.title
          );
          
          pagesScraped++;
          
          const links = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('a'))
              .map(a => a.href)
              .filter(href => href && href.startsWith('http'));
          });
          
          for (const link of links) {
            try {
              const linkUrl = new URL(link);
              
              if (linkUrl.hostname === baseDomain && 
                  !visited.has(link) && 
                  !toVisit.includes(link) &&
                  !link.includes('/blog/') && 
                  !link.includes('/pricing/') &&
                  !link.includes('/about/') &&
                  (link.includes('/docs/') || 
                   link.includes('/documentation/') || 
                   link.includes('/guide/') ||
                   link.includes('/help/'))) {
                toVisit.push(link);
              }
            } catch (e) {
              console.warn(`Invalid URL: ${link}`);
            }
          }
        }
        
        await page.close();
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`Error processing ${currentUrl}:`, error);
      }
    }
    
    await browser.close();
    
    return {
      success: true,
      pagesScraped
    };
    
  } catch (error) {
    return {
      success: false,
      pagesScraped,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Find all documentation pages for a specific CDP
 */
async function findDocPages(cdpUrl, cdpName) {
  // Implement this function to find documentation pages for each CDP
  // This would be specific to each CDP's documentation structure
  return [];
}

/**
 * Save scraped content to database
 */
async function saveToDatabase(
  url,
  content,
  source,
  title){
  try {
    // Check if document already exists
    const existing = await DocumentModel.findOne({ url });
    
    if (existing) {
      // Update existing document
      existing.content = content;
      existing.createdAt = new Date();
      if (title) existing.title = title;
      
      await existing.save();
    } else {
      // Create new document
      const document = new DocumentModel({
        url,
        content,
        source,
        title: title || url, // Use URL as fallback if no title
        createdAt: new Date(),
      });
      
      await document.save();
    }
    return true;
  } catch (error) {
    console.error("Error saving to database:", error);
    return false;
  }
}

export const scrapingService = {
  scrapeWebsite,
  saveToDatabase,
  crawlDocumentation,
  findDocPages,
};