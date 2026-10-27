import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { facebookApi } from '../services/facebookApi';

const DashboardContext = createContext();

export const DashboardProvider = ({ children }) => {
  const [pageData, setPageData] = useState(null);
  const [posts, setPosts] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [scheduledPosts, setScheduledPosts] = useState([]);
  const [automationSettings, setAutomationSettings] = useState(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  }, []);

  const fetchData = useCallback(async (isSilent = false) => {
    if (!isSilent) {
      setRefreshing(true);
    }
    setError(null);

    try {
      const [pageRes, postsRes, analyticsRes, scheduledRes, automationRes] = await Promise.allSettled([
        facebookApi.getPageDetails(),
        facebookApi.getRecentPosts(25),
        facebookApi.getPageAnalytics(),
        facebookApi.getScheduledPosts(),
        facebookApi.getAutomationSettings()
      ]);

      if (pageRes.status === 'fulfilled') {
        setPageData(pageRes.value);
      }
      if (postsRes.status === 'fulfilled') {
        setPosts(postsRes.value?.posts || []);
      }
      if (analyticsRes.status === 'fulfilled') {
        setAnalytics(analyticsRes.value);
      }
      if (scheduledRes.status === 'fulfilled') {
        setScheduledPosts(scheduledRes.value || []);
      }
      if (automationRes.status === 'fulfilled') {
        setAutomationSettings(automationRes.value);
      }

      // Check if critical calls failed
      if (pageRes.status === 'rejected') {
        console.error('Failed to load Page data:', pageRes.reason);
        setError(pageRes.reason.message || 'Unable to connect to Facebook Page API');
      } else if (postsRes.status === 'rejected') {
        console.error('Failed to load Page posts:', postsRes.reason);
        setError(postsRes.reason.message || 'Unable to load Facebook Page posts');
      } else if (analyticsRes.status === 'rejected') {
        console.error('Failed to load Page analytics:', analyticsRes.reason);
        setError(analyticsRes.reason.message || 'Unable to load Facebook Page analytics');
      }
    } catch (err) {
      console.error('Global data fetch error:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refreshData = async () => {
    await fetchData(false);
    showToast('Dashboard data refreshed successfully', 'success');
  };

  const publishNewPost = async (postData) => {
    try {
      const res = await facebookApi.createPost(postData);
      showToast(res.isLive ? 'Post published to Facebook Page!' : 'Post saved (Demo preview mode)', 'success');
      // Prepend to posts list
      setPosts((prev) => [res, ...prev]);
      setIsCreatePostOpen(false);
      return res;
    } catch (err) {
      showToast(err.message || 'Failed to publish post', 'error');
      throw err;
    }
  };

  const addScheduledPost = async (scheduleData) => {
    try {
      const res = await facebookApi.schedulePost(scheduleData);
      showToast('Post added to automation scheduler queue!', 'success');
      setScheduledPosts((prev) => [...prev, res]);
      setIsCreatePostOpen(false);
      return res;
    } catch (err) {
      showToast(err.message || 'Failed to schedule post', 'error');
      throw err;
    }
  };

  const removeScheduledPost = async (id) => {
    try {
      await facebookApi.deleteScheduledPost(id);
      setScheduledPosts((prev) => prev.filter((p) => p._id !== id));
      showToast('Scheduled post cancelled', 'info');
    } catch (err) {
      showToast(err.message || 'Failed to delete scheduled post', 'error');
    }
  };

  const publishScheduledNow = async (id) => {
    try {
      const res = await facebookApi.publishScheduledNow(id);
      setScheduledPosts((prev) =>
        prev.map((p) => (p._id === id ? { ...p, status: 'published', publishedAt: new Date() } : p))
      );
      setPosts((prev) => [res, ...prev]);
      showToast('Post published immediately!', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to publish post', 'error');
    }
  };

  return (
    <DashboardContext.Provider
      value={{
        pageData,
        posts,
        analytics,
        scheduledPosts,
        automationSettings,
        setAutomationSettings,
        loading,
        refreshing,
        error,
        activeTab,
        setActiveTab,
        isCreatePostOpen,
        setIsCreatePostOpen,
        mobileSidebarOpen,
        setMobileSidebarOpen,
        refreshData,
        publishNewPost,
        addScheduledPost,
        removeScheduledPost,
        publishScheduledNow,
        toast,
        showToast
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
};
