import * as cheerio from 'cheerio';
import { config } from '../../config/env.js';
import { fetchPublicResource } from '../../utils/httpFetch.js';

const NOISE_SELECTORS = [
  'script',
  'style',
  'noscript',
  'iframe',
  'nav',
  'footer',
  'header',
  'form',
  'aside',
  '[role="navigation"]',
  '[role="banner"]',
  '[role="contentinfo"]',
  '.advertisement',
  '.ads',
  '.ad',
  '.cookie',
  '.newsletter',
  '.related',
  '.recommended',
  '.share',
  '.social',
  '.comments'
];

const cleanText = (value = '') =>
  value
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();

export const extractFromHtml = (html, baseUrl) => {
  const $ = cheerio.load(html);
  NOISE_SELECTORS.forEach((selector) => $(selector).remove());

  const candidates = [
    $('article').text(),
    $('[role="main"]').text(),
    $('main').text(),
    $('.post-content').text(),
    $('.entry-content').text(),
    $('#content').text()
  ].map(cleanText);

  const bodyText = candidates.find((text) => text.length > 200) || cleanText($('p').map((_, el) => $(el).text()).get().join('\n\n'));
  const title = cleanText($('meta[property="og:title"]').attr('content') || $('title').first().text());
  const description = cleanText(
    $('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content') || ''
  );
  const rawImageUrl = cleanText(
    $('meta[property="og:image"]').attr('content') ||
    $('meta[name="twitter:image"]').attr('content') ||
    $('meta[property="og:image:url"]').attr('content') ||
    $('article img').first().attr('src') ||
    ''
  );
  let imageUrl = rawImageUrl;
  if (rawImageUrl && baseUrl) {
    try {
      const parsedImageUrl = new URL(rawImageUrl, baseUrl);
      imageUrl = ['http:', 'https:'].includes(parsedImageUrl.protocol) ? parsedImageUrl.href : '';
    } catch {
      imageUrl = '';
    }
  }

  const limited = bodyText.slice(0, config.news.maxArticleChars);
  return { title, description, content: limited, imageUrl };
};

export const extractArticleContent = async ({ canonicalUrl, description = '', feedContent = '', excerptOnly = false, initialImageUrl = '' }) => {
  const feedText = cleanText(cheerio.load(feedContent || '').text() || description);

  if (excerptOnly) {
    return {
      content: feedText.slice(0, config.news.maxArticleChars),
      extractionStatus: feedText.length >= 80 ? 'excerpt_only' : 'failed',
      usedPageFetch: false,
      imageUrl: initialImageUrl || ''
    };
  }

  try {
    const { body, contentType, finalUrl } = await fetchPublicResource(canonicalUrl, {
      accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.5'
    });

    if (!/html|xml|text\//i.test(contentType || 'text/html')) {
      return {
        content: feedText.slice(0, config.news.maxArticleChars),
        extractionStatus: feedText.length >= 80 ? 'excerpt_only' : 'failed',
        usedPageFetch: false,
        imageUrl: initialImageUrl || ''
      };
    }

    const extracted = extractFromHtml(body, finalUrl);
    const content = extracted.content || feedText;
    const resolvedImageUrl = extracted.imageUrl || initialImageUrl || '';

    if (!content || content.length < 80) {
      return {
        content: (content || feedText).slice(0, config.news.maxArticleChars),
        extractionStatus: 'excerpt_only',
        usedPageFetch: true,
        imageUrl: resolvedImageUrl
      };
    }

    return {
      content: content.slice(0, config.news.maxArticleChars),
      extractionStatus: content.length < 280 ? 'excerpt_only' : 'complete',
      usedPageFetch: true,
      imageUrl: resolvedImageUrl
    };
  } catch (error) {
    if (feedText.length >= 80) {
      return {
        content: feedText.slice(0, config.news.maxArticleChars),
        extractionStatus: 'excerpt_only',
        usedPageFetch: false,
        extractError: error.message
      };
    }

    return {
      content: '',
      extractionStatus: 'failed',
      usedPageFetch: false,
      extractError: error.message
    };
  }
};
