import React from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  ThumbsUp, 
  MessageSquare, 
  Share2, 
  Eye, 
  Zap, 
  Award,
  ArrowUpRight
} from 'lucide-react';
import { useDashboard } from '../context/DashboardContext';
import { LoadingSkeleton } from '../components/LoadingSkeleton';

export const Analytics = () => {
  const { analytics, pageData, posts, loading } = useDashboard();

  if (loading || !analytics) {
    return <LoadingSkeleton />;
  }

  const overview = analytics.overview || {};
  const breakdown = analytics.breakdown || {};
  const chartData = analytics.chartData || [];

  const maxChartValue = Math.max(...chartData.map((d) => d.total || 0), 50);

  // Top performing post
  const topPost = [...posts].sort((a, b) => (b.engagementTotal || 0) - (a.engagementTotal || 0))[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
          Performance Analytics
        </h1>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Audience engagement telemetry and Facebook Page growth metrics
        </p>
      </div>

      {/* Top 4 Metric Highlights */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Estimated Organic Reach</span>
            <div className="stat-card-icon-box" style={{ background: '#ebf5ff', color: '#1877F2' }}>
              <Eye size={20} />
            </div>
          </div>
          <div className="stat-card-value">
            {(overview.estimatedReach || 0).toLocaleString()}
          </div>
          <div className="stat-card-footer">
            <span className="stat-trend up">
              <ArrowUpRight size={14} /> +18.4%
            </span>
            <span>monthly impressions reach</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Engagement Rate</span>
            <div className="stat-card-icon-box" style={{ background: '#ecfdf5', color: '#10b981' }}>
              <Zap size={20} />
            </div>
          </div>
          <div className="stat-card-value">
            {overview.engagementRate || '3.2%'}
          </div>
          <div className="stat-card-footer">
            <span className="stat-trend up">
              <ArrowUpRight size={14} /> +0.8%
            </span>
            <span>top 10% benchmark in industry</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Total Interactions</span>
            <div className="stat-card-icon-box" style={{ background: '#fffbeb', color: '#f59e0b' }}>
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="stat-card-value">
            {(overview.totalEngagement || 0).toLocaleString()}
          </div>
          <div className="stat-card-footer">
            <span className="stat-trend up">
              <ArrowUpRight size={14} /> +12.5%
            </span>
            <span>across all recent posts</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Avg per Post</span>
            <div className="stat-card-icon-box" style={{ background: '#f5f3ff', color: '#8b5cf6' }}>
              <BarChart3 size={20} />
            </div>
          </div>
          <div className="stat-card-value">
            {overview.avgEngagementPerPost || 0}
          </div>
          <div className="stat-card-footer">
            <span style={{ color: 'var(--text-muted)' }}>interactions per published post</span>
          </div>
        </div>
      </div>

      {/* Visual Chart & Breakdown */}
      <div className="dashboard-grid-2">
        {/* Engagement Trajectory Visualizer */}
        <div 
          style={{
            background: 'white',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-light)',
            padding: '1.5rem',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                Recent Post Engagement Distribution
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Interactions breakdown across recent posts
              </p>
            </div>
            <span className="badge badge-blue">Last 7 Posts</span>
          </div>

          {/* Bar Chart Bars */}
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '220px', paddingTop: '20px', paddingBottom: '10px', borderBottom: '1px solid var(--border-light)' }}>
            {chartData.map((item, idx) => {
              const heightPercent = Math.max(12, Math.round(((item.total || 10) / maxChartValue) * 100));

              return (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, height: '100%', justifyContent: 'flex-end', gap: '0.5rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                    {item.total}
                  </div>
                  <div 
                    style={{
                      width: '38px',
                      height: `${heightPercent}%`,
                      background: 'linear-gradient(180deg, #1877F2 0%, #60a5fa 100%)',
                      borderRadius: '6px 6px 0 0',
                      transition: 'height 0.3s ease',
                      boxShadow: '0 2px 4px rgba(24, 119, 242, 0.2)'
                    }}
                    title={`Date: ${item.date} | Total: ${item.total}`}
                  />
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    {item.date}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.5rem', marginTop: '1.25rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ width: '10px', height: '10px', background: '#1877F2', borderRadius: '2px' }}></span>
              Combined Post Engagement
            </span>
          </div>
        </div>

        {/* Reaction Types & Breakdown */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div 
            style={{
              background: 'white',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-light)',
              padding: '1.5rem',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <h2 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '1.25rem', color: 'var(--text-main)' }}>
              Interaction Breakdown
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', background: '#f8fafc', borderRadius: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ThumbsUp size={16} color="#1877F2" />
                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Likes & Reactions</span>
                </div>
                <strong style={{ fontSize: '0.95rem' }}>{(breakdown.reactions || 0).toLocaleString()}</strong>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', background: '#f8fafc', borderRadius: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <MessageSquare size={16} color="#10b981" />
                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Comments</span>
                </div>
                <strong style={{ fontSize: '0.95rem' }}>{(breakdown.comments || 0).toLocaleString()}</strong>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', background: '#f8fafc', borderRadius: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Share2 size={16} color="#8b5cf6" />
                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Shares</span>
                </div>
                <strong style={{ fontSize: '0.95rem' }}>{(breakdown.shares || 0).toLocaleString()}</strong>
              </div>
            </div>
          </div>

          {/* Top Post Spotlight */}
          {topPost && (
            <div 
              style={{
                background: 'linear-gradient(135deg, #eff6ff 0%, #ffffff 100%)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid #bfdbfe',
                padding: '1.25rem',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#1d4ed8', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                <Award size={16} />
                <span>Top Performing Post</span>
              </div>
              <p style={{ fontSize: '0.85rem', color: '#1e293b', marginBottom: '0.75rem', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {topPost.message}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                <span>👍 {topPost.likesCount || topPost.reactionsCount}</span>
                <span>💬 {topPost.commentsCount}</span>
                <span>↗ {topPost.sharesCount}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
