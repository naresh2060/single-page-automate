import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 5002,
  mongodbUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/facebook_automation',
  facebook: {
    pageId: process.env.FACEBOOK_PAGE_ID?.trim() || '',
    pageAccessToken: process.env.FACEBOOK_PAGE_ACCESS_TOKEN?.trim() || '',
    apiVersion: process.env.FACEBOOK_GRAPH_API_VERSION?.trim() || 'v25.0',
    baseUrl: 'https://graph.facebook.com'
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY?.trim() || '',
    model: process.env.GEMINI_MODEL?.trim() || 'gemini-2.0-flash',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta'
  },
  news: {
    schedulerEnabled: process.env.NEWS_SCHEDULER_ENABLED !== 'false',
    schedulerTickCron: process.env.NEWS_SCHEDULER_CRON || '* * * * *',
    minIntervalMinutes: 5,
    maxIntervalMinutes: 360,
    defaultIntervalMinutes: 30,
    maxArticleChars: 8000,
    maxFetchBytes: 1_500_000,
    fetchTimeoutMs: 12000,
    lockMinutes: 10,
    maxArticlesPerCheck: 5
  },
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  isProduction: process.env.NODE_ENV === 'production'
};

export const getConfiguredPageId = () => {
  const pageId = config.facebook.pageId;
  if (!pageId || pageId === 'your_facebook_page_id') {
    return 'demo_page_id';
  }
  return pageId;
};

/**
 * Validate required environment variables at server start.
 * Logs clear diagnostics without crashing if user hasn't added live Facebook token yet.
 */
export const validateEnv = () => {
  if (!process.env.MONGODB_URI) {
    console.warn('⚠️ MONGODB_URI not specified in .env, falling back to mongodb://127.0.0.1:27017/facebook_automation');
  }

  const isPlaceholderPageId =
    !config.facebook.pageId ||
    config.facebook.pageId === 'your_facebook_page_id';

  const isPlaceholderToken =
    !config.facebook.pageAccessToken ||
    config.facebook.pageAccessToken === 'your_long_lived_page_access_token';

  if (isPlaceholderPageId || isPlaceholderToken) {
    console.log('ℹ️ Facebook Page credentials in server/.env are placeholder/unconfigured.');
    console.log('ℹ️ Server will operate in resilient Preview/Demo mode with full UI data until real credentials are provided.');
  } else {
    console.log('✅ Facebook Page ID configured:', config.facebook.pageId);
    console.log('✅ Facebook Page Access Token detected (length:', config.facebook.pageAccessToken.length, 'chars)');
  }

  if (!config.gemini.apiKey) {
    console.log('ℹ️ GEMINI_API_KEY not set. News captions will fail until a Google Gemini API key is added to server/.env.');
  } else {
    console.log('✅ Gemini API key detected (length:', config.gemini.apiKey.length, 'chars), model:', config.gemini.model);
  }

  return {
    isConfigured: !isPlaceholderPageId && !isPlaceholderToken
  };
};
