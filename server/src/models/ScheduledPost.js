import mongoose from 'mongoose';

const ScheduledPostSchema = new mongoose.Schema(
  {
    pageId: {
      type: String,
      required: true,
      index: true
    },
    message: {
      type: String,
      required: [true, 'Post content is required']
    },
    mediaUrl: {
      type: String,
      default: ''
    },
    requireMedia: {
      type: Boolean,
      default: false
    },
    linkUrl: {
      type: String,
      default: ''
    },
    scheduledFor: {
      type: Date,
      required: [true, 'Scheduled time is required'],
      index: true
    },
    status: {
      type: String,
      enum: ['pending', 'publishing', 'published', 'failed', 'cancelled'],
      default: 'pending',
      index: true
    },
    fbPostId: {
      type: String,
      default: null
    },
    publishedAt: {
      type: Date,
      default: null
    },
    errorMessage: {
      type: String,
      default: null
    },
    aiGenerated: {
      type: Boolean,
      default: false
    },
    tags: [String]
  },
  { timestamps: true }
);

export const ScheduledPost = mongoose.model('ScheduledPost', ScheduledPostSchema);
