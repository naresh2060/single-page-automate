import dns from 'node:dns/promises';
import net from 'node:net';

const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  'localhost.localdomain',
  'metadata.google.internal',
  'metadata.google.com',
  'instance-data'
]);

export const isPrivateOrReservedIp = (ip) => {
  if (!ip) return true;

  if (net.isIP(ip) === 4) {
    const [a, b] = ip.split('.').map(Number);
    if (a === 0 || a === 10 || a === 127) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true;
    if (a === 198 && (b === 18 || b === 19)) return true;
    if (a >= 224) return true;
    return false;
  }

  if (net.isIP(ip) === 6) {
    const value = ip.toLowerCase();
    if (value === '::' || value === '::1') return true;
    if (value.startsWith('fe80:') || value.startsWith('fc') || value.startsWith('fd')) return true;
    if (value.startsWith('ff')) return true;
    if (value.startsWith('::ffff:')) {
      return isPrivateOrReservedIp(value.replace('::ffff:', ''));
    }
    return false;
  }

  return true;
};

export const assertSafePublicUrl = async (rawUrl) => {
  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw Object.assign(new Error('Invalid URL'), { statusCode: 400 });
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw Object.assign(new Error('Only http and https URLs are allowed'), { statusCode: 400 });
  }

  if (parsed.username || parsed.password) {
    throw Object.assign(new Error('URLs with credentials are not allowed'), { statusCode: 400 });
  }

  const hostname = parsed.hostname.toLowerCase();
  if (
    BLOCKED_HOSTNAMES.has(hostname) ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal')
  ) {
    throw Object.assign(new Error('This host is not allowed'), { statusCode: 400 });
  }

  if (net.isIP(hostname) && isPrivateOrReservedIp(hostname)) {
    throw Object.assign(new Error('Private or reserved IP addresses are not allowed'), { statusCode: 400 });
  }

  const lookup = await dns.lookup(hostname, { all: true, verbatim: true });
  if (!lookup.length) {
    throw Object.assign(new Error('Unable to resolve host'), { statusCode: 400 });
  }

  for (const record of lookup) {
    if (isPrivateOrReservedIp(record.address)) {
      throw Object.assign(new Error('Resolved host points to a private or reserved address'), { statusCode: 400 });
    }
  }

  return parsed;
};
