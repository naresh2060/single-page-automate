import mongoose from 'mongoose';
import { config } from '../config/env.js';

const NewsSourceSchema = new mongoose.Schema(
  {
    pageId: {
      type: String,
      required: true,
      index: true
    },
    name: {
      type: String,
      required: [true, 'Source name is required'],
      trim: true,
      maxlength: 120
    },
    websiteUrl: {
      type: String,
      required: [true, 'Website URL is required'],
      trim: true
    },
    feedUrl: {
      type: String,
      required: [true, 'Feed URL is required'],
      trim: true
    },
    sourceType: {
      type: String,
      enum: ['rss', 'atom', 'html'],
      default: 'rss'
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    intervalMinutes: {
      type: Number,
      default: config.news.defaultIntervalMinutes,
      min: config.news.minIntervalMinutes,
      max: config.news.maxIntervalMinutes
    },
    autoPublish: {
      type: Boolean,
      default: false
    },
    excerptOnly: {
      type: Boolean,
      default: false
    },
    generation: {
      language: { type: String, default: 'English' },
      tone: {
        type: String,
        enum: ['Informative', 'Professional', 'Casual', 'Engaging', 'Promotional'],
        default: 'Informative'
      },
      captionMinWords: { type: Number, default: 40 },
      captionMaxWords: { type: Number, default: 80 },
      emojiUsage: { type: String, enum: ['none', 'sparse', 'moderate'], default: 'sparse' },
      hashtagUsage: { type: String, enum: ['none', 'sparse', 'moderate'], default: 'sparse' },
      targetAudience: { type: String, default: 'general readers' },
      attributionFormat: { type: String, default: 'Source: {source} — {url}' }
    },
    lastCheckedAt: { type: Date, default: null },
    lastSuccessfulCheckAt: { type: Date, default: null },
    lastError: { type: String, default: null },
    checkLockUntil: { type: Date, default: null }
  },
  { timestamps: true }
);

NewsSourceSchema.index({ pageId: 1, feedUrl: 1 }, { unique: true });
NewsSourceSchema.index({ isActive: 1, checkLockUntil: 1, lastCheckedAt: 1 });

export const NewsSource = mongoose.model('NewsSource', NewsSourceSchema);
