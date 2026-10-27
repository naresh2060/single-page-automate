import mongoose from 'mongoose';
import { NewsPost } from '../models/NewsPost.js';
import { NewsArticle } from '../models/NewsArticle.js';
import { NewsSource } from '../models/NewsSource.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { getConfiguredPageId } from '../config/env.js';
import { generateNewsCaption } from '../services/gemini.service.js';
import { publishNewsPost } from '../services/news/pipeline.service.js';

const ownedPost = (id) =>
  NewsPost.findOne({ _id: id, pageId: getConfiguredPageId() })
    .populate('articleId', 'title canonicalUrl extractionStatus publishedAt')
    .populate('sourceId', 'name autoPublish');

export const listNewsPosts = async (req, res, next) => {
  try {
    const filter = { pageId: getConfiguredPageId() };
    if (req.query.approvalStatus) filter.approvalStatus = req.query.approvalStatus;
    if (req.query.publishingStatus) filter.publishingStatus = req.query.publishingStatus;

    const posts = await NewsPost.find(filter)
      .populate('articleId', 'title canonicalUrl extractionStatus publishedAt')
      .populate('sourceId', 'name autoPublish')
      .sort({ createdAt: -1 })
      .limit(100);

    return sendSuccess(res, posts, 'News posts retrieved');
  } catch (error) {
    next(error);
  }
};

export const getNewsPost = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return sendError(res, 'Invalid identifier', 400);
    }
    const post = await ownedPost(req.params.id);
    if (!post) {
      return sendError(res, 'News post not found', 404);
    }
    return sendSuccess(res, post, 'News post retrieved');
  } catch (error) {
    next(error);
  }
};

export const updateNewsPost = async (req, res, next) => {
  try {
    const post = await NewsPost.findOne({ _id: req.params.id, pageId: getConfiguredPageId() });
    if (!post) {
      return sendError(res, 'News post not found', 404);
    }
    if (post.publishingStatus === 'published') {
      return sendError(res, 'Published posts cannot be edited', 400);
    }

    if (typeof req.body.caption === 'string' && req.body.caption.trim()) {
      post.caption = req.body.caption.trim();
      post.captionEdited = true;
    }

    await post.save();
    return sendSuccess(res, post, 'News post updated');
  } catch (error) {
    next(error);
  }
};

export const regenerateNewsPost = async (req, res, next) => {
  try {
    const post = await NewsPost.findOne({ _id: req.params.id, pageId: getConfiguredPageId() });
    if (!post) {
      return sendError(res, 'News post not found', 404);
    }
    if (post.publishingStatus === 'published') {
      return sendError(res, 'Published posts cannot be regenerated', 400);
    }

    const article = await NewsArticle.findById(post.articleId);
    const source = await NewsSource.findById(post.sourceId);
    const generated = await generateNewsCaption({ article, source });

    post.headline = generated.headline;
    post.caption = generated.caption;
    post.summary = generated.summary;
    post.hashtags = generated.hashtags;
    post.needsReview = generated.needsReview;
    post.reviewReason = generated.reviewReason;
    post.captionEdited = false;
    post.approvalStatus = 'pending';
    post.publishingStatus = 'draft';
    post.lastError = null;
    await post.save();

    return sendSuccess(res, post, 'Caption regenerated');
  } catch (error) {
    next(error);
  }
};

export const approveNewsPost = async (req, res, next) => {
  try {
    const post = await NewsPost.findOne({ _id: req.params.id, pageId: getConfiguredPageId() });
    if (!post) {
      return sendError(res, 'News post not found', 404);
    }
    if (post.publishingStatus === 'published') {
      return sendError(res, 'Post is already published', 409);
    }

    post.approvalStatus = 'approved';
    post.approvedAt = new Date();
    await post.save();
    return sendSuccess(res, post, 'News post approved');
  } catch (error) {
    next(error);
  }
};

export const rejectNewsPost = async (req, res, next) => {
  try {
    const post = await NewsPost.findOne({ _id: req.params.id, pageId: getConfiguredPageId() });
    if (!post) {
      return sendError(res, 'News post not found', 404);
    }
    if (post.publishingStatus === 'published') {
      return sendError(res, 'Published posts cannot be rejected', 400);
    }

    post.approvalStatus = 'rejected';
    post.publishingStatus = 'draft';
    post.lastError = req.body?.reason || 'Rejected by operator';
    await post.save();
    return sendSuccess(res, post, 'News post rejected');
  } catch (error) {
    next(error);
  }
};

export const publishApprovedNewsPost = async (req, res, next) => {
  try {
    const post = await NewsPost.findOne({ _id: req.params.id, pageId: getConfiguredPageId() });
    if (!post) {
      return sendError(res, 'News post not found', 404);
    }
    const published = await publishNewsPost(post._id, { auto: false });
    return sendSuccess(res, published, 'News post published to Facebook');
  } catch (error) {
    next(error);
  }
};

export const getNewsHistory = async (req, res, next) => {
  try {
    const pageId = getConfiguredPageId();
    const [articleCount, generatedCount, publishedCount, failedPosts, latestSource] = await Promise.all([
      NewsArticle.countDocuments({ pageId }),
      NewsPost.countDocuments({ pageId }),
      NewsPost.countDocuments({ pageId, publishingStatus: 'published' }),
      NewsPost.find({ pageId, publishingStatus: { $in: ['failed', 'uncertain'] } })
        .sort({ updatedAt: -1 })
        .limit(10)
        .populate('articleId', 'title canonicalUrl')
        .populate('sourceId', 'name'),
      NewsSource.find({ pageId }).sort({ lastCheckedAt: -1 }).limit(1)
    ]);

    return sendSuccess(res, {
      articlesDiscovered: articleCount,
      postsGenerated: generatedCount,
      postsPublished: publishedCount,
      failedJobs: failedPosts,
      lastRun: latestSource[0]?.lastCheckedAt || null,
      lastSuccessfulRun: latestSource[0]?.lastSuccessfulCheckAt || null,
      lastSourceError: latestSource[0]?.lastError || null
    }, 'News automation history retrieved');
  } catch (error) {
    next(error);
  }
};
