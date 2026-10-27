import app from './src/app.js';
import { config, validateEnv } from './src/config/env.js';
import { connectDB } from './src/config/db.js';
import { facebookService } from './src/services/facebook.service.js';
import { startNewsScheduler } from './src/services/news/scheduler.js';

const startServer = async () => {
  console.log('--------------------------------------------------');
  console.log('🚀 Starting Facebook Automation Backend Server...');
  console.log('--------------------------------------------------');

  // Validate env
  validateEnv();

  // Connect MongoDB
  await connectDB();

  const PORT = config.port;

  app.listen(PORT, () => {
    console.log(`📡 Backend Server listening on http://localhost:${PORT}`);
    console.log(`🌐 Health check available at: http://localhost:${PORT}/api/health`);
    console.log(`📘 Facebook Page API at: http://localhost:${PORT}/api/facebook/page`);
    console.log('--------------------------------------------------');
    void facebookService.testConnection();
    startNewsScheduler();
  });
};

startServer().catch((err) => {
  console.error('Fatal Server Startup Error:', err);
  process.exit(1);
});
