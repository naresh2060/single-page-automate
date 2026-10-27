import { Router } from 'express';
import {
  getPage,
  getPosts,
  getAnalytics,
  createPost,
  getConnectionStatus
} from '../controllers/facebook.controller.js';

const router = Router();

router.get('/page', getPage);
router.get('/posts', getPosts);
router.get('/analytics', getAnalytics);
router.post('/posts', createPost);
router.get('/connection', getConnectionStatus);

export default router;
