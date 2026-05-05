#!/usr/bin/env node
/**
 * sync.js — Pull Substack RSS, merge with manual overrides, write data/posts.json.
 *
 * Run with: npm run sync
 *
 * The script is idempotent. Running it twice produces the same output (modulo
 * new posts on Substack). Override files in /overrides win over RSS data.
 */

const fs = require("fs");
const path = require("path");
const Parser = require("rss-parser");
const slugify = require("slugify");
const { parse: parseHtml } = require("node-html-parser");

const siteConfig = require("../site.config.js");

const ROOT = path.join(__dirname, "..");
const DATA_DIR = path.join(ROOT, "data");
const OVERRIDES_DIR = path.join(ROOT, "overrides");
const POSTS_FILE = path.join(DATA_DIR, "posts.json");

// Ensure directories exist
[DATA_DIR, OVERRIDES_DIR].forEach((d) => {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
});

// RSS parser configured to grab Substack-specific fields.
const parser = new Parser({
  customFields: {
    item: [
      ["content:encoded", "contentEncoded"],
      ["dc:creator", "creator"],
      ["enclosure", "enclosure"],
    ],
  },
});

/**
 * Classify a post into one of our topics.
 * First topic whose match[] keywords appear as whole words in the categories or content wins.
 * Falls back to "personal-and-essays".
 */
function classifyTopic(post) {
  const haystack = [
    ...(post.categories || []),
    post.title || "",
    post.contentSnippet || "",
  ]
    .join(" ")
    .toLowerCase();

  for (const topic of siteConfig.topics) {
    if (!topic.match || topic.match.length === 0) continue;
    for (const keyword of topic.match) {
      // Use word boundary matching to avoid partial matches
      // e.g., "sport" won't match "transport" or "report"
      const wordBoundaryRegex = new RegExp(`\\b${keyword.toLowerCase()}\\b`);
      if (wordBoundaryRegex.test(haystack)) return topic.slug;
    }
  }
  return "personal-and-essays";
}

/**
 * Pull the first <img> src from HTML content for use as hero image.
 */
function extractHeroImage(html) {
  if (!html) return null;
  try {
    const root = parseHtml(html);
    const img = root.querySelector("img");
    return img ? img.getAttribute("src") : null;
  } catch (e) {
    return null;
  }
}

/**
 * Build a clean, URL-safe slug from a title.
 * Substack's URL slugs are usually fine but we re-slug to guarantee consistency.
 */
function makeSlug(title, fallback) {
  if (!title) return fallback || "untitled";
  return slugify(title, { lower: true, strict: true, remove: /[*+~.()'"!:@?]/g });
}

/**
 * Load override JSON for a slug if it exists.
 * Override files live at /overrides/{slug}.json.
 */
function loadOverride(slug) {
  const file = path.join(OVERRIDES_DIR, `${slug}.json`);
  if (!fs.existsSync(file)) return {};
  try {
    return JSON.parse(fs.readFileSync(file, "utf-8"));
  } catch (e) {
    console.warn(`⚠️  Override file ${slug}.json is invalid JSON. Skipping.`);
    return {};
  }
}

/**
 * Strip HTML to plain text for excerpt/description fallback.
 */
function stripHtml(html) {
  if (!html) return "";
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Fetch all post URLs from the sitemap
 */
async function fetchAllPostUrls() {
  const sitemapUrl = siteConfig.site.substackUrl + "/sitemap.xml";
  console.log(`📡  Fetching sitemap: ${sitemapUrl}`);

  try {
    const response = await fetch(sitemapUrl);
    const xml = await response.text();

    // Extract all <loc> tags from sitemap using regex
    const locRegex = /<loc>(.*?)<\/loc>/g;
    const urls = [];
    let match;

    while ((match = locRegex.exec(xml)) !== null) {
      const url = match[1];
      // Only include post URLs (contain /p/)
      if (url.includes('/p/') && !url.includes('/archive') && !url.includes('/about')) {
        urls.push(url);
      }
    }

    console.log(`✅  Found ${urls.length} posts in sitemap`);
    return urls;
  } catch (err) {
    console.error(`⚠️  Could not fetch sitemap: ${err.message}`);
    return [];
  }
}

/**
 * Fetch RSS feed for a specific post URL
 */
async function fetchPostFromUrl(url) {
  try {
    // Substack provides individual post feeds at the post URL + /feed
    const response = await fetch(url);
    const html = await response.text();
    const root = parseHtml(html);

    // Extract metadata from the HTML page
    const title = root.querySelector('meta[property="og:title"]')?.getAttribute('content') || '';
    const description = root.querySelector('meta[property="og:description"]')?.getAttribute('content') || '';
    const image = root.querySelector('meta[property="og:image"]')?.getAttribute('content') || null;
    const pubDate = root.querySelector('meta[property="article:published_time"]')?.getAttribute('content') || new Date().toISOString();
    const author = root.querySelector('meta[property="article:author"]')?.getAttribute('content') || siteConfig.site.author;

    // Extract main content
    const contentDiv = root.querySelector('.available-content') || root.querySelector('article') || root.querySelector('.post');
    const contentHtml = contentDiv ? contentDiv.innerHTML : '';
    const contentSnippet = stripHtml(description || contentHtml).slice(0, 280);

    return {
      title,
      contentSnippet,
      link: url,
      isoDate: pubDate,
      pubDate: pubDate,
      creator: author,
      contentEncoded: contentHtml,
      content: contentHtml,
      categories: [], // We'll classify by content instead
    };
  } catch (err) {
    console.error(`⚠️  Could not fetch ${url}: ${err.message}`);
    return null;
  }
}

async function sync() {
  console.log(`📡  Fetching feed: ${siteConfig.site.rssFeed}`);

  let feed;
  try {
    feed = await parser.parseURL(siteConfig.site.rssFeed);
  } catch (err) {
    console.error(`❌  Failed to fetch feed: ${err.message}`);
    process.exit(1);
  }

  console.log(`✅  Got ${feed.items.length} items from RSS feed.`);

  // Fetch all post URLs from sitemap to get complete list
  const allPostUrls = await fetchAllPostUrls();

  // Get URLs that aren't in the RSS feed
  const rssUrls = new Set(feed.items.map(item => item.link));
  const missingUrls = allPostUrls.filter(url => !rssUrls.has(url));

  if (missingUrls.length > 0) {
    console.log(`📡  Fetching ${missingUrls.length} additional posts from sitemap...`);

    for (const url of missingUrls) {
      const post = await fetchPostFromUrl(url);
      if (post) {
        feed.items.push(post);
      }
      // Small delay to avoid hammering the server
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`✅  Total items after sitemap fetch: ${feed.items.length}`);
  }

  const posts = feed.items.map((item) => {
    const rawTitle = item.title || "Untitled";
    const slug = makeSlug(rawTitle, item.guid);
    const override = loadOverride(slug);

    const contentHtml = item.contentEncoded || item.content || "";
    const heroImage = extractHeroImage(contentHtml);
    const excerpt = stripHtml(item.contentSnippet || contentHtml).slice(0, 280);
    const topic = classifyTopic(item);

    // Merge order: RSS data → override (override wins for every defined field).
    return {
      // Core identity
      slug: override.slug || slug,
      originalSlug: slug, // kept for reference

      // Content
      title: override.title || rawTitle,
      seoTitle: override.seoTitle || override.title || rawTitle,
      subtitle: override.subtitle || item.subtitle || "",
      excerpt: override.excerpt || excerpt,
      metaDescription:
        override.metaDescription ||
        override.excerpt ||
        excerpt.slice(0, 160),
      bodyHtml: override.bodyHtml || contentHtml,
      introSummary: override.introSummary || "", // optional manual intro
      faq: override.faq || null, // [{q, a}] for FAQ schema

      // Media
      featuredImage: override.featuredImage || heroImage,

      // URLs / canonical
      substackUrl: item.link,
      canonicalMode: override.canonicalMode || siteConfig.canonicalDefault,
      // resolved canonical URL is computed at render time so the config
      // value of site.url is always fresh

      // Taxonomy
      topic: override.topic || topic,
      tags: override.tags || item.categories || [],
      series: override.series || null,

      // Dates
      publishedAt: item.isoDate || item.pubDate,
      modifiedAt: override.modifiedAt || item.isoDate || item.pubDate,

      // Author
      author: override.author || item.creator || siteConfig.site.author,

      // Flags
      noindex: override.noindex === true,
      featured: override.featured === true,
      evergreen: override.evergreen === true,

      // Manual related-post slugs. If empty, related posts are auto-computed.
      relatedSlugs: override.relatedSlugs || [],
    };
  });

  // Apply config-level featured/evergreen flags too
  for (const post of posts) {
    if (siteConfig.featuredSlugs.includes(post.slug)) post.featured = true;
    if (siteConfig.evergreenSlugs.includes(post.slug)) post.evergreen = true;
  }

  fs.writeFileSync(POSTS_FILE, JSON.stringify(posts, null, 2));
  console.log(`💾  Wrote ${posts.length} posts to data/posts.json`);

  // Quick stats
  const byTopic = posts.reduce((acc, p) => {
    acc[p.topic] = (acc[p.topic] || 0) + 1;
    return acc;
  }, {});
  console.log("📊  Topic breakdown:");
  Object.entries(byTopic).forEach(([t, n]) => console.log(`    ${t}: ${n}`));
}

sync().catch((err) => {
  console.error(err);
  process.exit(1);
});
