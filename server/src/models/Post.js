import mongoose from 'mongoose';

const PostSchema = new mongoose.Schema(
  {
    fbPostId: {
      type: String,
      unique: true,
      sparse: true,
      index: true
    },
    pageId: {
      type: String,
      required: true,
      index: true
    },
    message: {
      type: String,
      default: ''
    },
    story: {
      type: String,
      default: ''
    },
    mediaUrl: {
      type: String,
      default: ''
    },
    permalinkUrl: {
      type: String,
      default: ''
    },
    metrics: {
      likesCount: { type: Number, default: 0 },
      reactionsCount: { type: Number, default: 0 },
      commentsCount: { type: Number, default: 0 },
      sharesCount: { type: Number, default: 0 },
      reachCount: { type: Number, default: 0 },
      engagementRate: { type: Number, default: 0 }
    },
    publishedAt: {
      type: Date,
      default: Date.now
    },
    source: {
      type: String,
      enum: ['facebook', 'automation', 'manual'],
      default: 'facebook'
    }
  },
  { timestamps: true }
);

export const Post = mongoose.model('Post', PostSchema);
