import { Router } from 'express';
import {
  getAutomationSettings,
  updateAutomationSettings,
  generateDraftPost
} from '../controllers/automation.controller.js';

const router = Router();

router.get('/settings', getAutomationSettings);
router.put('/settings', updateAutomationSettings);
router.post('/generate-draft', generateDraftPost);

export default router;
