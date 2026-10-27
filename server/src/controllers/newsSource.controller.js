import mongoose from 'mongoose';
import { NewsSource } from '../models/NewsSource.js';
import { NewsArticle } from '../models/NewsArticle.js';
import { NewsPost } from '../models/NewsPost.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { config, getConfiguredPageId } from '../config/env.js';
import { assertSafePublicUrl } from '../utils/ssrf.js';
import { getSourceAdapter } from '../services/news/adapters/index.js';
import { checkNewsSource } from '../services/news/pipeline.service.js';

const ALLOWED_TONES = ['Informative', 'Professional', 'Casual', 'Engaging', 'Promotional'];

const parseObjectId = (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error('Invalid identifier');
    error.statusCode = 400;
    throw error;
  }
  return id;
};

const sanitizeGeneration = (input = {}) => ({
  language: (input.language || 'English').toString().slice(0, 40),
  tone: ALLOWED_TONES.includes(input.tone) ? input.tone : 'Informative',
  captionMinWords: Math.min(120, Math.max(20, Number(input.captionMinWords) || 40)),
  captionMaxWords: Math.min(200, Math.max(30, Number(input.captionMaxWords) || 80)),
  emojiUsage: ['none', 'sparse', 'moderate'].includes(input.emojiUsage) ? input.emojiUsage : 'sparse',
  hashtagUsage: ['none', 'sparse', 'moderate'].includes(input.hashtagUsage) ? input.hashtagUsage : 'sparse',
  targetAudience: (input.targetAudience || 'general readers').toString().slice(0, 120),
  attributionFormat: (input.attributionFormat || 'Source: {source} — {url}').toString().slice(0, 160)
});

const buildSourcePayload = async (body) => {
  const name = body.name?.trim();
  const websiteUrl = body.websiteUrl?.trim();
  const feedUrl = body.feedUrl?.trim();

  if (!name || !websiteUrl || !feedUrl) {
    throw Object.assign(new Error('name, websiteUrl, and feedUrl are required'), { statusCode: 400 });
  }

  await assertSafePublicUrl(websiteUrl);
  await assertSafePublicUrl(feedUrl);

  const intervalMinutes = Number(body.intervalMinutes ?? config.news.defaultIntervalMinutes);
  if (
    Number.isNaN(intervalMinutes) ||
    intervalMinutes < config.news.minIntervalMinutes ||
    intervalMinutes > config.news.maxIntervalMinutes
  ) {
    throw Object.assign(
      new Error(`intervalMinutes must be between ${config.news.minIntervalMinutes} and ${config.news.maxIntervalMinutes}`),
      { statusCode: 400 }
    );
  }

  return {
    pageId: getConfiguredPageId(),
    name,
    websiteUrl,
    feedUrl,
    sourceType: ['rss', 'atom'].includes(body.sourceType) ? body.sourceType : 'rss',
    isActive: body.isActive !== false,
    intervalMinutes,
    autoPublish: Boolean(body.autoPublish),
    excerptOnly: Boolean(body.excerptOnly),
    generation: sanitizeGeneration(body.generation)
  };
};

export const createNewsSource = async (req, res, next) => {
  try {
    const payload = await buildSourcePayload(req.body);
    const source = await NewsSource.create(payload);
    return sendSuccess(res, source, 'News source created', 201);
  } catch (error) {
    if (error.code === 11000) {
      return sendError(res, 'A source with this feed URL already exists', 409);
    }
    next(error);
  }
};

export const listNewsSources = async (req, res, next) => {
  try {
    const sources = await NewsSource.find({ pageId: getConfiguredPageId() }).sort({ createdAt: -1 });
    return sendSuccess(res, sources, 'News sources retrieved');
  } catch (error) {
    next(error);
  }
};

export const getNewsSource = async (req, res, next) => {
  try {
    const source = await NewsSource.findOne({
      _id: parseObjectId(req.params.id),
      pageId: getConfiguredPageId()
    });
    if (!source) {
      return sendError(res, 'News source not found', 404);
    }
    return sendSuccess(res, source, 'News source retrieved');
  } catch (error) {
    next(error);
  }
};

export const updateNewsSource = async (req, res, next) => {
  try {
    const existing = await NewsSource.findOne({
      _id: parseObjectId(req.params.id),
      pageId: getConfiguredPageId()
    });
    if (!existing) {
      return sendError(res, 'News source not found', 404);
    }

    const merged = {
      name: req.body.name ?? existing.name,
      websiteUrl: req.body.websiteUrl ?? existing.websiteUrl,
      feedUrl: req.body.feedUrl ?? existing.feedUrl,
      sourceType: req.body.sourceType ?? existing.sourceType,
      isActive: req.body.isActive ?? existing.isActive,
      intervalMinutes: req.body.intervalMinutes ?? existing.intervalMinutes,
      autoPublish: req.body.autoPublish ?? existing.autoPublish,
      excerptOnly: req.body.excerptOnly ?? existing.excerptOnly,
      generation: { ...existing.generation.toObject?.() || existing.generation, ...(req.body.generation || {}) }
    };

    const payload = await buildSourcePayload(merged);
    Object.assign(existing, payload);
    await existing.save();
    return sendSuccess(res, existing, 'News source updated');
  } catch (error) {
    next(error);
  }
};

export const deleteNewsSource = async (req, res, next) => {
  try {
    const source = await NewsSource.findOneAndDelete({
      _id: parseObjectId(req.params.id),
      pageId: getConfiguredPageId()
    });
    if (!source) {
      return sendError(res, 'News source not found', 404);
    }
    await NewsPost.deleteMany({ sourceId: source._id });
    await NewsArticle.deleteMany({ sourceId: source._id });
    return sendSuccess(res, { id: source._id }, 'News source deleted');
  } catch (error) {
    next(error);
  }
};

export const testNewsSourceFeed = async (req, res, next) => {
  try {
    const source = await NewsSource.findOne({
      _id: parseObjectId(req.params.id),
      pageId: getConfiguredPageId()
    });
    if (!source) {
      return sendError(res, 'News source not found', 404);
    }

    const adapter = getSourceAdapter(source.sourceType);
    const items = await adapter.discover(source);
    return sendSuccess(res, {
      itemCount: items.length,
      preview: items.slice(0, 5).map((item) => ({
        title: item.title,
        url: item.canonicalUrl,
        publishedAt: item.publishedAt
      }))
    }, 'Feed test completed');
  } catch (error) {
    next(error);
  }
};

export const runNewsSourceCheck = async (req, res, next) => {
  try {
    const source = await NewsSource.findOne({
      _id: parseObjectId(req.params.id),
      pageId: getConfiguredPageId()
    });
    if (!source) {
      return sendError(res, 'News source not found', 404);
    }

    const result = await checkNewsSource(source._id, { force: true });
    return sendSuccess(res, result, result.skipped ? 'Check skipped because another run is in progress' : 'Source check completed');
  } catch (error) {
    next(error);
  }
};
