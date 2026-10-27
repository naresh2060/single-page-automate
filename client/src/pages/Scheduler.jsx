import React from 'react';
import { 
  CalendarClock, 
  Plus, 
  Send, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ExternalLink 
} from 'lucide-react';
import { useDashboard } from '../context/DashboardContext';
import { LoadingSkeleton } from '../components/LoadingSkeleton';

export const Scheduler = () => {
  const { 
    scheduledPosts, 
    loading, 
    setIsCreatePostOpen, 
    removeScheduledPost, 
    publishScheduledNow 
  } = useDashboard();

  if (loading) {
    return <LoadingSkeleton />;
  }

  const pendingPosts = scheduledPosts.filter((p) => p.status === 'pending');
  const pastPosts = scheduledPosts.filter((p) => p.status !== 'pending');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header Banner */}
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          background: 'white',
          padding: '1.5rem',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-light)',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CalendarClock size={24} color="var(--primary)" />
            <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.01em' }}>
              Post Automation Scheduler
            </h1>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Queue, organize, and automate upcoming Facebook Page content without manual intervention.
          </p>
        </div>

        <button className="btn btn-primary" onClick={() => setIsCreatePostOpen(true)}>
          <Plus size={16} />
          <span>Schedule New Post</span>
        </button>
      </div>

      {/* Queue Pipeline */}
      <div>
        <div className="section-header">
          <div>
            <h2 className="section-title">Upcoming Scheduled Posts ({pendingPosts.length})</h2>
            <p className="section-subtitle">Posts waiting in the automated publishing queue</p>
          </div>
        </div>

        {pendingPosts.length === 0 ? (
          <div 
            style={{
              background: 'white',
              padding: '3.5rem 2rem',
              borderRadius: 'var(--radius-lg)',
              textAlign: 'center',
              border: '1px dashed var(--border-medium)'
            }}
          >
            <Clock size={44} color="var(--text-subtle)" style={{ marginBottom: '1rem' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>Scheduler Queue is Empty</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              Plan your social calendar in advance. Scheduled posts will automatically be pushed to Facebook at their designated time.
            </p>
            <button className="btn btn-primary" onClick={() => setIsCreatePostOpen(true)}>
              <Plus size={16} />
              <span>Schedule a Post</span>
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {pendingPosts.map((post) => {
              const formattedDate = new Date(post.scheduledFor).toLocaleString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              });

              return (
                <div 
                  key={post._id}
                  style={{
                    background: 'white',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--border-light)',
                    padding: '1.25rem 1.5rem',
                    boxShadow: 'var(--shadow-sm)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.85rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className="badge badge-blue" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Clock size={12} />
                        <span>Scheduled: {formattedDate}</span>
                      </span>
                      {post.aiGenerated && (
                        <span className="badge" style={{ background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0' }}>
                          AI Draft
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <button 
                        className="btn btn-secondary btn-sm"
                        onClick={() => publishScheduledNow(post._id)}
                        title="Publish to Facebook right now"
                      >
                        <Send size={13} />
                        <span>Publish Now</span>
                      </button>
                      <button 
                        className="btn btn-danger btn-sm"
                        onClick={() => removeScheduledPost(post._id)}
                        title="Cancel and remove from queue"
                      >
                        <Trash2 size={13} />
                        <span>Cancel</span>
                      </button>
                    </div>
                  </div>

                  <p style={{ fontSize: '0.95rem', color: '#1e293b', lineHeight: 1.5, whiteSpace: 'pre-line' }}>
                    {post.message}
                  </p>

                  {post.mediaUrl && (
                    <div style={{ maxWidth: '240px', maxHeight: '140px', overflow: 'hidden', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                      <img src={post.mediaUrl} alt="Attached media" style={{ width: '100%', height: '140px', objectFit: 'cover' }} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* History of Past Scheduled Posts */}
      {pastPosts.length > 0 && (
        <div style={{ marginTop: '1.5rem' }}>
          <div className="section-header">
            <div>
              <h2 className="section-title">Execution History ({pastPosts.length})</h2>
              <p className="section-subtitle">Previously dispatched or processed scheduled posts</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {pastPosts.map((post) => (
              <div 
                key={post._id}
                style={{
                  background: 'white',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-light)',
                  padding: '1rem 1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem'
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                    <span className={`badge ${post.status === 'published' ? 'badge-live' : 'badge-demo'}`}>
                      {post.status.toUpperCase()}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {post.publishedAt ? `Published: ${new Date(post.publishedAt).toLocaleString()}` : ''}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {post.message}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
