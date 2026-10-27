import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { validateGeneratedPost } from '../src/services/gemini.service.js';

describe('validateGeneratedPost', () => {
  it('accepts structured output and strips any URLs by default', () => {
    const result = validateGeneratedPost(
      {
        headline: 'City council vote',
        caption: 'City leaders approved a transit budget after a lengthy public hearing. https://news.example.com/transit',
        summary: 'A transit budget passed.',
        hashtags: ['Transit'],
        needsReview: false,
        reviewReason: null
      },
      {
        sourceUrl: 'https://news.example.com/transit',
        captionMinWords: 10,
        captionMaxWords: 80
      }
    );

    assert.ok(!result.caption.includes('https://'), 'Must not contain external link');
    assert.equal(result.hashtags[0], 'Transit');
    assert.equal(result.headline, 'City council vote');
  });

  it('rejects too short captions', () => {
    assert.throws(
      () =>
        validateGeneratedPost(
          { caption: 'short', summary: '', hashtags: [] },
          { sourceUrl: 'https://example.com/a', captionMinWords: 40, captionMaxWords: 80 }
        ),
      /too short/i
    );
  });

  it('allows includeLink when explicitly set to true', () => {
    const result = validateGeneratedPost(
      {
        headline: 'News update',
        caption: 'This is a complete news report summary for testing purposes.',
        summary: 'Summary text.',
        hashtags: []
      },
      {
        sourceUrl: 'https://example.com/story',
        includeLink: true,
        captionMinWords: 5,
        captionMaxWords: 50
      }
    );

    assert.ok(result.caption.includes('https://example.com/story'));
  });
});
