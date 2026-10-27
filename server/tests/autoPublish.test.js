import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isPostIneligibleForAutoPublish } from '../src/services/news/autoPublish.service.js';

describe('news article auto-publishing safety', () => {
  it('allows unedited draft posts without review flags', () => {
    assert.equal(isPostIneligibleForAutoPublish(null), false);
    assert.equal(
      isPostIneligibleForAutoPublish({
        publishingStatus: 'draft',
        approvalStatus: 'pending',
        captionEdited: false,
        needsReview: false
      }),
      false
    );
  });

  it('does not auto-publish already handled or explicitly reviewed posts', () => {
    for (const post of [
      { publishingStatus: 'published' },
      { publishingStatus: 'scheduled' },
      { publishingStatus: 'publishing' },
      { publishingStatus: 'uncertain' },
      { approvalStatus: 'approved' },
      { approvalStatus: 'rejected' },
      { captionEdited: true },
      { needsReview: true }
    ]) {
      assert.equal(isPostIneligibleForAutoPublish(post), true);
    }
  });
});
