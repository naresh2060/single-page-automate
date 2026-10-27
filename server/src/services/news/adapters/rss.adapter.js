import Parser from 'rss-parser';
import * as cheerio from 'cheerio';
import { fetchPublicResource } from '../../../utils/httpFetch.js';
import { normalizeArticleUrl } from '../../../utils/urlNormalize.js';

const parser = new Parser({
  timeout: 10000,
  headers: {
    'User-Agent': 'MetaSyncNewsMonitor/1.0'
  }
});

function findFeedLinkInHtml(html, baseUrl) {
  try {
    const $ = cheerio.load(html);
    const link = $('link[type="application/rss+xml"], link[type="application/atom+xml"], link[type="application/xml"]').first();
    const href = link.attr('href');
    if (href) {
      return new URL(href, baseUrl).href;
    }
  } catch {
    // ignore
  }
  return null;
}

export const rssAdapter = {
  type: 'rss',

  async discover(source) {
    const targetUrl = source.feedUrl;
    let { body, finalUrl } = await fetchPublicResource(targetUrl, {
      accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml, text/html;q=0.9, */*;q=0.5'
    });

    let feed = null;
    let usedUrl = finalUrl;

    try {
      feed = await parser.parseString(body);
    } catch (parseError) {
      // Check if body is HTML and attempt RSS autodiscovery
      const isHtml = typeof body === 'string' && (body.includes('<html') || body.includes('<!DOCTYPE') || body.includes('<head'));
      if (isHtml) {
        const discoveredUrl = findFeedLinkInHtml(body, finalUrl) || `${new URL(finalUrl).origin}/feed`;
        if (discoveredUrl && discoveredUrl !== targetUrl) {
          try {
            const feedRes = await fetchPublicResource(discoveredUrl, {
              accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*;q=0.5'
            });
            feed = await parser.parseString(feedRes.body);
            usedUrl = feedRes.finalUrl;
          } catch {
            // discovery attempt failed
          }
        }
      }

      if (!feed) {
        const error = new Error(
          `Feed not recognized. The URL "${source.feedUrl}" returned an HTML webpage instead of an RSS/Atom XML feed. For OnlineKhabar, please use the direct feed URL: https://www.onlinekhabar.com/feed (or https://english.onlinekhabar.com/feed).`
        );
        error.statusCode = 400;
        throw error;
      }
    }

    const items = feed.items || [];

    return items
      .map((item) => {
        const rawLink = item.link || item.guid || item.id;
        if (!rawLink) return null;

        let normalizedUrl;
        try {
          normalizedUrl = normalizeArticleUrl(rawLink);
        } catch {
          return null;
        }

        const publishedAt = item.isoDate || item.pubDate ? new Date(item.isoDate || item.pubDate) : null;
        const rawContent = (item['content:encoded'] || item.content || '').toString();
        const imgMatch = rawContent.match(/<img[^>]+src=["']([^"']+)["']/i);
        const rawImageUrl =
          item.enclosure?.url ||
          item['media:content']?.url ||
          item['media:content']?.['$']?.url ||
          item['media:thumbnail']?.url ||
          (imgMatch ? imgMatch[1] : '');
        let imageUrl = '';
        if (rawImageUrl) {
          try {
            const parsedImageUrl = new URL(rawImageUrl, normalizedUrl);
            if (['http:', 'https:'].includes(parsedImageUrl.protocol)) {
              imageUrl = parsedImageUrl.href;
            }
          } catch {
            imageUrl = '';
          }
        }

        return {
          title: (item.title || 'Untitled article').trim(),
          canonicalUrl: normalizedUrl,
          normalizedUrl,
          imageUrl: imageUrl || '',
          publishedAt: publishedAt && !Number.isNaN(publishedAt.getTime()) ? publishedAt : null,
          author: item.creator || item.author || '',
          description: (item.contentSnippet || item.summary || item.content || '').toString().slice(0, 2000),
          feedContent: rawContent,
          feedUrlUsed: usedUrl
        };
      })
      .filter(Boolean);
  }
};
