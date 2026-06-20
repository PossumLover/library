module.exports = function (eleventyConfig) {
  // Ignore generated/tool files
  eleventyConfig.ignores.add("content/sam-kriss/index.md");
  eleventyConfig.ignores.add("tools/**");
  eleventyConfig.ignores.add("scripts/**");
  eleventyConfig.ignores.add("node_modules/**");

  // Copy images to /images/ at the root of the built site
  eleventyConfig.addPassthroughCopy({ "content/sam-kriss/images": "images" });
  // Copy public/ assets (CSS etc.) to site root
  eleventyConfig.addPassthroughCopy({ "public": "." });

  // Filters
  eleventyConfig.addFilter("readableDate", (date) =>
    new Date(date).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    })
  );

  eleventyConfig.addFilter("htmlDateString", (date) =>
    new Date(date).toISOString().split("T")[0]
  );

  eleventyConfig.addFilter("year", (date) =>
    new Date(date).getUTCFullYear()
  );

  // All posts, newest first
  eleventyConfig.addCollection("posts", (api) =>
    api
      .getFilteredByGlob("content/sam-kriss/[0-9]*.md")
      .sort((a, b) => b.date - a.date)
  );

  // Posts grouped by year for the index page
  eleventyConfig.addCollection("postsByYear", (api) => {
    const posts = api
      .getFilteredByGlob("content/sam-kriss/[0-9]*.md")
      .sort((a, b) => b.date - a.date);

    const byYear = {};
    for (const post of posts) {
      const yr = new Date(post.date).getUTCFullYear();
      if (!byYear[yr]) byYear[yr] = [];
      byYear[yr].push(post);
    }

    return Object.entries(byYear)
      .sort(([a], [b]) => Number(b) - Number(a))
      .map(([year, posts]) => ({ year: Number(year), posts }));
  });

  return {
    templateFormats: ["njk", "md", "html"],
    // Don't pre-process markdown through Nunjucks — the content has raw
    // Substack markdown with curly braces that would confuse the template engine
    markdownTemplateEngine: false,
    dir: {
      input: ".",
      output: "_site",
      includes: "_includes",
      data: "_data",
    },
  };
};
