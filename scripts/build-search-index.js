#!/usr/bin/env node
/**
 * build-search-index.js — Generate a lightweight JSON search index.
 *
 * Output: public/search-index.json
 *
 * Format is just an array of {slug, title, excerpt, topic, year, url}.
 * The client-side search loads this and does substring matching.
 * For 600+ posts this stays under ~200KB. If you outgrow that, swap in
 * Lunr or MiniSearch and rebuild this file accordingly.
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const POSTS_FILE = path.join(ROOT, "data", "posts.json");
const OUTPUT = path.join(ROOT, "public", "search-index.json");

if (!fs.existsSync(POSTS_FILE)) {
  console.error("❌  data/posts.json not found. Run `npm run sync` first.");
  process.exit(1);
}

const posts = JSON.parse(fs.readFileSync(POSTS_FILE, "utf-8"));

const index = posts
  .filter((p) => !p.noindex)
  .map((p) => ({
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt,
    topic: p.topic,
    tags: p.tags,
    year: new Date(p.publishedAt).getFullYear(),
    url: `/articles/${p.slug}/`,
  }));

if (!fs.existsSync(path.dirname(OUTPUT))) {
  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
}

fs.writeFileSync(OUTPUT, JSON.stringify(index));
const sizeKb = (fs.statSync(OUTPUT).size / 1024).toFixed(1);
console.log(`🔎  Wrote search index with ${index.length} posts (${sizeKb} KB)`);
