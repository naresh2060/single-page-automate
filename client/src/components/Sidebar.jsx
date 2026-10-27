import React from 'react';
import { 
  LayoutDashboard, 
  Flag, 
  FileText, 
  CalendarClock, 
  BarChart3, 
  Bot,
  Newspaper,
  Settings, 
  ExternalLink,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useDashboard } from '../context/DashboardContext';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'page', label: 'Facebook Page', icon: Flag },
  { id: 'posts', label: 'Posts', icon: FileText },
  { id: 'scheduler', label: 'Scheduler', icon: CalendarClock },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'automation', label: 'Automation', icon: Bot },
  { id: 'news', label: 'News Automation', icon: Newspaper },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export const Sidebar = () => {
  const { 
    activeTab, 
    setActiveTab, 
    pageData, 
    mobileSidebarOpen, 
    setMobileSidebarOpen,
    scheduledPosts 
  } = useDashboard();

  const handleSelect = (tabId) => {
    setActiveTab(tabId);
    if (mobileSidebarOpen) {
      setMobileSidebarOpen(false);
    }
  };

  const isLive = pageData?.isLive;

  return (
    <aside className={`sidebar ${mobileSidebarOpen ? 'open' : ''}`}>
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="brand-icon-box">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
        </div>
        <div className="brand-text">
          <h1>MetaSync</h1>
          <p>Page Automation</p>
        </div>
      </div>

      {/* Connected Page Mini-Card */}
      {pageData && (
        <div className="sidebar-page-card" onClick={() => handleSelect('page')} style={{ cursor: 'pointer' }}>
          <img 
            src={pageData.pictureUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200'} 
            alt={pageData.name} 
            className="sidebar-page-avatar"
          />
          <div className="sidebar-page-info">
            <div className="sidebar-page-name">{pageData.name || 'Facebook Page'}</div>
            <div className="sidebar-page-status">
              <span className={`status-dot ${isLive ? '' : 'demo'}`}></span>
              {isLive ? 'Live Graph API' : 'Preview Demo'}
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const badgeCount = item.id === 'scheduler' ? scheduledPosts.filter(p => p.status === 'pending').length : null;

          return (
            <div
              key={item.id}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => handleSelect(item.id)}
            >
              <div className="nav-item-left">
                <Icon size={19} />
                <span>{item.label}</span>
              </div>
              {badgeCount > 0 && (
                <span className="badge badge-blue" style={{ fontSize: '0.7rem', padding: '0.1rem 0.5rem' }}>
                  {badgeCount}
                </span>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer System Status */}
      <div className="sidebar-footer">
        <div className="meta-status-pill">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            {isLive ? (
              <CheckCircle2 size={14} color="#10b981" />
            ) : (
              <AlertCircle size={14} color="#f59e0b" />
            )}
            <span>{isLive ? 'Graph API Active' : 'Demo Mode'}</span>
          </div>
          <span style={{ fontWeight: 700, fontSize: '0.7rem' }}>{pageData?.apiVersion || 'v25.0'}</span>
        </div>
      </div>
    </aside>
  );
};
