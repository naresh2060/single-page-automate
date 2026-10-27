import { NewsSource } from '../../models/NewsSource.js';
import { NewsArticle } from '../../models/NewsArticle.js';
import { NewsPost } from '../../models/NewsPost.js';
import { config, getConfiguredPageId } from '../../config/env.js';
import { createContentFingerprint } from '../../utils/fingerprint.js';
import { getSourceAdapter } from './adapters/index.js';
import { extractArticleContent } from './articleExtract.service.js';
import { generateNewsCaption } from '../gemini.service.js';
import { facebookService } from '../facebook.service.js';

const isDuplicateKey = (error) => error?.code === 11000;

const acquireSourceLock = async (sourceId) => {
  const now = new Date();
  return NewsSource.findOneAndUpdate(
    {
      _id: sourceId,
      $or: [{ checkLockUntil: null }, { checkLockUntil: { $lte: now } }]
    },
    {
      $set: {
        checkLockUntil: new Date(now.getTime() + config.news.lockMinutes * 60 * 1000),
        lastCheckedAt: now
      }
    },
    { new: true }
  );
};

const releaseSourceLock = async (sourceId, extra = {}) => {
  await NewsSource.findByIdAndUpdate(sourceId, {
    $set: {
      checkLockUntil: null,
      ...extra
    }
  });
};

export const upsertDiscoveredArticles = async (source, discovered) => {
  const pageId = source.pageId;
  const created = [];
  let duplicateCount = 0;

  for (const item of discovered) {
    const fingerprint = createContentFingerprint({
      normalizedUrl: item.normalizedUrl,
      title: item.title,
      excerpt: item.description
    });

    try {
      const article = await NewsArticle.create({
        pageId,
        sourceId: source._id,
        title: item.title,
        canonicalUrl: item.canonicalUrl,
        normalizedUrl: item.normalizedUrl,
        imageUrl: item.imageUrl || '',
        publishedAt: item.publishedAt,
        author: item.author,
        sourceName: source.name,
        description: item.description,
        content: '',
        contentFingerprint: fingerprint,
        extractionStatus: 'pending',
        processingStatus: 'discovered'
      });
      created.push({ article, feedContent: item.feedContent || '' });
    } catch (error) {
      if (isDuplicateKey(error)) {
        duplicateCount += 1;
        continue;
      }
      throw error;
    }
  }

  return { created, duplicateCount };
};

export const processArticle = async (article, source, { feedContent = '', allowOverwriteCaption = false } = {}) => {
  const claimed = await NewsArticle.findOneAndUpdate(
    {
      _id: article._id,
      processingStatus: { $in: ['discovered', 'extracted', 'failed'] },
      $or: [{ autoPublishLockUntil: null }, { autoPublishLockUntil: { $lte: new Date() } }]
    },
    { $set: { processingStatus: 'extracting', lastError: null } },
    { new: true }
  );

  if (!claimed) {
    return { skipped: true, reason: 'already_in_progress' };
  }

  const extracted = await extractArticleContent({
    canonicalUrl: claimed.canonicalUrl,
    description: claimed.description,
    feedContent,
    excerptOnly: source.excerptOnly,
    initialImageUrl: claimed.imageUrl || ''
  });

  claimed.content = extracted.content;
  if (extracted.imageUrl) {
    claimed.imageUrl = extracted.imageUrl;
  }
  claimed.extractionStatus = extracted.extractionStatus;
  claimed.processingStatus = extracted.extractionStatus === 'failed' ? 'failed' : 'extracted';
  claimed.lastError = extracted.extractError || null;
  await claimed.save();

  if (claimed.extractionStatus === 'failed' || !claimed.content) {
    claimed.processingStatus = 'failed';
    claimed.lastError = claimed.lastError || 'Article content was empty or inaccessible';
    await claimed.save();
    return { article: claimed, post: null };
  }

  const generating = await NewsArticle.findOneAndUpdate(
    { _id: claimed._id, processingStatus: 'extracted' },
    { $set: { processingStatus: 'generating' } },
    { new: true }
  );

  if (!generating) {
    return { skipped: true, reason: 'generation_locked' };
  }

  let generated;
  try {
    generated = await generateNewsCaption({ article: generating, source });
  } catch (error) {
    generating.processingStatus = 'failed';
    generating.lastError = error.message;
    await generating.save();
    throw error;
  }

  if (generating.extractionStatus === 'excerpt_only') {
    generated.needsReview = true;
    generated.reviewReason = generated.reviewReason || 'Only an excerpt was available; review before publishing.';
  }

  let post;
  try {
    post = await NewsPost.create({
      pageId: generating.pageId,
      articleId: generating._id,
      sourceId: source._id,
      headline: generated.headline,
      caption: generated.caption,
      summary: generated.summary,
      sourceUrl: generated.sourceUrl,
      hashtags: generated.hashtags,
      needsReview: generated.needsReview,
      reviewReason: generated.reviewReason,
      approvalStatus: 'pending',
      publishingStatus: 'draft'
    });
  } catch (error) {
    if (!isDuplicateKey(error)) {
      throw error;
    }
    post = await NewsPost.findOne({ articleId: generating._id });
    if (post && !post.captionEdited && allowOverwriteCaption && post.publishingStatus === 'draft') {
      post.headline = generated.headline;
      post.caption = generated.caption;
      post.summary = generated.summary;
      post.hashtags = generated.hashtags;
      post.needsReview = generated.needsReview;
      post.reviewReason = generated.reviewReason;
      await post.save();
    }
  }

  generating.processingStatus = 'generated';
  generating.lastError = null;
  await generating.save();

  return { article: generating, post };
};

export const checkNewsSource = async (sourceId, { force = false } = {}) => {
  const source = await NewsSource.findById(sourceId);
  if (!source) {
    throw Object.assign(new Error('News source not found'), { statusCode: 404 });
  }

  if (!force && !source.isActive) {
    throw Object.assign(new Error('News source is disabled'), { statusCode: 400 });
  }

  const locked = await acquireSourceLock(source._id);
  if (!locked) {
    return { source, skipped: true, reason: 'check_already_running' };
  }

  try {
    const adapter = getSourceAdapter(source.sourceType);
    const discovered = await adapter.discover(source);
    const { created, duplicateCount } = await upsertDiscoveredArticles(source, discovered);

    const processed = [];
    const errors = [];
    const batch = created.slice(0, config.news.maxArticlesPerCheck);

    for (const item of batch) {
      try {
        const result = await processArticle(item.article, source, { feedContent: item.feedContent });
        processed.push(result);
      } catch (error) {
        errors.push({ articleId: item.article._id, message: error.message });
      }
    }

    await releaseSourceLock(source._id, {
      lastSuccessfulCheckAt: new Date(),
      lastError: errors.length ? `${errors.length} article(s) failed during processing` : null
    });

    return {
      source: await NewsSource.findById(source._id),
      discovered: discovered.length,
      created: created.length,
      duplicates: duplicateCount,
      processed: processed.length,
      errors
    };
  } catch (error) {
    await releaseSourceLock(source._id, { lastError: error.message });
    throw error;
  }
};

const isRetryablePublishError = (error) => {
  const code = error.code || error.cause?.code;
  return ['ECONNABORTED', 'ETIMEDOUT', 'ECONNRESET'].includes(code);
};

export const publishNewsPost = async (postId, { auto = false } = {}) => {
  const filter = {
    _id: postId,
    fbPostId: null,
    publishingStatus: { $in: ['draft', 'failed'] }
  };

  if (auto) {
    filter.approvalStatus = 'pending';
    filter.needsReview = false;
  } else {
    filter.approvalStatus = 'approved';
  }

  const claimed = await NewsPost.findOneAndUpdate(
    filter,
    {
      $set: {
        publishingStatus: 'publishing',
        lastError: null,
        ...(auto ? { approvalStatus: 'approved', approvedAt: new Date() } : {})
      },
      $inc: { publishAttempts: 1 }
    },
    { new: true }
  );

  if (!claimed) {
    const existing = await NewsPost.findById(postId);
    if (existing?.publishingStatus === 'published' || existing?.fbPostId) {
      throw Object.assign(new Error('This post has already been published'), { statusCode: 409 });
    }
    if (existing?.publishingStatus === 'publishing' || existing?.publishingStatus === 'uncertain') {
      throw Object.assign(
        new Error('A previous publish attempt is unresolved. Reconcile before retrying.'),
        { statusCode: 409 }
      );
    }
    if (existing && existing.approvalStatus !== 'approved' && !auto) {
      throw Object.assign(new Error('Post must be approved before publishing'), { statusCode: 400 });
    }
    throw Object.assign(new Error('Post is not eligible for publishing'), { statusCode: 400 });
  }

  try {
    const article = await NewsArticle.findById(claimed.articleId).select('imageUrl');
    if (!article?.imageUrl) {
      throw Object.assign(new Error('The original news image is missing; this post cannot be published.'), { statusCode: 400 });
    }

    const fbRes = await facebookService.createPost({
      message: claimed.caption,
      mediaUrl: article.imageUrl,
      requireMedia: true
    });

    claimed.publishingStatus = 'published';
    claimed.fbPostId = fbRes.id;
    claimed.publishedAt = new Date();
    claimed.lastError = null;
    await claimed.save();
    return claimed;
  } catch (error) {
    if (isRetryablePublishError(error)) {
      claimed.publishingStatus = 'uncertain';
      claimed.lastError = 'Publish result is uncertain because the Facebook request timed out. Do not retry until you confirm the Page feed.';
      await claimed.save();
      throw Object.assign(new Error(claimed.lastError), { statusCode: 504 });
    }

    claimed.publishingStatus = 'failed';
    claimed.lastError = error.message;
    if (auto) {
      claimed.approvalStatus = 'pending';
      claimed.approvedAt = null;
    }
    await claimed.save();
    throw error;
  }
};

export const getDueSources = async () => {
  const pageId = getConfiguredPageId();
  const sources = await NewsSource.find({ pageId, isActive: true });
  const now = Date.now();

  return sources.filter((source) => {
    if (source.checkLockUntil && source.checkLockUntil.getTime() > now) {
      return false;
    }
    if (!source.lastCheckedAt) {
      return true;
    }
    return now - source.lastCheckedAt.getTime() >= source.intervalMinutes * 60 * 1000;
  });
};
