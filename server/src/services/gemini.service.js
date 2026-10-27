import axios from 'axios';
import { config } from '../config/env.js';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const wordCount = (text = '') => text.trim().split(/\s+/).filter(Boolean).length;

export const isGeminiConfigured = () => Boolean(config.gemini.apiKey);

export const validateGeneratedPost = (payload, { sourceUrl = '', captionMinWords = 15, captionMaxWords = 120, includeLink = false }) => {
  if (!payload || typeof payload !== 'object') {
    throw Object.assign(new Error('Gemini returned empty output'), { statusCode: 502 });
  }

  let caption = typeof payload.caption === 'string' ? payload.caption.trim() : '';
  const summary = typeof payload.summary === 'string' ? payload.summary.trim() : '';
  const headline = typeof payload.headline === 'string' ? payload.headline.trim() : '';
  const hashtags = Array.isArray(payload.hashtags)
    ? payload.hashtags.filter((tag) => typeof tag === 'string').map((tag) => tag.replace(/^#/, '').trim()).filter(Boolean).slice(0, 6)
    : [];

  if (!caption || caption.length < 15) {
    throw Object.assign(new Error('Generated caption is missing or too short'), { statusCode: 502 });
  }

  if (includeLink && sourceUrl) {
    if (!caption.includes(sourceUrl) && !`${payload.sourceUrl || ''}`.includes(sourceUrl)) {
      caption = `${caption}\n\n${sourceUrl}`;
    }
  } else {
    // Strip any URLs that might have leaked in from the model
    caption = caption.replace(/https?:\/\/[^\s]+/gi, '').trim();
  }

  const words = wordCount(caption);
  const needsReview = Boolean(payload.needsReview) || words < captionMinWords * 0.4 || words > captionMaxWords * 2.5;

  return {
    headline: headline || caption.slice(0, 80),
    caption,
    summary: summary || caption,
    sourceUrl,
    hashtags,
    needsReview,
    reviewReason: payload.reviewReason || (needsReview ? 'Caption length or completeness needs review' : null)
  };
};

const parseJsonPayload = (rawText) => {
  if (!rawText) {
    throw new Error('Gemini returned no text');
  }

  const stripped = rawText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/, '').trim();
  const start = stripped.indexOf('{');
  const end = stripped.lastIndexOf('}');
  if (start === -1 || end === -1) {
    throw new Error('Gemini output was not JSON');
  }

  return JSON.parse(stripped.slice(start, end + 1));
};

export const generateNewsCaption = async ({ article, source }) => {
  if (!isGeminiConfigured()) {
    throw Object.assign(
      new Error('GEMINI_API_KEY is not configured on the server. Please add GEMINI_API_KEY to server/.env.'),
      { statusCode: 503 }
    );
  }

  const prefs = source?.generation || {};
  const captionMinWords = prefs.captionMinWords || 25;
  const captionMaxWords = prefs.captionMaxWords || 90;
  const incomplete = article.extractionStatus !== 'complete';

  const prompt = [
    'You are an authentic, engaging Facebook copywriter creating a post for a page.',
    'CRITICAL RULES:',
    '1. STRICTLY DO NOT include any links, URLs, or website addresses.',
    '2. Write in SIMPLE, CLEAR, and ENGAGING language in summary form so readers understand what happened directly on Facebook.',
    '3. Match the language of the news article (if Nepali, write in natural, simple Nepali; if English, write in simple English).',
    '4. Combine the headline and content into a cohesive, readable story summary (about 2 to 4 sentences).',
    '5. Sound like an authentic human sharing an interesting update, not an automated robot or marketing agency.',
    '6. Return JSON with keys: headline, caption, summary, hashtags, needsReview, reviewReason.',
    incomplete ? 'Note: The extracted article is an excerpt. Summarize what is available concisely.' : '',
    '',
    `Headline: ${article.title}`,
    `News Story Details: ${article.content || article.description || article.title}`
  ].filter(Boolean).join('\n');

  const endpoint = `${config.gemini.baseUrl}/models/${config.gemini.model}:generateContent`;
  let lastError;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await axios.post(
        endpoint,
        {
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.4,
            responseMimeType: 'application/json'
          }
        },
        {
          timeout: 20000,
          params: { key: config.gemini.apiKey },
          headers: { 'Content-Type': 'application/json' }
        }
      );

      const rawText = response.data?.candidates?.[0]?.content?.parts?.map((part) => part.text).join('\n') || '';
      const parsed = parseJsonPayload(rawText);
      return validateGeneratedPost(parsed, {
        sourceUrl: article.canonicalUrl,
        captionMinWords,
        captionMaxWords
      });
    } catch (error) {
      lastError = error;
      const status = error.response?.status;
      if (status === 429 || status === 503 || error.code === 'ECONNABORTED') {
        await sleep(750 * (attempt + 1));
        continue;
      }
      const message = error.response?.data?.error?.message || error.message || 'Gemini request failed';
      throw Object.assign(new Error(message), { statusCode: status || 502 });
    }
  }

  throw Object.assign(new Error(lastError?.message || 'Gemini request failed after retries'), { statusCode: 502 });
};
