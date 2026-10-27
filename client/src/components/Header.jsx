import React from 'react';
import { RefreshCw, Plus, Menu, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useDashboard } from '../context/DashboardContext';

export const Header = () => {
  const { 
    pageData, 
    refreshData, 
    refreshing, 
    setIsCreatePostOpen,
    mobileSidebarOpen,
    setMobileSidebarOpen
  } = useDashboard();

  const isLive = pageData?.isLive;

  return (
    <header className="header">
      <div className="header-left">
        <button 
          className="mobile-nav-toggle"
          onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          aria-label="Toggle navigation menu"
        >
          <Menu size={22} />
        </button>

        {pageData && (
          <div className="page-badge-container">
            <img 
              src={pageData.pictureUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200'} 
              alt={pageData.name} 
              className="header-avatar" 
            />
            <div>
              <div className="header-page-title">
                {pageData.name || 'Facebook Page'}
                {pageData.isVerified && (
                  <ShieldCheck size={16} color="#1877F2" title="Verified Facebook Page" />
                )}
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {pageData.category || 'Business Page'} • ID: {pageData.id || 'N/A'}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="header-right">
        {/* Status Badge */}
        <div className={`badge ${isLive ? 'badge-live' : 'badge-demo'}`}>
          {isLive ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />}
          <span>{isLive ? 'Live Graph API' : 'Preview Demo Mode'}</span>
        </div>

        {/* Refresh Button */}
        <button 
          className={`btn-refresh ${refreshing ? 'spinning' : ''}`}
          onClick={refreshData}
          disabled={refreshing}
          title="Refresh Facebook Page data"
        >
          <RefreshCw size={17} />
        </button>

        {/* Create Post Button */}
        <button 
          className="btn btn-primary"
          onClick={() => setIsCreatePostOpen(true)}
        >
          <Plus size={16} />
          <span>Create Post</span>
        </button>
      </div>
    </header>
  );
};
