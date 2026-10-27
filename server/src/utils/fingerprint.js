import crypto from 'node:crypto';

export const createContentFingerprint = ({ normalizedUrl, title = '', excerpt = '' }) => {
  const payload = [
    normalizedUrl || '',
    (title || '').trim().toLowerCase(),
    (excerpt || '').trim().slice(0, 400).toLowerCase()
  ].join('\n');

  return crypto.createHash('sha256').update(payload).digest('hex');
};
