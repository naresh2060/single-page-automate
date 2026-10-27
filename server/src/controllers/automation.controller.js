import { AutomationSetting } from '../models/AutomationSetting.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { config } from '../config/env.js';

export const getAutomationSettings = async (req, res, next) => {
  try {
    const pageId = config.facebook.pageId || 'demo_page_id';
    let settings = await AutomationSetting.findOne({ pageId });

    if (!settings) {
      settings = await AutomationSetting.create({
        pageId,
        autoPublishEnabled: false,
        autoReplyEnabled: true,
        autoReplyRules: [
          { keyword: 'pricing', response: 'Hi! You can view our full pricing tiers and plans at our website or DM us for a personalized quote.', isActive: true },
          { keyword: 'support', response: 'Hello! Our dedicated support team is available 24/7. Please message us your issue details.', isActive: true },
          { keyword: 'demo', response: 'We would love to show you a live demo! Drop your email or book a slot on our website.', isActive: true }
        ],
        postingSchedule: {
          days: ['Monday', 'Wednesday', 'Friday'],
          times: ['10:00', '15:00', '19:00'],
          timezone: 'UTC'
        },
        aiTone: 'Engaging'
      });
    }

    return sendSuccess(res, settings, 'Automation settings retrieved');
  } catch (error) {
    next(error);
  }
};

export const updateAutomationSettings = async (req, res, next) => {
  try {
    const pageId = config.facebook.pageId || 'demo_page_id';
    const updates = req.body;

    const settings = await AutomationSetting.findOneAndUpdate(
      { pageId },
      { $set: updates },
      { new: true, upsert: true }
    );

    return sendSuccess(res, settings, 'Automation settings updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Generate AI Social Media Post Suggestions / Drafts based on tone and topic
 */
export const generateDraftPost = async (req, res, next) => {
  try {
    const { topic, tone = 'Engaging', includeHashtags = true } = req.body;

    if (!topic || topic.trim() === '') {
      return sendError(res, 'Topic is required for generating a draft post', 400);
    }

    // Dynamic smart template generator
    const templates = [
      `🚀 Unlock new productivity with ${topic}!\n\nWhether you're scaling an enterprise team or refining daily workflows, having the right automated systems in place makes all the difference.\n\n👉 What's your biggest challenge with ${topic} right now? Drop a comment below!`,
      `💡 3 Key insights every team should know about ${topic}:\n\n1. Consistency drives measurable organic momentum.\n2. Automated analytics reveal true audience resonance.\n3. Proactive engagement turns casual viewers into brand champions.\n\nHit like if this resonates with your workflow! ✨`,
      `🔥 Behind the scenes: Why we are prioritizing ${topic} this quarter.\n\nOur mission is to help creators and brands maximize impact with less friction. Learn more through the link in our bio! 📈`
    ];

    const randomTemplate = templates[Math.floor(Math.random() * templates.length)];
    const hashtags = includeHashtags 
      ? `\n\n#${topic.replace(/\s+/g, '')} #SocialAutomation #GrowthHacking #DigitalMarketing #TechNews`
      : '';

    const generatedText = `${randomTemplate}${hashtags}`;

    return sendSuccess(res, {
      topic,
      tone,
      generatedText,
      suggestedMediaKeywords: topic.toLowerCase().split(' ')
    }, 'Draft post generated successfully');
  } catch (error) {
    next(error);
  }
};
