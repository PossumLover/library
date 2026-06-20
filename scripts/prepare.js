#!/usr/bin/env node
// One-time script: add YAML frontmatter to downloaded Sam Kriss articles
// and fix relative image paths to absolute paths for the site build.

const fs = require('fs');
const path = require('path');

const CONTENT_DIR = path.join(__dirname, '..', 'content', 'sam-kriss');

const files = fs.readdirSync(CONTENT_DIR)
  .filter(f => /^\d{8}_\d{6}_.*\.md$/.test(f))
  .sort();

let added = 0, skipped = 0;

for (const file of files) {
  const filepath = path.join(CONTENT_DIR, file);
  let content = fs.readFileSync(filepath, 'utf-8');

  if (content.startsWith('---\n')) {
    skipped++;
    continue;
  }

  // Parse date and slug from filename: YYYYMMDD_HHMMSS_slug.md
  const fnMatch = file.match(/^(\d{4})(\d{2})(\d{2})_\d{6}_(.+)\.md$/);
  if (!fnMatch) continue;
  const [, year, month, day, slug] = fnMatch;
  const date = `${year}-${month}-${day}`;

  // Extract title from the first # heading
  const titleMatch = content.match(/^#\s+(.+)$/m);
  const rawTitle = titleMatch ? titleMatch[1].trim() : slug.replace(/-/g, ' ');
  const title = rawTitle.replace(/\\/g, '\\\\').replace(/"/g, '\\"');

  // Remove the first # heading from the body (it's shown in the template header)
  content = content.replace(/^#\s+.+\n(\n)?/, '');

  // Fix relative image paths → absolute so they work at any URL depth
  content = content.replace(/\(images\//g, '(/images/');

  const frontmatter = `---
title: "${title}"
date: ${date}
slug: ${slug}
layout: post.njk
permalink: /posts/${slug}/
---

`;

  fs.writeFileSync(filepath, frontmatter + content);
  added++;
  console.log(`✓ ${file}`);
}

console.log(`\nDone: ${added} files processed, ${skipped} skipped (already had frontmatter).`);
