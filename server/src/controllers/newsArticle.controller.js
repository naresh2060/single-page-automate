import mongoose from 'mongoose';
import { NewsArticle } from '../models/NewsArticle.js';
import { NewsPost } from '../models/NewsPost.js';
import { ScheduledPost } from '../models/ScheduledPost.js';
import { Post } from '../models/Post.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { getConfiguredPageId, config } from '../config/env.js';
import { facebookService } from '../services/facebook.service.js';
import { polishArticleCaption } from '../services/news/polisher.service.js';
import { assertSafePublicUrl } from '../utils/ssrf.js';

const resolveArticleMediaUrl = async (article, requestedMediaUrl) => {
  const mediaUrl = typeof requestedMediaUrl === 'string' ? requestedMediaUrl.trim() : '';
  if (!mediaUrl) {
    return article.imageUrl || '';
  }

  const safeUrl = await assertSafePublicUrl(mediaUrl);
  if (article.imageUrl !== safeUrl.href) {
    article.imageUrl = safeUrl.href;
    await article.save();
  }
  return safeUrl.href;
};

export const listNewsArticles = async (req, res, next) => {
  try {
    const filter = { pageId: getConfiguredPageId() };
    if (req.query.sourceId && mongoose.Types.ObjectId.isValid(req.query.sourceId)) {
      filter.sourceId = req.query.sourceId;
    }
    if (req.query.status) {
      filter.processingStatus = req.query.status;
    }

    const articles = await NewsArticle.find(filter)
      .select('-content')
      .populate('sourceId', 'name feedUrl')
      .sort({ discoveredAt: -1 })
      .limit(100);

    return sendSuccess(res, articles, 'News articles retrieved');
  } catch (error) {
    next(error);
  }
};

export const getNewsArticle = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return sendError(res, 'Invalid identifier', 400);
    }

    const article = await NewsArticle.findOne({
      _id: req.params.id,
      pageId: getConfiguredPageId()
    }).populate('sourceId', 'name feedUrl websiteUrl');

    if (!article) {
      return sendError(res, 'News article not found', 404);
    }

    const post = await NewsPost.findOne({ articleId: article._id });
    return sendSuccess(res, { article, post }, 'News article retrieved');
  } catch (error) {
    next(error);
  }
};

import { fetchPublicResource } from '../utils/httpFetch.js';
import { extractFromHtml } from '../services/news/articleExtract.service.js';

export const polishNewsArticle = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return sendError(res, 'Invalid identifier', 400);
    }

    const article = await NewsArticle.findOne({
      _id: req.params.id,
      pageId: getConfiguredPageId()
    });

    if (!article) {
      return sendError(res, 'News article not found', 404);
    }

    // Auto-resolve image if not already cached
    if (!article.imageUrl && article.canonicalUrl) {
      try {
        const { body, finalUrl } = await fetchPublicResource(article.canonicalUrl, {
          accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.5'
        });
        const { imageUrl } = extractFromHtml(body, finalUrl);
        if (imageUrl) {
          article.imageUrl = imageUrl;
          await article.save();
        }
      } catch {
        // ignore
      }
    }

    const result = await polishArticleCaption({
      article,
      instructions: req.body?.instructions || ''
    });

    return sendSuccess(res, { ...result, imageUrl: article.imageUrl || '' }, 'Polished captions generated');
  } catch (error) {
    next(error);
  }
};

export const manualPublishNewsArticle = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return sendError(res, 'Invalid identifier', 400);
    }

    const { caption, mediaUrl, scheduledFor } = req.body;
    if (!caption || !caption.trim()) {
      return sendError(res, 'Post caption cannot be empty', 400);
    }

    const article = await NewsArticle.findOne({
      _id: req.params.id,
      pageId: getConfiguredPageId()
    }).populate('sourceId', 'name');

    if (!article) {
      return sendError(res, 'News article not found', 404);
    }

    const cleanCaption = caption.trim();
    const resolvedMediaUrl = await resolveArticleMediaUrl(article, mediaUrl);
    if (!resolvedMediaUrl) {
      return sendError(res, 'The original news image could not be found. This post cannot be published without it.', 400);
    }

    // Handle scheduling
    if (scheduledFor) {
      const scheduledDate = new Date(scheduledFor);
      if (Number.isNaN(scheduledDate.getTime()) || scheduledDate <= new Date()) {
        return sendError(res, 'Scheduled time must be a valid future date/time', 400);
      }

      const scheduled = await ScheduledPost.create({
        pageId: getConfiguredPageId(),
        message: cleanCaption,
        mediaUrl: resolvedMediaUrl || '',
        requireMedia: true,
        linkUrl: '',
        scheduledFor: scheduledDate,
        status: 'pending',
        aiGenerated: true,
        tags: ['news', article.sourceName || 'article']
      });

      let newsPost = await NewsPost.findOne({ articleId: article._id });
      if (!newsPost) {
        newsPost = new NewsPost({
          pageId: getConfiguredPageId(),
          articleId: article._id,
          sourceId: article.sourceId?._id || article.sourceId,
          sourceUrl: article.canonicalUrl,
          headline: article.title.slice(0, 100),
          caption: cleanCaption,
          summary: cleanCaption,
          captionEdited: true,
          approvalStatus: 'approved',
          approvedAt: new Date(),
          publishingStatus: 'scheduled'
        });
      } else {
        newsPost.caption = cleanCaption;
        newsPost.captionEdited = true;
        newsPost.approvalStatus = 'approved';
        newsPost.approvedAt = new Date();
        newsPost.publishingStatus = 'scheduled';
      }
      await newsPost.save();

      article.processingStatus = 'scheduled';
      await article.save();

      return sendSuccess(res, { scheduled, newsPost }, 'Post scheduled successfully for ' + scheduledDate.toLocaleString(), 201);
    }

    // Publish the summary as a native photo post without attaching the source link.
    const fbResult = await facebookService.createPost({
      message: cleanCaption,
      mediaUrl: resolvedMediaUrl,
      requireMedia: true
    });

    // Save record to Post collection
    try {
      await Post.create({
        fbPostId: fbResult.id,
        pageId: config.facebook.pageId || 'demo_page_id',
        message: cleanCaption,
        mediaUrl: resolvedMediaUrl || '',
        permalinkUrl: fbResult.permalinkUrl,
        source: 'manual',
        publishedAt: new Date()
      });
    } catch {
      // ignore duplicate
    }

    // Update or create NewsPost
    let newsPost = await NewsPost.findOne({ articleId: article._id });
    if (!newsPost) {
      newsPost = new NewsPost({
        pageId: getConfiguredPageId(),
        articleId: article._id,
        sourceId: article.sourceId?._id || article.sourceId,
        sourceUrl: article.canonicalUrl,
        headline: article.title.slice(0, 100),
        caption: cleanCaption,
        summary: cleanCaption,
        captionEdited: true,
        approvalStatus: 'approved',
        approvedAt: new Date(),
        publishingStatus: 'published',
        publishedAt: new Date(),
        fbPostId: fbResult.id
      });
    } else {
      newsPost.caption = cleanCaption;
      newsPost.captionEdited = true;
      newsPost.approvalStatus = 'approved';
      newsPost.approvedAt = new Date();
      newsPost.publishingStatus = 'published';
      newsPost.publishedAt = new Date();
      newsPost.fbPostId = fbResult.id;
    }
    await newsPost.save();

    article.processingStatus = 'published';
    await article.save();

    return sendSuccess(res, {
      fbPostId: fbResult.id,
      permalinkUrl: fbResult.permalinkUrl,
      isLive: fbResult.isLive,
      newsPost
    }, 'Post published successfully to Facebook Page', 200);
  } catch (error) {
    next(error);
  }
};

export const manualDraftNewsArticle = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return sendError(res, 'Invalid identifier', 400);
    }

    const { caption, mediaUrl } = req.body;
    if (!caption || !caption.trim()) {
      return sendError(res, 'Post caption cannot be empty', 400);
    }

    const article = await NewsArticle.findOne({
      _id: req.params.id,
      pageId: getConfiguredPageId()
    });

    if (!article) {
      return sendError(res, 'News article not found', 404);
    }

    await resolveArticleMediaUrl(article, mediaUrl);

    const cleanCaption = caption.trim();
    let newsPost = await NewsPost.findOne({ articleId: article._id });
    if (!newsPost) {
      newsPost = new NewsPost({
        pageId: getConfiguredPageId(),
        articleId: article._id,
        sourceId: article.sourceId?._id || article.sourceId,
        sourceUrl: article.canonicalUrl,
        headline: article.title.slice(0, 100),
        caption: cleanCaption,
        summary: cleanCaption,
        captionEdited: true,
        approvalStatus: 'approved',
        publishingStatus: 'draft'
      });
    } else {
      newsPost.caption = cleanCaption;
      newsPost.captionEdited = true;
      newsPost.approvalStatus = 'approved';
      newsPost.publishingStatus = 'draft';
    }
    await newsPost.save();

    article.processingStatus = 'generated';
    await article.save();

    return sendSuccess(res, newsPost, 'Draft saved to Generated Posts', 200);
  } catch (error) {
    next(error);
  }
};
