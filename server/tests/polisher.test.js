import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { config } from '../src/config/env.js';
import {
  cleanArticleTitle,
  cleanArticleSummary,
  generateDeterministicVariations,
  polishArticleCaption
} from '../src/services/news/polisher.service.js';

describe('Human-friendly low-text polisher', () => {
  it('strips news agency suffixes from article titles', () => {
    assert.equal(
      cleanArticleTitle('Nepal Tourism Surges in 2026 - OnlineKhabar'),
      'Nepal Tourism Surges in 2026'
    );
    assert.equal(
      cleanArticleTitle('Tech Innovation in Asia | BBC News'),
      'Tech Innovation in Asia'
    );
  });

  it('strips datelines from news summaries', () => {
    const raw = '९ कात्तिक, काठमाडौं । शिक्षा तथा खेलकुद मन्त्रीले एनपीएलको प्रशंसा गरेका छन्।';
    const cleaned = cleanArticleSummary(raw);
    assert.ok(!cleaned.includes('काठमाडौं ।'));
    assert.ok(cleaned.includes('शिक्षा तथा खेलकुद'));
  });

  it('generates 3 link-free summary variations from headline and content', () => {
    const article = {
      title: 'Exciting Football League Announced',
      canonicalUrl: 'https://example.com/sports/league',
      description: 'The tournament will kick off next month with 8 international teams.'
    };

    const variations = generateDeterministicVariations(article);
    assert.equal(variations.length, 3);
    for (const v of variations) {
      assert.ok(!v.text.includes('https://'), 'Must not contain external links');
      assert.ok(v.text.includes('Exciting Football League Announced'));
      assert.ok(v.text.length < 350, 'Must remain low text summary');
    }
  });

  it('detects Nepali script and generates natural Nepali link-free summary', () => {
    const article = {
      title: 'नेपालको खेल पर्यटन र पहिचान बढाउन एनपीएल बलियो आधार',
      canonicalUrl: 'https://www.onlinekhabar.com/sports/npl',
      description: '९ कात्तिक, काठमाडौं । मन्त्री पोखरेलले एनपीएलले खेल पर्यटनलाई नयाँ उचाइ दिने बताएका छन्।'
    };

    const variations = generateDeterministicVariations(article);
    assert.equal(variations.length, 3);
    assert.ok(!variations[0].text.includes('https://'), 'Must not contain external link');
    assert.ok(variations[0].text.includes('नेपालको खेल पर्यटन'));
    assert.ok(variations[0].text.includes('मन्त्री पोखरेलले'));
  });

  it('requires Gemini configuration instead of returning a template caption', async () => {
    const article = {
      title: 'Sample Article',
      description: 'This is a sample event description that summarizes the story.'
    };

    const originalApiKey = config.gemini.apiKey;
    config.gemini.apiKey = '';
    try {
      await assert.rejects(polishArticleCaption({ article }), /GEMINI_API_KEY is not configured/i);
    } finally {
      config.gemini.apiKey = originalApiKey;
    }
  });
});
