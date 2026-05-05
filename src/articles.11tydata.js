/**
 * articles.11tydata.js
 *
 * Companion data file for articles.njk. Eleventy auto-loads this for the
 * matching template. Function-based `eleventyComputed` runs in plain JS
 * and returns raw strings — no template-engine HTML-escaping, so titles
 * with apostrophes ("Coogler's") render cleanly.
 *
 * Why not put this in front matter? Front-matter computed values pass
 * through the Nunjucks engine, which HTML-escapes the result. The base
 * layout then escapes again, double-encoding apostrophes. JS computed
 * values bypass that pipeline.
 */

const siteConfig = require("../site.config.js");

module.exports = {
  eleventyComputed: {
    pageTitle: (data) => {
      const post = data.post;
      if (!post) return "";
      return post.seoTitle || post.title || "";
    },

    pageDescription: (data) => {
      return (data.post && data.post.metaDescription) || "";
    },

    ogImage: (data) => {
      return (data.post && data.post.featuredImage) || "";
    },

    ogType: () => "article",

    noindex: (data) => {
      const post = data.post;
      if (!post) return false;
      return post.canonicalMode === "noindex" || post.noindex === true;
    },

    canonicalUrl: (data) => {
      const post = data.post;
      if (!post) return "";
      if (post.canonicalMode === "substack") return post.substackUrl;
      if (post.canonicalMode === "mirror") {
        return `${siteConfig.site.url}/articles/${post.slug}/`;
      }
      return ""; // noindex case — no canonical needed
    },

    topicName: (data) => {
      const post = data.post;
      if (!post) return "";
      const topic = siteConfig.topics.find((t) => t.slug === post.topic);
      return topic ? topic.name : "";
    },
  },
};
