import cron from 'node-cron';
import { config } from '../../config/env.js';
import { checkNewsSource, getDueSources } from './pipeline.service.js';
import { publishNextNewsArticle } from './autoPublish.service.js';

const AUTO_PUBLISH_CRON = '*/10 * * * *';
let started = false;
let autoPublishRunning = false;

export const runDueNewsChecks = async () => {
  const due = await getDueSources();
  const results = [];

  for (const source of due) {
    try {
      const result = await checkNewsSource(source._id);
      results.push({ sourceId: source._id, ok: true, result });
    } catch (error) {
      console.error(`[NewsScheduler] Source ${source._id} failed:`, error.message);
      results.push({ sourceId: source._id, ok: false, error: error.message });
    }
  }

  return results;
};

export const runAutoPublishTick = async () => {
  if (autoPublishRunning) {
    return { published: false, reason: 'previous_run_still_active' };
  }

  autoPublishRunning = true;
  try {
    const result = await publishNextNewsArticle();
    if (result.published) {
      console.log(`[NewsScheduler] Published article ${result.articleId} as Facebook post ${result.postId}.`);
    }
    return result;
  } finally {
    autoPublishRunning = false;
  }
};

export const startNewsScheduler = () => {
  if (!config.news.schedulerEnabled) {
    console.log('ℹ️ News scheduler disabled (NEWS_SCHEDULER_ENABLED=false).');
    return;
  }

  if (started) {
    return;
  }

  if (!cron.validate(config.news.schedulerTickCron)) {
    console.error('[NewsScheduler] Invalid cron expression:', config.news.schedulerTickCron);
    return;
  }

  cron.schedule(config.news.schedulerTickCron, () => {
    void runDueNewsChecks().catch((error) => {
      console.error('[NewsScheduler] Source check run failed:', error.message);
    });
  });

  cron.schedule(AUTO_PUBLISH_CRON, () => {
    void runAutoPublishTick().catch((error) => {
      console.error('[NewsScheduler] Automatic article publishing failed:', error.message);
    });
  });

  started = true;
  console.log(`🕒 News scheduler started (${config.news.schedulerTickCron}); polished auto-publishing runs every 10 minutes.`);
};
