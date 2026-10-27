import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const newsClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 90000
});

newsClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.message || error.message || 'News API request failed';
    const customError = new Error(message);
    customError.statusCode = error.response?.status || 500;
    return Promise.reject(customError);
  }
);

const unwrap = async (promise) => {
  const res = await promise;
  return res.data;
};

export const newsApi = {
  listSources: () => unwrap(newsClient.get('/news-sources')),
  createSource: (data) => unwrap(newsClient.post('/news-sources', data)),
  updateSource: (id, data) => unwrap(newsClient.patch(`/news-sources/${id}`, data)),
  deleteSource: (id) => unwrap(newsClient.delete(`/news-sources/${id}`)),
  testFeed: (id) => unwrap(newsClient.post(`/news-sources/${id}/test-feed`)),
  checkSource: (id) => unwrap(newsClient.post(`/news-sources/${id}/check`)),
  listArticles: () => unwrap(newsClient.get('/news-articles')),
  getArticle: (id) => unwrap(newsClient.get(`/news-articles/${id}`)),
  polishArticle: (id, data = {}) => unwrap(newsClient.post(`/news-articles/${id}/polish`, data)),
  manualPublishArticle: (id, data) => unwrap(newsClient.post(`/news-articles/${id}/manual-publish`, data)),
  manualDraftArticle: (id, data) => unwrap(newsClient.post(`/news-articles/${id}/manual-draft`, data)),
  listPosts: () => unwrap(newsClient.get('/news-posts')),
  updatePost: (id, data) => unwrap(newsClient.patch(`/news-posts/${id}`, data)),
  regeneratePost: (id) => unwrap(newsClient.post(`/news-posts/${id}/regenerate`)),
  approvePost: (id) => unwrap(newsClient.post(`/news-posts/${id}/approve`)),
  rejectPost: (id) => unwrap(newsClient.post(`/news-posts/${id}/reject`)),
  publishPost: (id) => unwrap(newsClient.post(`/news-posts/${id}/publish`)),
  getHistory: () => unwrap(newsClient.get('/news-automation/history'))
};
