import React, { useState, useMemo } from 'react';
import { Search, Plus, Filter, FileText, ArrowUpDown } from 'lucide-react';
import { useDashboard } from '../context/DashboardContext';
import { PostCard } from '../components/PostCard';
import { LoadingSkeleton } from '../components/LoadingSkeleton';

export const Posts = () => {
  const { posts, loading, setIsCreatePostOpen } = useDashboard();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'engagement'

  const filteredPosts = useMemo(() => {
    let result = [...posts];

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (p) =>
          p.message?.toLowerCase().includes(term) ||
          p.story?.toLowerCase().includes(term)
      );
    }

    if (sortBy === 'engagement') {
      result.sort((a, b) => (b.engagementTotal || 0) - (a.engagementTotal || 0));
    } else {
      result.sort((a, b) => new Date(b.createdTime || 0) - new Date(a.createdTime || 0));
    }

    return result;
  }, [posts, searchTerm, sortBy]);

  if (loading) {
    return <LoadingSkeleton />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Top Header & Search Bar */}
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          background: 'white',
          padding: '1.25rem 1.5rem',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-light)',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.01em' }}>
            Facebook Posts
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Showing {filteredPosts.length} published posts synced from Page Feed
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Search Input */}
          <div style={{ position: 'relative', minWidth: '240px' }}>
            <Search 
              size={16} 
              color="var(--text-muted)" 
              style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} 
            />
            <input
              type="text"
              className="form-control"
              placeholder="Search posts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '2.5rem', height: '38px' }}
            />
          </div>

          {/* Sort Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <select
              className="form-control"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{ height: '38px', width: 'auto', fontSize: '0.85rem' }}
            >
              <option value="newest">Sort by: Most Recent</option>
              <option value="engagement">Sort by: Highest Engagement</option>
            </select>
          </div>

          {/* Create Button */}
          <button className="btn btn-primary" onClick={() => setIsCreatePostOpen(true)}>
            <Plus size={16} />
            <span>Create Post</span>
          </button>
        </div>
      </div>

      {/* Posts Feed */}
      <div>
        {filteredPosts.length === 0 ? (
          <div 
            style={{
              background: 'white',
              padding: '4rem 2rem',
              borderRadius: 'var(--radius-lg)',
              textAlign: 'center',
              border: '1px solid var(--border-light)'
            }}
          >
            <FileText size={48} color="var(--text-subtle)" style={{ marginBottom: '1rem' }} />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem' }}>No Posts Matching Query</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
              {searchTerm ? `No posts matching "${searchTerm}". Try a different keyword.` : 'No posts currently published on this Facebook Page.'}
            </p>
            {searchTerm && (
              <button className="btn btn-outline btn-sm" onClick={() => setSearchTerm('')}>
                Clear Search Filter
              </button>
            )}
          </div>
        ) : (
          <div style={{ maxWidth: '850px', margin: '0 auto', width: '100%' }}>
            {filteredPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
