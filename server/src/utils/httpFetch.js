import axios from 'axios';
import { config } from '../config/env.js';
import { assertSafePublicUrl } from './ssrf.js';

const USER_AGENT = 'MetaSyncNewsMonitor/1.0 (respectful RSS/article fetch; contact via local operator)';

export const fetchPublicResource = async (rawUrl, options = {}) => {
  const {
    timeoutMs = config.news.fetchTimeoutMs,
    maxBytes = config.news.maxFetchBytes,
    accept = 'application/rss+xml, application/atom+xml, application/xml, text/xml, text/html;q=0.9, */*;q=0.5'
  } = options;

  let current = await assertSafePublicUrl(rawUrl);

  for (let hop = 0; hop < 5; hop += 1) {
    const response = await axios.get(current.href, {
      timeout: timeoutMs,
      maxRedirects: 0,
      maxContentLength: maxBytes,
      responseType: 'text',
      validateStatus: () => true,
      headers: {
        'User-Agent': USER_AGENT,
        Accept: accept
      }
    });

    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.location;
      if (!location) {
        throw Object.assign(new Error('Redirect missing Location header'), { statusCode: 502 });
      }
      current = await assertSafePublicUrl(new URL(location, current).href);
      continue;
    }

    if (response.status >= 400) {
      throw Object.assign(
        new Error(`Remote server returned HTTP ${response.status}`),
        { statusCode: 502 }
      );
    }

    return {
      finalUrl: current.href,
      body: typeof response.data === 'string' ? response.data : String(response.data || ''),
      contentType: response.headers['content-type'] || ''
    };
  }

  throw Object.assign(new Error('Too many redirects'), { statusCode: 400 });
};
