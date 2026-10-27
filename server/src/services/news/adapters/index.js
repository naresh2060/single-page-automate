import { rssAdapter } from './rss.adapter.js';

const adapters = {
  rss: rssAdapter,
  atom: rssAdapter
};

export const getSourceAdapter = (sourceType = 'rss') => {
  const adapter = adapters[sourceType];
  if (!adapter) {
    const error = new Error(`Source type "${sourceType}" is not implemented yet. Use an RSS or Atom feed URL.`);
    error.statusCode = 400;
    throw error;
  }
  return adapter;
};
