import { ScheduledPost } from '../models/ScheduledPost.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { config } from '../config/env.js';
import { facebookService } from '../services/facebook.service.js';

export const getScheduledPosts = async (req, res, next) => {
  try {
    const pageId = config.facebook.pageId || 'demo_page_id';
    const posts = await ScheduledPost.find({ pageId }).sort({ scheduledFor: 1 });
    return sendSuccess(res, posts, 'Scheduled posts fetched successfully');
  } catch (error) {
    next(error);
  }
};

export const createScheduledPost = async (req, res, next) => {
  try {
    const { message, mediaUrl, linkUrl, scheduledFor, aiGenerated, tags } = req.body;

    if (!message || message.trim() === '') {
      return sendError(res, 'Post message is required', 400);
    }

    if (!scheduledFor) {
      return sendError(res, 'Scheduled date and time are required', 400);
    }

    const scheduledDate = new Date(scheduledFor);
    if (isNaN(scheduledDate.getTime())) {
      return sendError(res, 'Invalid scheduled date format', 400);
    }

    const scheduledPost = await ScheduledPost.create({
      pageId: config.facebook.pageId || 'demo_page_id',
      message: message.trim(),
      mediaUrl: mediaUrl?.trim() || '',
      linkUrl: linkUrl?.trim() || '',
      scheduledFor: scheduledDate,
      status: 'pending',
      aiGenerated: !!aiGenerated,
      tags: tags || []
    });

    return sendSuccess(res, scheduledPost, 'Post scheduled successfully', 201);
  } catch (error) {
    next(error);
  }
};

export const deleteScheduledPost = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await ScheduledPost.findByIdAndDelete(id);

    if (!deleted) {
      return sendError(res, 'Scheduled post not found', 404);
    }

    return sendSuccess(res, { id }, 'Scheduled post cancelled and removed');
  } catch (error) {
    next(error);
  }
};

export const publishScheduledPostNow = async (req, res, next) => {
  try {
    const { id } = req.params;
    const item = await ScheduledPost.findById(id);

    if (!item) {
      return sendError(res, 'Scheduled post not found', 404);
    }

    // Attempt to publish to Facebook
    const fbRes = await facebookService.createPost({
      message: item.message,
      link: item.linkUrl,
      mediaUrl: item.mediaUrl,
      requireMedia: item.requireMedia
    });

    item.status = 'published';
    item.publishedAt = new Date();
    item.fbPostId = fbRes.id;
    await item.save();

    return sendSuccess(res, item, 'Post published to Facebook successfully');
  } catch (error) {
    next(error);
  }
};
