import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeArticleUrl } from '../src/utils/urlNormalize.js';

describe('normalizeArticleUrl', () => {
  it('strips tracking parameters and trailing slashes', () => {
    const result = normalizeArticleUrl(
      'https://News.Example.com/world/story/?utm_source=rss&utm_medium=feed&fbclid=abc#section'
    );
    assert.equal(result, 'https://news.example.com/world/story');
  });

  it('keeps meaningful query parameters', () => {
    const result = normalizeArticleUrl('https://example.com/article?id=42&ref=home');
    assert.equal(result, 'https://example.com/article?id=42');
  });

  it('treats the same article URL as identical after normalization', () => {
    const a = normalizeArticleUrl('https://example.com/a?utm_campaign=x');
    const b = normalizeArticleUrl('https://example.com/a/');
    assert.equal(a, b);
  });
});
