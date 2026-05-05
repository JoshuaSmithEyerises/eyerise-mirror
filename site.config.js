/**
 * SITE CONFIG — edit this file to control site-wide behavior.
 * Every other file reads from here. No magic strings scattered around.
 */
module.exports = {
  // Branding
  site: {
    name: "EyeRise",
    tagline: "Cultural criticism, film, and the politics of attention.",
    description:
      "Essays on race, culture, film, AI, and the systems shaping public life — by Joshua Smith.",
    author: "Joshua Smith",
    authorUrl: "https://eyerise.substack.com/",
    // The URL where THIS mirror is deployed. Used for canonical, sitemap, OG tags.
    url: "https://eyerisesubstack.netlify.app",
    // The original Substack URL. Used as default canonical target.
    substackUrl: "https://eyerise.substack.com",
    rssFeed: "https://eyerise.substack.com/feed",
    locale: "en_US",
    twitterHandle: "@joshuasmith",
  },

  // CANONICAL STRATEGY — the most important SEO setting in the project.
  //
  // "substack"  → tells Google the Substack post is the source of truth.
  //               SAFE DEFAULT. Mirror won't rank, but it won't hurt Substack either.
  // "mirror"    → tells Google THIS site is the source of truth.
  //               Only use this if you've added meaningful original content
  //               (expanded intros, FAQ sections, deeper analysis) to the override file.
  //               Otherwise Google sees thin duplication and demotes both pages.
  // "noindex"   → mirror exists but isn't indexed. Use for staging or private archives.
  //
  // You can override this PER POST in /overrides/{slug}.json with the "canonicalMode" field.
  canonicalDefault: "substack",

  // Topic taxonomy. Editable. Each topic gets a hub page at /topics/{slug}/
  // The "match" array is checked against the post's RSS categories AND title/body keywords.
  // First match wins. Posts with no match land in "Personal / essays".
  topics: [
    {
      slug: "ai-and-labor",
      name: "AI and Labor",
      intro:
        "How automation, language models, and algorithmic management are reshaping who gets paid for thinking, writing, and creating.",
      match: ["ai", "artificial intelligence", "automation", "llm", "openai", "labor", "workers"],
    },
    {
      slug: "race-and-culture",
      name: "Race and Culture",
      intro:
        "Essays on Blackness, identity, representation, and the cultural infrastructures that decide whose stories get told.",
      match: ["race", "black", "blackness", "racism", "culture", "identity", "diaspora"],
    },
    {
      slug: "film-and-television",
      name: "Film and Television",
      intro:
        "Criticism of the moving image — what gets greenlit, what gets ignored, and what the industry's choices reveal about us.",
      match: ["film", "movie", "cinema", "oscar", "director", "tv", "television", "sinners", "spike lee"],
    },
    {
      slug: "religion-and-public-life",
      name: "Religion and Public Life",
      intro:
        "Where faith, power, and the public square meet — and how religious narratives shape policy, media, and identity.",
      match: ["religion", "faith", "christianity", "islam", "church", "spiritual"],
    },
    {
      slug: "surveillance-and-media-power",
      name: "Surveillance and Media Power",
      intro:
        "On the technologies of watching — and the institutions that decide which lives get scrutinized and which get protected.",
      match: ["surveillance", "privacy", "facial recognition", "media", "platform", "censorship"],
    },
    {
      slug: "sports-and-politics",
      name: "Sports and Politics",
      intro:
        "Stadiums are not neutral. Essays on what athletes, leagues, and fans reveal about the larger fight over public space.",
      match: ["sport", "nfl", "nba", "nhl", "athlete", "super bowl", "olympics"],
    },
    {
      slug: "personal-and-essays",
      name: "Personal / Essays / Books",
      intro:
        "Reflections, reading notes, and longer-form essays that don't fit a single category.",
      match: [], // fallback bucket — leave match empty
    },
  ],

  // Pages flagged as "evergreen" can opt into FAQ schema via their override file.
  // This is just the default. Per-post override wins.
  faqEnabledByDefault: false,

  // How many related posts to show on each article page.
  relatedPostsCount: 3,

  // How many posts to show on the homepage.
  homepageRecentCount: 6,

  // Featured essays — list of slugs. Edit by hand.
  // These show in the homepage hero. If a slug doesn't exist yet (post hasn't synced),
  // it's silently skipped.
  featuredSlugs: [],

  // Most Popular / Start Here — list of slugs for your most popular essays.
  // These show on the /start-here/ page.
  popularSlugs: [
    // Add your most popular post slugs here, e.g.:
    // "christianity-is-a-costume-in-america",
    // "who-controls-what-you-know-trump",
  ],

  // Evergreen / Start Here — list of slugs (deprecated, use popularSlugs instead).
  evergreenSlugs: [],
};
