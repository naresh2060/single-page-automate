import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import Parser from 'rss-parser';
import { extractFromHtml } from '../src/services/news/articleExtract.service.js';
import { createContentFingerprint } from '../src/utils/fingerprint.js';

describe('RSS parsing and extraction', () => {
  it('parses RSS items from a feed string', async () => {
    const xml = `<?xml version="1.0"?>
      <rss version="2.0">
        <channel>
          <title>Example News</title>
          <item>
            <title>First Story</title>
            <link>https://example.com/first</link>
            <pubDate>Mon, 01 Jan 2024 12:00:00 GMT</pubDate>
            <description>A short excerpt</description>
          </item>
        </channel>
      </rss>`;

    const parser = new Parser();
    const feed = await parser.parseString(xml);
    assert.equal(feed.items.length, 1);
    assert.equal(feed.items[0].title, 'First Story');
    assert.equal(feed.items[0].link, 'https://example.com/first');
  });

  it('extracts article text and drops navigation noise', () => {
    const html = `
      <html>
        <body>
          <nav>Home About Ads</nav>
          <article>
            <h1>Useful title</h1>
            <p>${'Meaningful paragraph about the event. '.repeat(20)}</p>
          </article>
          <footer>Cookie notice subscribe</footer>
        </body>
      </html>
    `;
    const result = extractFromHtml(html);
    assert.match(result.content, /Meaningful paragraph/);
    assert.doesNotMatch(result.content, /Cookie notice/);
  });

  it('resolves relative article image URLs against the final page URL', () => {
    const result = extractFromHtml(
      '<html><head><meta property="og:image" content="/images/story.jpg"></head><body></body></html>',
      'https://example.com/news/story'
    );
    assert.equal(result.imageUrl, 'https://example.com/images/story.jpg');
  });

  it('flags incomplete HTML as too short for a full extraction', () => {
    const result = extractFromHtml('<html><body><p>Hi</p></body></html>');
    assert.ok(result.content.length < 80);
  });

  it('creates stable fingerprints for the same article identity', () => {
    const a = createContentFingerprint({
      normalizedUrl: 'https://example.com/a',
      title: 'Hello',
      excerpt: 'World'
    });
    const b = createContentFingerprint({
      normalizedUrl: 'https://example.com/a',
      title: 'hello',
      excerpt: 'World'
    });
    assert.equal(a, b);
  });
});
