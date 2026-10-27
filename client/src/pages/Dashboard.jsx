import React from 'react';
import { 
  Users, 
  FileText, 
  TrendingUp, 
  Eye, 
  ExternalLink, 
  ShieldCheck,
  Plus, 
  CalendarClock, 
  ThumbsUp, 
  MessageSquare, 
  Share2 
} from 'lucide-react';
import { useDashboard } from '../context/DashboardContext';
import { StatusBanner } from '../components/StatusBanner';
import { StatCard } from '../components/StatCard';
import { PostCard } from '../components/PostCard';
import { LoadingSkeleton } from '../components/LoadingSkeleton';

export const Dashboard = () => {
  const { 
    pageData, 
    posts, 
    analytics, 
    scheduledPosts, 
    loading, 
    setActiveTab, 
    setIsCreatePostOpen 
  } = useDashboard();

  if (loading) {
    return <LoadingSkeleton />;
  }

  const followersCount = (pageData?.followersCount || pageData?.fanCount || 0).toLocaleString();
  const totalPostsCount = analytics?.overview?.totalPosts || posts.length;
  const totalEngagement = (analytics?.overview?.totalEngagement || 0).toLocaleString();
  const engagementRate = analytics?.overview?.engagementRate || 'N/A';

  const pendingScheduleCount = scheduledPosts.filter((p) => p.status === 'pending').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Status banner */}
      <StatusBanner />

      {pageData && (
        <section
          aria-label="Connected Facebook Page"
          style={{
            background: 'white',
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <div
            style={{
              height: '120px',
              background: pageData.coverUrl
                ? `linear-gradient(rgba(15, 23, 42, 0.12), rgba(15, 23, 42, 0.32)), url("${pageData.coverUrl}") center / cover`
                : 'linear-gradient(120deg, #1877F2, #60a5fa)'
            }}
          />
          <div style={{ padding: '0 1.5rem 1.35rem' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem',
                marginTop: '-34px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1rem', minWidth: 0 }}>
                {pageData.pictureUrl ? (
                  <div
                    style={{
                      width: '76px',
                      height: '76px',
                      borderRadius: '50%',
                      position: 'relative',
                      flexShrink: 0,
                      boxShadow: 'var(--shadow-md)'
                    }}
                  >
                    <img
                      src={pageData.pictureUrl}
                      alt={`${pageData.name || 'Facebook Page'} profile`}
                      onError={(event) => {
                        event.currentTarget.style.display = 'none';
                        event.currentTarget.nextElementSibling.style.display = 'grid';
                      }}
                      style={{
                        width: '100%',
                        height: '100%',
                        borderRadius: '50%',
                        border: '4px solid white',
                        objectFit: 'cover',
                        background: 'white'
                      }}
                    />
                    <div
                      aria-hidden="true"
                      style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'none',
                        placeItems: 'center',
                        borderRadius: '50%',
                        border: '4px solid white',
                        background: '#1877F2',
                        color: 'white',
                        fontSize: '1.7rem',
                        fontWeight: 800
                      }}
                    >
                      {(pageData.name || 'P').charAt(0).toUpperCase()}
                    </div>
                  </div>
                ) : (
                  <div
                    aria-hidden="true"
                    style={{
                      width: '76px',
                      height: '76px',
                      display: 'grid',
                      placeItems: 'center',
                      borderRadius: '50%',
                      border: '4px solid white',
                      background: '#1877F2',
                      color: 'white',
                      fontSize: '1.7rem',
                      fontWeight: 800,
                      boxShadow: 'var(--shadow-md)',
                      flexShrink: 0
                    }}
                  >
                    {(pageData.name || 'P').charAt(0).toUpperCase()}
                  </div>
                )}
                <div style={{ minWidth: 0, paddingBottom: '0.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.4rem' }}>
                    <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                      {pageData.name || 'Facebook Page'}
                    </h2>
                    {pageData.isVerified && <ShieldCheck size={18} color="#1877F2" aria-label="Verified Page" />}
                    <span className={`badge ${pageData.isLive ? 'badge-live' : 'badge-demo'}`}>
                      {pageData.isLive ? 'Connected' : 'Preview'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.45rem', marginTop: '0.25rem' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600 }}>
                      {pageData.category || 'Facebook Page'}
                    </span>
                    {pageData.id && (
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        Page ID: <code>{pageData.id}</code>
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)' }}>
                    {(pageData.followersCount || pageData.fanCount || 0).toLocaleString()}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Followers</div>
                </div>
                {pageData.link && (
                  <a href={pageData.link} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm">
                    <span>Open Page</span>
                    <ExternalLink size={14} />
                  </a>
                )}
                <button className="btn btn-primary btn-sm" onClick={() => setIsCreatePostOpen(true)}>
                  <Plus size={15} />
                  <span>Create Post</span>
                </button>
              </div>
            </div>
            {pageData.about && (
              <p style={{ margin: '1rem 0 0', color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.5 }}>
                {pageData.about}
              </p>
            )}
          </div>
        </section>
      )}

      {/* Top Stat Cards */}
      <div className="stats-grid">
        <StatCard
          title="Total Followers"
          value={followersCount}
          trend={analytics?.overview?.followersGrowth}
          trendUp={true}
          subtitle="current Page total"
          icon={Users}
          color="#1877F2"
        />

        <StatCard
          title="Recent Posts"
          value={totalPostsCount}
          subtitle="loaded from Facebook Page"
          icon={FileText}
          color="#10b981"
        />

        <StatCard
          title="Total Engagement"
          value={totalEngagement}
          trend={analytics?.overview?.engagementGrowth}
          trendUp={true}
          subtitle="from recent Page posts"
          icon={TrendingUp}
          color="#f59e0b"
        />

        <StatCard
          title="Engagement Rate"
          value={engagementRate}
          subtitle="based on recent posts"
          icon={Eye}
          color="#8b5cf6"
        />
      </div>

      {/* Main Grid: Feed + Sidebar Cards */}
      <div className="dashboard-grid-2">
        {/* Left Column: Recent Posts Feed */}
        <div>
          <div className="section-header">
            <div>
              <h2 className="section-title">Recent Page Posts</h2>
              <p className="section-subtitle">Real-time posts and engagement telemetry</p>
            </div>
            <button 
              className="btn btn-outline btn-sm"
              onClick={() => setActiveTab('posts')}
            >
              View All Posts
            </button>
          </div>

          {posts.length === 0 ? (
            <div 
              style={{
                background: 'white',
                padding: '3rem 2rem',
                borderRadius: 'var(--radius-lg)',
                textAlign: 'center',
                border: '1px solid var(--border-light)'
              }}
            >
              <FileText size={40} color="var(--text-subtle)" style={{ marginBottom: '1rem' }} />
              <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>No Posts Found</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                There are currently no recent posts synced from the Facebook Page.
              </p>
              <button className="btn btn-primary" onClick={() => setIsCreatePostOpen(true)}>
                <Plus size={16} />
                <span>Create Your First Post</span>
              </button>
            </div>
          ) : (
            posts.slice(0, 4).map((post) => (
              <PostCard key={post.id} post={post} />
            ))
          )}
        </div>

        {/* Right Column: Page Overview & Engagement Stats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Engagement Breakdown Card */}
          <div 
            style={{
              background: 'white',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-light)',
              padding: '1.25rem',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-main)' }}>
              Audience Interactions
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', marginBottom: '0.35rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#1877F2', fontWeight: 600 }}>
                    <ThumbsUp size={14} /> Reactions
                  </span>
                  <strong>{(analytics?.breakdown?.reactions || 0).toLocaleString()}</strong>
                </div>
                <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: '70%', height: '100%', background: '#1877F2', borderRadius: '4px' }}></div>
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', marginBottom: '0.35rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#10b981', fontWeight: 600 }}>
                    <MessageSquare size={14} /> Comments
                  </span>
                  <strong>{(analytics?.breakdown?.comments || 0).toLocaleString()}</strong>
                </div>
                <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: '45%', height: '100%', background: '#10b981', borderRadius: '4px' }}></div>
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', marginBottom: '0.35rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#8b5cf6', fontWeight: 600 }}>
                    <Share2 size={14} /> Shares
                  </span>
                  <strong>{(analytics?.breakdown?.shares || 0).toLocaleString()}</strong>
                </div>
                <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: '30%', height: '100%', background: '#8b5cf6', borderRadius: '4px' }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Scheduled Posts Queue Mini Widget */}
          <div 
            style={{
              background: 'white',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-light)',
              padding: '1.25rem',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <CalendarClock size={16} color="var(--primary)" />
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Automation Queue</h3>
              </div>
              <span className="badge badge-blue">
                {pendingScheduleCount} pending
              </span>
            </div>

            {pendingScheduleCount === 0 ? (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                No scheduled posts in the pipeline. Use the scheduler to automate upcoming content.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {scheduledPosts.filter(p => p.status === 'pending').slice(0, 2).map((item) => (
                  <div 
                    key={item._id} 
                    style={{
                      padding: '0.65rem 0.85rem',
                      background: 'var(--bg-app)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.8rem',
                      border: '1px solid var(--border-light)'
                    }}
                  >
                    <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.2rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.message}
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.725rem' }}>
                      Scheduled: {new Date(item.scheduledFor).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button 
              className="btn btn-outline btn-sm" 
              style={{ width: '100%', marginTop: '0.85rem' }}
              onClick={() => setActiveTab('scheduler')}
            >
              Open Post Scheduler
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
