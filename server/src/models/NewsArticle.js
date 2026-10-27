import mongoose from 'mongoose';

const NewsArticleSchema = new mongoose.Schema(
  {
    pageId: {
      type: String,
      required: true,
      index: true
    },
    sourceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'NewsSource',
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    canonicalUrl: {
      type: String,
      required: true
    },
    normalizedUrl: {
      type: String,
      required: true
    },
    publishedAt: {
      type: Date,
      default: null
    },
    author: {
      type: String,
      default: ''
    },
    sourceName: {
      type: String,
      default: ''
    },
    description: {
      type: String,
      default: ''
    },
    content: {
      type: String,
      default: ''
    },
    imageUrl: {
      type: String,
      default: ''
    },
    contentFingerprint: {
      type: String,
      index: true
    },
    discoveredAt: {
      type: Date,
      default: Date.now
    },
    extractionStatus: {
      type: String,
      enum: ['pending', 'complete', 'excerpt_only', 'failed'],
      default: 'pending',
      index: true
    },
    processingStatus: {
      type: String,
      enum: ['discovered', 'extracting', 'extracted', 'generating', 'generated', 'scheduled', 'published', 'failed', 'skipped'],
      default: 'discovered',
      index: true
    },
    lastError: {
      type: String,
      default: null
    }
  },
  { timestamps: true }
);

NewsArticleSchema.index({ pageId: 1, normalizedUrl: 1 }, { unique: true });
NewsArticleSchema.index({ sourceId: 1, discoveredAt: -1 });

export const NewsArticle = mongoose.model('NewsArticle', NewsArticleSchema);
