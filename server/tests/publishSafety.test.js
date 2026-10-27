import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

const canClaimPublish = (post, { auto = false } = {}) => {
  if (post.fbPostId || post.publishingStatus === 'published') return false;
  if (['publishing', 'uncertain'].includes(post.publishingStatus)) return false;
  if (!['draft', 'failed'].includes(post.publishingStatus)) return false;
  if (auto) return post.approvalStatus === 'pending' && !post.needsReview;
  return post.approvalStatus === 'approved';
};

describe('publishing safety', () => {
  it('requires approval for manual publish', () => {
    assert.equal(
      canClaimPublish({ publishingStatus: 'draft', approvalStatus: 'pending', fbPostId: null, needsReview: false }),
      false
    );
    assert.equal(
      canClaimPublish({ publishingStatus: 'draft', approvalStatus: 'approved', fbPostId: null }),
      true
    );
  });

  it('blocks duplicate publication', () => {
    assert.equal(
      canClaimPublish({ publishingStatus: 'published', approvalStatus: 'approved', fbPostId: '123' }),
      false
    );
  });

  it('does not retry uncertain Facebook timeouts', () => {
    assert.equal(
      canClaimPublish({ publishingStatus: 'uncertain', approvalStatus: 'approved', fbPostId: null }),
      false
    );
  });

  it('allows auto-publish only when review is not required', () => {
    assert.equal(
      canClaimPublish(
        { publishingStatus: 'draft', approvalStatus: 'pending', fbPostId: null, needsReview: true },
        { auto: true }
      ),
      false
    );
    assert.equal(
      canClaimPublish(
        { publishingStatus: 'draft', approvalStatus: 'pending', fbPostId: null, needsReview: false },
        { auto: true }
      ),
      true
    );
  });
});
