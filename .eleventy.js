const { DateTime } = require("luxon");
const siteConfig = require("./site.config.js");

module.exports = function (eleventyConfig) {
  // Pass through static assets unchanged.
  eleventyConfig.addPassthroughCopy("assets");
  eleventyConfig.addPassthroughCopy({ "content/robots.txt": "robots.txt" });

  // ---------- FILTERS ----------
  // Human-readable date: "October 14, 2025"
  eleventyConfig.addFilter("readableDate", (dateObj) => {
    if (!dateObj) return "";
    const dt =
      typeof dateObj === "string"
        ? DateTime.fromISO(dateObj)
        : DateTime.fromJSDate(new Date(dateObj));
    return dt.toFormat("LLLL d, yyyy");
  });

  // ISO 8601 date for <time> and structured data
  eleventyConfig.addFilter("isoDate", (dateObj) => {
    if (!dateObj) return "";
    const dt =
      typeof dateObj === "string"
        ? DateTime.fromISO(dateObj)
        : DateTime.fromJSDate(new Date(dateObj));
    return dt.toISO();
  });

  // Year only (used for archive filtering UI)
  eleventyConfig.addFilter("year", (dateObj) => {
    if (!dateObj) return "";
    const dt =
      typeof dateObj === "string"
        ? DateTime.fromISO(dateObj)
        : DateTime.fromJSDate(new Date(dateObj));
    return dt.year;
  });

  // Strip HTML for excerpts and meta descriptions
  eleventyConfig.addFilter("stripHtml", (str) => {
    if (!str) return "";
    return String(str)
      .replace(/<[^>]+>/g, "")
      .replace(/\s+/g, " ")
      .trim();
  });

  // Truncate to N chars, breaking on word boundary
  eleventyConfig.addFilter("truncate", (str, n = 160) => {
    if (!str) return "";
    const clean = String(str).replace(/\s+/g, " ").trim();
    if (clean.length <= n) return clean;
    return clean.slice(0, n).replace(/\s+\S*$/, "") + "…";
  });

  // JSON-stringify safely for embedding in HTML
  eleventyConfig.addFilter("jsonify", (obj) => {
    return JSON.stringify(obj).replace(/</g, "\\u003c");
  });

  // Absolute URL helper
  eleventyConfig.addFilter("absoluteUrl", (path) => {
    if (!path) return siteConfig.site.url;
    if (path.startsWith("http")) return path;
    return siteConfig.site.url.replace(/\/$/, "") + path;
  });

  // ---------- COLLECTIONS ----------
  // Build a "posts" collection from the JSON data file.
  // We do this in JS rather than using markdown files so the source of truth
  // stays in /data/posts.json (synced from RSS) plus /overrides/*.json.
  eleventyConfig.addCollection("posts", function () {
    const fs = require("fs");
    const path = require("path");
    const dataPath = path.join(__dirname, "data", "posts.json");
    if (!fs.existsSync(dataPath)) {
      console.warn(
        "⚠️  data/posts.json not found. Run `npm run sync` first."
      );
      return [];
    }
    const posts = JSON.parse(fs.readFileSync(dataPath, "utf-8"));
    // Sort newest first
    return posts.sort(
      (a, b) => new Date(b.publishedAt) - new Date(a.publishedAt)
    );
  });

  // Group posts by topic for hub pages
  eleventyConfig.addCollection("postsByTopic", function (collectionApi) {
    const fs = require("fs");
    const path = require("path");
    const dataPath = path.join(__dirname, "data", "posts.json");
    if (!fs.existsSync(dataPath)) return {};
    const posts = JSON.parse(fs.readFileSync(dataPath, "utf-8"));
    const grouped = {};
    for (const topic of siteConfig.topics) {
      // Filter posts by topic and sort by date (newest first)
      grouped[topic.slug] = posts
        .filter((p) => p.topic === topic.slug)
        .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
    }
    return grouped;
  });

  return {
    dir: {
      input: "src",
      output: "public",
      includes: "_includes",
      data: "_data",
    },
    templateFormats: ["njk", "md", "html"],
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk",
  };
};
