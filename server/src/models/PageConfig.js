import mongoose from 'mongoose';

const PageConfigSchema = new mongoose.Schema(
  {
    pageId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    name: {
      type: String,
      default: ''
    },
    category: {
      type: String,
      default: ''
    },
    pictureUrl: {
      type: String,
      default: ''
    },
    lastSyncedAt: {
      type: Date,
      default: null
    },
    status: {
      type: String,
      enum: ['connected', 'error', 'disconnected', 'demo'],
      default: 'demo'
    },
    lastErrorMessage: {
      type: String,
      default: null
    }
  },
  { timestamps: true }
);

export const PageConfig = mongoose.model('PageConfig', PageConfigSchema);
