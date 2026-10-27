import axios from 'axios';
import { config } from '../../config/env.js';
import { isGeminiConfigured } from '../gemini.service.js';

/**
 * Clean article title by stripping source suffixes (e.g., "- OnlineKhabar", "| BBC News")
 */
export const cleanArticleTitle = (title = '') => {
  return title
    .replace(/\s*[-–—|]\s*(Online\s*Khabar|BBC|CNN|Reuters|Kantipur|Setopati|RatoPati|The\s*Himalayan).*$/i, '')
    .trim();
};

/**
 * Clean article description into a concise, readable summary snippet (stripping datelines)
 */
export const cleanArticleSummary = (text = '', maxLength = 240) => {
  if (!text) return '';
  // Remove news agency datelines like "९ कात्तिक, काठमाडौं ।", "काठमाडौं ।", "Kathmandu (RSS) - "
  const stripped = text
    .replace(/^[^।\n\.\-–—]*[।\.\-–—]\s*/, '')
    .replace(/^काठमाडौ[ँं]\s*[।,]\s*/, '')
    .trim();

  const source = stripped.length >= 25 ? stripped : text.trim();
  if (source.length <= maxLength) return source;

  const sentenceEnd = source.slice(0, maxLength).lastIndexOf('।');
  if (sentenceEnd > 40) return source.slice(0, sentenceEnd + 1);

  const dotEnd = source.slice(0, maxLength).lastIndexOf('.');
  if (dotEnd > 40) return source.slice(0, dotEnd + 1);

  return `${source.slice(0, maxLength).trim()}...`;
};

/**
 * Generate deterministic, human-friendly summary posts WITHOUT any links
 */
export const generateDeterministicVariations = (article) => {
  const title = cleanArticleTitle(article.title || 'Breaking News');
  const summary = cleanArticleSummary(article.content || article.description || '');
  const isNepali = /[\u0900-\u097F]/.test(title);

  if (isNepali) {
    return [
      {
        id: 'story_summary',
        label: 'Story Summary',
        description: 'Complete news summary in 2 sentences (no links)',
        text: summary ? `${title}।\n\n${summary}` : `${title}।`
      },
      {
        id: 'conversational',
        label: 'Conversational Take',
        description: 'Engaging, human-friendly question with key details',
        text: summary
          ? `यसबारे तपाईँको धारणा के छ?\n\n${title}। ${summary}`
          : `यसबारे तपाईँको धारणा के छ?\n\n${title}।`
      },
      {
        id: 'bullet_highlights',
        label: 'Key Bullet Highlights',
        description: 'Headline and core takeaway points',
        text: summary
          ? `📌 मुख्य विवरण:\n• ${title}\n• ${summary}`
          : `📌 मुख्य खबर:\n• ${title}`
      }
    ];
  }

  return [
    {
      id: 'story_summary',
      label: 'Story Summary',
      description: 'Digestible news summary in 2 sentences (no links)',
      text: summary ? `${title}.\n\n${summary}` : `${title}.`
    },
    {
      id: 'conversational',
      label: 'Conversational Take',
      description: 'Engaging question inviting audience discussion',
      text: summary
        ? `What are your thoughts on this?\n\n${title}. ${summary}`
        : `What are your thoughts on this?\n\n${title}.`
    },
    {
      id: 'bullet_highlights',
      label: 'Key Bullet Highlights',
      description: 'Clean headline and takeaway bullets',
      text: summary
        ? `📌 Key Takeaways:\n• ${title}\n• ${summary}`
        : `📌 Key Update:\n• ${title}`
    }
  ];
};

/**
 * Polish article headline and content into a human-friendly, link-free Facebook summary post
 */
export const polishArticleCaption = async ({ article, instructions = '' }) => {
  const imageUrl = article.imageUrl || '';

  if (!isGeminiConfigured()) {
    throw Object.assign(
      new Error('GEMINI_API_KEY is not configured on the server. Add it to server/.env to generate news summaries.'),
      { statusCode: 503 }
    );
  }

  const title = cleanArticleTitle(article.title || '');
  const content = (article.content || article.description || '').slice(0, 800);

  const prompt = [
    'You are an authentic, engaging Facebook page manager writing a post based on a news story.',
    'CRITICAL RULES:',
    '1. DO NOT include any URLs, links, or website addresses.',
    '2. DO NOT sound like an automated RSS feed or robot. Sound like a knowledgeable human sharing an interesting story.',
    '3. Create a complete, standalone post that gives readers the essential story directly on Facebook without having to visit any link.',
    '4. Keep it concise, engaging, and easy to read (2 to 4 sentences max).',
    '5. Match the language of the news article (if Nepali, write in natural, fluent Nepali; if English, write in fluent English).',
    instructions ? `User instruction: ${instructions}` : '',
    'Return JSON with a "variations" array containing exactly 3 options:',
    '1. "story_summary": Clean, punchy 2-3 sentence narrative summary of what happened.',
    '2. "conversational": Engaging question + key summary inviting reactions.',
    '3. "bullet_highlights": Main headline + 2 quick bullet points of the details.',
    '',
    `Headline: ${title}`,
    `News Story Content: ${content}`
  ].filter(Boolean).join('\n');

  try {
    const endpoint = `${config.gemini.baseUrl}/models/${config.gemini.model}:generateContent`;
    const response = await axios.post(
      endpoint,
      {
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.65,
          responseMimeType: 'application/json'
        }
      },
      {
        timeout: 15000,
        params: { key: config.gemini.apiKey },
        headers: { 'Content-Type': 'application/json' }
      }
    );

    const rawText = response.data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('\n') || '';
    const parsed = JSON.parse(rawText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/, '').trim());

    if (!Array.isArray(parsed.variations) || parsed.variations.length === 0) {
      throw new Error('Gemini returned no caption variations');
    }

    const formatted = parsed.variations.map((v, i) => {
      let text = typeof v === 'string' ? v : (v.text || v.caption || '');
      text = text.replace(/https?:\/\/[^\s]+/gi, '').trim();
      return {
        id: v.type || `ai_variation_${i + 1}`,
        label: v.label || (i === 0 ? 'Story Summary' : i === 1 ? 'Conversational Take' : 'Key Highlights'),
        description: v.description || 'AI generated link-free human summary',
        text
      };
    });

    return {
      source: 'gemini_ai',
      imageUrl,
      variations: formatted
    };
  } catch (error) {
    console.warn('[Polisher] Gemini request failed:', error.message);
    throw Object.assign(
      new Error(error.response?.data?.error?.message || error.message || 'Gemini request failed'),
      { statusCode: error.response?.status || error.statusCode || 502 }
    );
  }
};
