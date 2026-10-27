import mongoose from 'mongoose';

const NewsPostSchema = new mongoose.Schema(
  {
    pageId: {
      type: String,
      required: true,
      index: true
    },
    articleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'NewsArticle',
      required: true,
      unique: true
    },
    sourceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'NewsSource',
      required: true,
      index: true
    },
    headline: { type: String, default: '' },
    caption: { type: String, required: true },
    summary: { type: String, default: '' },
    sourceUrl: { type: String, required: true },
    hashtags: { type: [String], default: [] },
    needsReview: { type: Boolean, default: false },
    reviewReason: { type: String, default: null },
    captionEdited: { type: Boolean, default: false },
    approvalStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true
    },
    publishingStatus: {
      type: String,
      enum: ['draft', 'scheduled', 'publishing', 'published', 'failed', 'uncertain'],
      default: 'draft',
      index: true
    },
    fbPostId: {
      type: String,
      default: null,
      index: true,
      sparse: true
    },
    approvedAt: { type: Date, default: null },
    publishedAt: { type: Date, default: null },
    lastError: { type: String, default: null },
    publishAttempts: { type: Number, default: 0 }
  },
  { timestamps: true }
);

NewsPostSchema.index({ pageId: 1, createdAt: -1 });
NewsPostSchema.index({ pageId: 1, publishingStatus: 1, approvalStatus: 1 });

export const NewsPost = mongoose.model('NewsPost', NewsPostSchema);
