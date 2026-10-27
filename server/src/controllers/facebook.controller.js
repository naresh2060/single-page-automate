import { facebookService } from '../services/facebook.service.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { Post } from '../models/Post.js';
import { config } from '../config/env.js';

export const getPage = async (req, res, next) => {
  try {
    const pageData = await facebookService.getPageDetails();
    return sendSuccess(res, pageData, 'Facebook Page details fetched successfully');
  } catch (error) {
    next(error);
  }
};

export const getPosts = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 20;
    const postsData = await facebookService.getRecentPosts(limit);
    return sendSuccess(res, postsData, 'Facebook Page posts fetched successfully');
  } catch (error) {
    next(error);
  }
};

export const getAnalytics = async (req, res, next) => {
  try {
    const analyticsData = await facebookService.getAnalytics();
    return sendSuccess(res, analyticsData, 'Facebook Page analytics fetched successfully');
  } catch (error) {
    next(error);
  }
};

export const createPost = async (req, res, next) => {
  try {
    const { message, link, mediaUrl } = req.body;

    if (!message || message.trim() === '') {
      return sendError(res, 'Post message content is required', 400);
    }

    const createdPost = await facebookService.createPost({
      message: message.trim(),
      link: link?.trim(),
      mediaUrl: mediaUrl?.trim()
    });

    // Optionally save/sync to MongoDB Post collection
    try {
      await Post.create({
        fbPostId: createdPost.id,
        pageId: config.facebook.pageId || 'demo_page_id',
        message: createdPost.message,
        mediaUrl: createdPost.mediaUrl,
        permalinkUrl: createdPost.permalinkUrl,
        source: 'manual',
        publishedAt: new Date()
      });
    } catch (dbErr) {
      // Don't fail the request if MongoDB write has a duplicate or error
      console.warn('MongoDB post cache notice:', dbErr.message);
    }

    return sendSuccess(res, createdPost, 'Post published successfully', 201);
  } catch (error) {
    next(error);
  }
};

export const getConnectionStatus = async (req, res, next) => {
  try {
    const status = await facebookService.testConnection();
    return sendSuccess(res, status, 'Connection status checked');
  } catch (error) {
    next(error);
  }
};
