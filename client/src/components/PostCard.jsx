import React from 'react';
import { ThumbsUp, MessageSquare, Share2, ExternalLink, Calendar } from 'lucide-react';
import { useDashboard } from '../context/DashboardContext';

export const PostCard = ({ post }) => {
  const { pageData } = useDashboard();

  const formattedDate = post.createdTime
    ? new Date(post.createdTime).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : 'Recent';

  return (
    <article className="post-card">
      {/* Post Header */}
      <div className="post-header">
        <div className="post-author-box">
          <img 
            src={pageData?.pictureUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200'} 
            alt={pageData?.name || 'Page'} 
            className="post-author-img"
          />
          <div>
            <div className="post-author-name">{pageData?.name || 'Facebook Page'}</div>
            <div className="post-meta-date" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Calendar size={12} />
              <span>{formattedDate}</span>
            </div>
          </div>
        </div>

        {post.permalinkUrl && (
          <a 
            href={post.permalinkUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="btn btn-outline btn-sm"
            style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
          >
            <span>View Post</span>
            <ExternalLink size={12} />
          </a>
        )}
      </div>

      {/* Post Content Message */}
      {post.message && (
        <div className="post-content">
          {post.message}
        </div>
      )}

      {/* Post Media (Image) */}
      {post.mediaUrl && (
        <div className="post-media-container">
          <img 
            src={post.mediaUrl} 
            alt="Facebook post attachment" 
            className="post-media-img"
            loading="lazy"
          />
        </div>
      )}

      {/* Engagement Stats Bar */}
      <div className="post-stats-row">
        <div className="post-actions-counters">
          <div className="post-counter-item likes" title="Likes / Reactions">
            <ThumbsUp size={15} />
            <span>{(post.likesCount || post.reactionsCount || 0).toLocaleString()}</span>
          </div>

          <div className="post-counter-item" title="Comments">
            <MessageSquare size={15} />
            <span>{(post.commentsCount || 0).toLocaleString()}</span>
          </div>

          <div className="post-counter-item" title="Shares">
            <Share2 size={15} />
            <span>{(post.sharesCount || 0).toLocaleString()}</span>
          </div>
        </div>

        <div style={{ fontWeight: 600, color: 'var(--text-muted)' }}>
          Total Engagement: <strong style={{ color: 'var(--text-main)' }}>{(post.engagementTotal || 0).toLocaleString()}</strong>
        </div>
      </div>
    </article>
  );
};
