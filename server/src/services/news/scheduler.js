import cron from 'node-cron';
import { config } from '../../config/env.js';
import { checkNewsSource, getDueSources } from './pipeline.service.js';

let started = false;

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
    void runDueNewsChecks();
  });

  started = true;
  console.log(`🕒 News scheduler started (${config.news.schedulerTickCron}). node-cron is in-memory and will pause if this process sleeps.`);
};
