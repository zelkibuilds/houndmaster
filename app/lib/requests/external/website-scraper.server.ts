import { chromium } from "playwright";
import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { db } from "~/lib/db/drizzle.server";
import { websiteAnalysis } from "~/lib/db/schema";
import type { Chain } from "~/config/chains";

const genAI = google("gemini-2.0-flash-001");

const AD_SERVING_DOMAINS = [
  "doubleclick.net",
  "adservice.google.com",
  "googlesyndication.com",
  "googletagservices.com",
  "googletagmanager.com",
  "google-analytics.com",
  "adsystem.com",
  "adservice.com",
  "adnxs.com",
  "ads-twitter.com",
  "facebook.net",
  "fbcdn.net",
  "amazon-adsystem.com",
];

async function initializeBrowser() {
  const browser = await chromium.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--no-first-run",
      "--no-zygote",
      "--single-process",
      "--disable-gpu",
    ],
  });

  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    viewport: { width: 1280, height: 800 },
  });

  // Block ads and media to speed up scraping
  await context.route(
    "**/*.{png,jpg,jpeg,gif,svg,mp3,mp4,avi,flac,ogg,wav,webm}",
    (route) => route.abort()
  );
  await context.route("**/*", (route, request) => {
    const hostname = new URL(request.url()).hostname;
    if (AD_SERVING_DOMAINS.some((domain) => hostname.includes(domain))) {
      return route.abort();
    }
    return route.continue();
  });

  return { browser, context };
}

async function scrapePage(url: string) {
  const { browser, context } = await initializeBrowser();
  let content = "";
  let error = null;
  const sitemapUrls = new Set<string>();

  try {
    const page = await context.newPage();

    // Try to get sitemap first
    try {
      const sitemapUrl = new URL("/sitemap.xml", url).toString();
      const sitemapResponse = await page.goto(sitemapUrl, { timeout: 10000 });
      if (sitemapResponse?.ok()) {
        const sitemapContent = await page.content();
        const urls = sitemapContent.match(/(?<=<loc>).*?(?=<\/loc>)/g) || [];
        for (const u of urls) {
          sitemapUrls.add(u);
        }
      }
    } catch (e) {
      console.log("No sitemap found, continuing with main URL");
    }

    // Add the main URL
    sitemapUrls.add(url);

    // Scrape each URL
    const contents: string[] = [];
    for (const pageUrl of sitemapUrls) {
      try {
        const response = await page.goto(pageUrl, {
          waitUntil: "networkidle",
          timeout: 30000,
        });

        if (response?.ok()) {
          // Wait for any dynamic content
          await page.waitForTimeout(2000);

          // Get text content to avoid HTML markup
          const pageContent = await page.evaluate(() => {
            const selectors = [
              "header",
              "main",
              "article",
              "section",
              'div[class*="content"]',
              'div[class*="main"]',
            ];

            // Find main content areas
            const elements = document.querySelectorAll(selectors.join(","));
            let text = "";

            for (const el of elements) {
              // Skip navigation and footer areas
              if (
                el.closest("nav") ||
                el.closest("footer") ||
                el.closest('[class*="menu"]') ||
                el.closest('[class*="navigation"]')
              )
                continue;

              text += `${el.textContent}\n`;
            }

            return text.trim();
          });

          if (pageContent) {
            contents.push(`=== Content from ${pageUrl} ===\n${pageContent}`);
          }
        }
      } catch (e) {
        console.error(`Failed to scrape ${pageUrl}:`, e);
      }
    }

    content = contents.join("\n\n");
  } catch (e) {
    error = e instanceof Error ? e.message : "Unknown error during scraping";
  } finally {
    await context.close();
    await browser.close();
  }

  if (error) throw new Error(error);
  return { content, urls: Array.from(sitemapUrls) };
}

interface ServiceRecommendation {
  name: string;
  details: string;
  priority: "high" | "medium" | "low";
}

interface AnalysisResponse {
  project_description: string;
  roadmap: string | null;
  services: ServiceRecommendation[];
  confidence: "high" | "medium" | "low";
}

async function analyzeContent(content: string) {
  if (!content.trim()) {
    return {
      project_description: "No content available for analysis",
      roadmap: null,
      services_analysis: "Unable to analyze without content",
      confidence: "low" as const,
    };
  }

  const prompt = `You are a JSON-only API. Your response must be valid parseable JSON with no other text.

    Analyze this website content and return a JSON object with exactly these fields:
    {
      "project_description": A concise description of what the project is and does,
      "roadmap": Their roadmap or future plans (null if not found),
      "services": An array of recommended services, each with name and details,
      "confidence": Either "high", "medium", or "low"
    }

    CRITICAL INSTRUCTIONS FOR services array:
    1. Return an array of service objects with this exact structure:
    "services": [
      {
        "name": "Service Name",
        "details": "Clear explanation of why this service is needed and how it helps",
        "priority": "high" | "medium" | "low"
      }
    ]
    2. Only include truly relevant services
    3. Keep explanations concise and action-oriented
    4. Focus on immediate needs and clear value-add
    5. Order by priority (high to low)

    Available services to analyze (pick only the most relevant):
    - Smart Contract Development
    - Web3 Design and UX
    - Full Stack Development for dApps
    - Design Sprints
    - Community Management
    - DAO Setup and Consulting
    - Content Creation
    - Tokenomics Design

    Content to analyze:
    ${content}
  `;

  const { text: analysisResponse } = await generateText({
    model: genAI,
    prompt,
  });

  try {
    const jsonMatch = analysisResponse.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    const jsonStr = jsonMatch ? jsonMatch[1] : analysisResponse;
    const analysis = JSON.parse(jsonStr.trim()) as AnalysisResponse;

    // Format services into a clean string
    const servicesText =
      analysis.services
        ?.sort((a: ServiceRecommendation, b: ServiceRecommendation) => {
          const priority = { high: 0, medium: 1, low: 2 } as const;
          return priority[a.priority] - priority[b.priority];
        })
        ?.map(
          (service: ServiceRecommendation) =>
            `**${service.name}**: ${service.details}`
        )
        .join("\n\n") || "No services recommended";

    return {
      project_description: analysis.project_description.replace(/[*_]/g, ""),
      roadmap: analysis.roadmap?.replace(/[*_]/g, "") ?? null,
      services_analysis: servicesText,
      confidence: analysis.confidence,
    };
  } catch (error) {
    console.error("Failed to parse Gemini response:", error);
    console.error("Raw response:", analysisResponse);
    return {
      project_description: "Failed to analyze content",
      roadmap: null,
      services_analysis: "Analysis failed",
      confidence: "low" as const,
    };
  }
}

export async function analyzeWebsite(
  contractId: string,
  url: string,
  chain: Chain
) {
  // Check if analysis already exists
  const existingAnalysis = await db.query.websiteAnalysis.findFirst({
    where: (wa, { eq }) => eq(wa.contract_id, contractId),
  });

  if (existingAnalysis) {
    return {
      project_description: existingAnalysis.project_description,
      roadmap: existingAnalysis.roadmap,
      services_analysis: existingAnalysis.services_analysis,
      confidence: existingAnalysis.confidence as "high" | "medium" | "low",
    };
  }

  const { content, urls } = await scrapePage(url);
  const analysis = await analyzeContent(content);

  await db.insert(websiteAnalysis).values({
    contract_id: contractId,
    project_description: analysis.project_description,
    roadmap: analysis.roadmap,
    services_analysis: analysis.services_analysis,
    confidence: analysis.confidence,
    source_urls: JSON.stringify(urls),
    raw_content: content,
  });

  return analysis;
}
