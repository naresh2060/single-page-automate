import { Router } from 'express';
import {
  getScheduledPosts,
  createScheduledPost,
  deleteScheduledPost,
  publishScheduledPostNow
} from '../controllers/post.controller.js';

const router = Router();

router.get('/scheduled', getScheduledPosts);
router.post('/schedule', createScheduledPost);
router.delete('/scheduled/:id', deleteScheduledPost);
router.post('/scheduled/:id/publish-now', publishScheduledPostNow);

export default router;
