import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { assertSafePublicUrl, isPrivateOrReservedIp } from '../src/utils/ssrf.js';

describe('SSRF guards', () => {
  it('flags loopback and private IPv4 addresses', () => {
    assert.equal(isPrivateOrReservedIp('127.0.0.1'), true);
    assert.equal(isPrivateOrReservedIp('10.0.0.8'), true);
    assert.equal(isPrivateOrReservedIp('192.168.1.1'), true);
    assert.equal(isPrivateOrReservedIp('169.254.169.254'), true);
    assert.equal(isPrivateOrReservedIp('8.8.8.8'), false);
  });

  it('rejects localhost URLs', async () => {
    await assert.rejects(() => assertSafePublicUrl('http://localhost/admin'), /not allowed/i);
  });

  it('rejects non-http schemes', async () => {
    await assert.rejects(() => assertSafePublicUrl('file:///etc/passwd'), /http and https/i);
  });

  it('rejects literal private IPs', async () => {
    await assert.rejects(() => assertSafePublicUrl('http://127.0.0.1:5000/api/health'), /private or reserved/i);
  });
});
