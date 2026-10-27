import { Router } from 'express';
import { getDBStatus } from '../config/db.js';
import { facebookService } from '../services/facebook.service.js';
import { isGeminiConfigured } from '../services/gemini.service.js';
import { config } from '../config/env.js';
import { sendSuccess } from '../utils/response.js';

const router = Router();

router.get('/health', async (req, res) => {
  const dbStatus = getDBStatus();
  const fbConfigured = facebookService.isConfigured();

  return sendSuccess(res, {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: dbStatus,
    facebook: {
      isConfigured: fbConfigured,
      apiVersion: config.facebook.apiVersion
    },
    gemini: {
      isConfigured: isGeminiConfigured(),
      model: config.gemini.model
    },
    newsScheduler: {
      enabled: config.news.schedulerEnabled
    }
  }, 'Service healthy');
});

export default router;
