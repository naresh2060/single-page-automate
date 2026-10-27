import { Router } from 'express';
import {
  createNewsSource,
  listNewsSources,
  getNewsSource,
  updateNewsSource,
  deleteNewsSource,
  testNewsSourceFeed,
  runNewsSourceCheck
} from '../controllers/newsSource.controller.js';
import {
  listNewsArticles,
  getNewsArticle,
  polishNewsArticle,
  manualPublishNewsArticle,
  manualDraftNewsArticle
} from '../controllers/newsArticle.controller.js';
import {
  listNewsPosts,
  getNewsPost,
  updateNewsPost,
  regenerateNewsPost,
  approveNewsPost,
  rejectNewsPost,
  publishApprovedNewsPost,
  getNewsHistory
} from '../controllers/newsPost.controller.js';

const router = Router();

router.get('/news-automation/history', getNewsHistory);

router.post('/news-sources', createNewsSource);
router.get('/news-sources', listNewsSources);
router.get('/news-sources/:id', getNewsSource);
router.patch('/news-sources/:id', updateNewsSource);
router.delete('/news-sources/:id', deleteNewsSource);
router.post('/news-sources/:id/test-feed', testNewsSourceFeed);
router.post('/news-sources/:id/check', runNewsSourceCheck);

router.get('/news-articles', listNewsArticles);
router.get('/news-articles/:id', getNewsArticle);
router.post('/news-articles/:id/polish', polishNewsArticle);
router.post('/news-articles/:id/manual-publish', manualPublishNewsArticle);
router.post('/news-articles/:id/manual-draft', manualDraftNewsArticle);

router.get('/news-posts', listNewsPosts);
router.get('/news-posts/:id', getNewsPost);
router.patch('/news-posts/:id', updateNewsPost);
router.post('/news-posts/:id/regenerate', regenerateNewsPost);
router.post('/news-posts/:id/approve', approveNewsPost);
router.post('/news-posts/:id/reject', rejectNewsPost);
router.post('/news-posts/:id/publish', publishApprovedNewsPost);

export default router;
