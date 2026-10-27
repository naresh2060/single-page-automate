import { getConfiguredPageId } from '../../config/env.js';
import { Post } from '../../models/Post.js';
import { NewsArticle } from '../../models/NewsArticle.js';
import { NewsPost } from '../../models/NewsPost.js';
import { NewsSource } from '../../models/NewsSource.js';
import { polishArticleCaption } from './polisher.service.js';
import { publishNewsPost } from './pipeline.service.js';

const AUTO_PUBLISH_LOCK_MS = 15 * 60 * 1000;

export const isPostIneligibleForAutoPublish = (post) =>
  Boolean(post && (
    ['scheduled', 'publishing', 'published', 'uncertain'].includes(post.publishingStatus) ||
    ['approved', 'rejected'].includes(post.approvalStatus) ||
    post.captionEdited ||
    post.needsReview
  ));

export const publishNextNewsArticle = async () => {
  const pageId = getConfiguredPageId();
  const sources = await NewsSource.find({
    pageId,
    isActive: true,
    autoPublish: true,
    excerptOnly: false
  }).select('_id');
  if (!sources.length) {
    return { published: false, reason: 'no_auto_publish_sources' };
  }

  const protectedArticleIds = await NewsPost.find({
    pageId,
    $or: [
      { publishingStatus: { $in: ['scheduled', 'publishing', 'published', 'uncertain'] } },
      { approvalStatus: { $in: ['approved', 'rejected'] } },
      { captionEdited: true },
      { needsReview: true }
    ]
  }).distinct('articleId');
  const now = new Date();

  const candidates = await NewsArticle.find({
    pageId,
    sourceId: { $in: sources.map((source) => source._id) },
    processingStatus: { $in: ['discovered', 'extracted', 'generated', 'failed'] },
    extractionStatus: { $ne: 'excerpt_only' },
    imageUrl: { $nin: ['', null] },
    $and: [
      { $or: [{ content: { $ne: '' } }, { description: { $ne: '' } }] },
      { $or: [{ autoPublishLockUntil: null }, { autoPublishLockUntil: { $lte: now } }] }
    ],
    ...(protectedArticleIds.length ? { _id: { $nin: protectedArticleIds } } : {})
  })
    .sort({ lastAutoPublishAttemptAt: 1, discoveredAt: 1 })
    .limit(50);

  for (const article of candidates) {
    let post = await NewsPost.findOne({ articleId: article._id });
    if (isPostIneligibleForAutoPublish(post)) {
      continue;
    }

    const claimed = await NewsArticle.findOneAndUpdate(
      {
        _id: article._id,
        processingStatus: article.processingStatus,
        lastAutoPublishAttemptAt: article.lastAutoPublishAttemptAt,
        $or: [{ autoPublishLockUntil: null }, { autoPublishLockUntil: { $lte: now } }]
      },
      {
        $set: {
          autoPublishLockUntil: new Date(now.getTime() + AUTO_PUBLISH_LOCK_MS),
          lastAutoPublishAttemptAt: new Date(),
          lastError: null
        }
      },
      { new: true }
    );

    if (!claimed) {
      continue;
    }

    let facebookPublished = false;
    try {
      const polished = await polishArticleCaption({ article: claimed });
      const caption = polished.variations?.[0]?.text?.trim();
      if (!caption) {
        throw new Error('The article polisher did not return a publishable caption.');
      }

      if (post) {
        const updatedPost = await NewsPost.findOneAndUpdate(
          {
            _id: post._id,
            publishingStatus: { $in: ['draft', 'failed'] },
            approvalStatus: 'pending',
            captionEdited: false,
            needsReview: false,
            fbPostId: null
          },
          {
            $set: {
              headline: claimed.title.slice(0, 100),
              caption,
              summary: caption,
              captionEdited: false,
              needsReview: false,
              reviewReason: null,
              publishingStatus: 'draft',
              lastError: null
            }
          },
          { new: true }
        );
        if (!updatedPost) {
          claimed.autoPublishLockUntil = null;
          await claimed.save();
          continue;
        }
        post = updatedPost;
      } else {
        post = await NewsPost.create({
          pageId,
          articleId: claimed._id,
          sourceId: claimed.sourceId,
          headline: claimed.title.slice(0, 100),
          caption,
          summary: caption,
          sourceUrl: claimed.canonicalUrl,
          approvalStatus: 'pending',
          publishingStatus: 'draft'
        });
      }

      const publishedPost = await publishNewsPost(post._id, { auto: true });
      facebookPublished = true;

      claimed.processingStatus = 'published';
      claimed.lastError = null;
      claimed.autoPublishLockUntil = null;
      await claimed.save();

      await Post.updateOne(
        { fbPostId: publishedPost.fbPostId },
        {
          $setOnInsert: {
            fbPostId: publishedPost.fbPostId,
            pageId,
            message: publishedPost.caption,
            mediaUrl: claimed.imageUrl,
            permalinkUrl: `https://facebook.com/${publishedPost.fbPostId}`,
            source: 'automation',
            publishedAt: publishedPost.publishedAt || new Date()
          }
        },
        { upsert: true }
      );

      return { published: true, articleId: claimed._id, postId: publishedPost.fbPostId };
    } catch (error) {
      if (facebookPublished) {
        claimed.processingStatus = 'published';
        claimed.lastError = null;
      } else {
        claimed.lastError = error.message;
      }
      claimed.autoPublishLockUntil = null;
      await claimed.save();
      throw error;
    }
  }

  return { published: false, reason: 'no_eligible_articles' };
};
