import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import healthRoutes from './routes/health.routes.js';
import facebookRoutes from './routes/facebook.routes.js';
import postRoutes from './routes/post.routes.js';
import automationRoutes from './routes/automation.routes.js';
import newsRoutes from './routes/news.routes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { sendError } from './utils/response.js';

const app = express();

// Middlewares
app.use(cors({
  origin: '*', // Allow development frontend requests
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));

// Routes
app.use('/api', healthRoutes);
app.use('/api/facebook', facebookRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/automation', automationRoutes);
app.use('/api', newsRoutes);

// Catch-all 404
app.use((req, res) => {
  return sendError(res, `Endpoint not found: ${req.method} ${req.originalUrl}`, 404);
});

// Centralized error handler
app.use(errorHandler);

export default app;
