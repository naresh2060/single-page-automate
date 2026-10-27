import mongoose from 'mongoose';

const AutomationSettingSchema = new mongoose.Schema(
  {
    pageId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    autoPublishEnabled: {
      type: Boolean,
      default: false
    },
    autoReplyEnabled: {
      type: Boolean,
      default: false
    },
    autoReplyRules: [
      {
        keyword: { type: String, required: true },
        response: { type: String, required: true },
        isActive: { type: Boolean, default: true }
      }
    ],
    postingSchedule: {
      days: {
        type: [String],
        default: ['Monday', 'Wednesday', 'Friday']
      },
      times: {
        type: [String],
        default: ['10:00', '15:00', '19:00']
      },
      timezone: {
        type: String,
        default: 'UTC'
      }
    },
    aiTone: {
      type: String,
      enum: ['Professional', 'Casual', 'Engaging', 'Promotional', 'Humorous'],
      default: 'Engaging'
    },
    syncIntervalMinutes: {
      type: Number,
      default: 30
    }
  },
  { timestamps: true }
);

export const AutomationSetting = mongoose.model('AutomationSetting', AutomationSettingSchema);
