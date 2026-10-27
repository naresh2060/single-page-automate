import api from './api';

export const facebookApi = {
  // Facebook Page & Graph API
  async getPageDetails() {
    const res = await api.get('/facebook/page');
    return res.data;
  },

  async getRecentPosts(limit = 20) {
    const res = await api.get(`/facebook/posts?limit=${limit}`);
    return res.data;
  },

  async getPageAnalytics() {
    const res = await api.get('/facebook/analytics');
    return res.data;
  },

  async createPost(postData) {
    const res = await api.post('/facebook/posts', postData);
    return res.data;
  },

  async getConnectionStatus() {
    const res = await api.get('/facebook/connection');
    return res.data;
  },

  async getHealth() {
    const res = await api.get('/health');
    return res.data;
  },

  // Post Scheduling
  async getScheduledPosts() {
    const res = await api.get('/posts/scheduled');
    return res.data;
  },

  async schedulePost(data) {
    const res = await api.post('/posts/schedule', data);
    return res.data;
  },

  async deleteScheduledPost(id) {
    const res = await api.delete(`/posts/scheduled/${id}`);
    return res.data;
  },

  async publishScheduledNow(id) {
    const res = await api.post(`/posts/scheduled/${id}/publish-now`);
    return res.data;
  },

  // Automation & Settings
  async getAutomationSettings() {
    const res = await api.get('/automation/settings');
    return res.data;
  },

  async updateAutomationSettings(data) {
    const res = await api.put('/automation/settings', data);
    return res.data;
  },

  async generateDraft(data) {
    const res = await api.post('/automation/generate-draft', data);
    return res.data;
  }
};
