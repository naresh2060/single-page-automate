import React from 'react';
import { 
  Globe, 
  ExternalLink, 
  ShieldCheck, 
  Users, 
  Mail, 
  Phone, 
  Calendar, 
  Server, 
  Layers, 
  Activity,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { useDashboard } from '../context/DashboardContext';
import { LoadingSkeleton } from '../components/LoadingSkeleton';

export const FacebookPage = () => {
  const { pageData, loading, refreshData, refreshing } = useDashboard();

  if (loading || !pageData) {
    return <LoadingSkeleton />;
  }

  const isLive = pageData.isLive;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Cover & Profile Banner */}
      <div 
        style={{
          background: 'white',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border-light)',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <div 
          style={{
            height: '240px',
            backgroundImage: `url(${pageData.coverUrl || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200'})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            position: 'relative'
          }}
        >
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 60%)' }} />
        </div>

        <div style={{ padding: '0 2rem 2rem', marginTop: '-65px', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1.25rem' }}>
              <img
                src={pageData.pictureUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200'}
                alt={pageData.name}
                style={{
                  width: '120px',
                  height: '120px',
                  borderRadius: '50%',
                  border: '4px solid white',
                  boxShadow: 'var(--shadow-lg)',
                  objectFit: 'cover',
                  background: 'white'
                }}
              />
              <div style={{ marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
                    {pageData.name}
                  </h1>
                  {pageData.isVerified && (
                    <ShieldCheck size={24} color="#1877F2" title="Verified Facebook Page" />
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.2rem' }}>
                  <span className="badge badge-blue">{pageData.category || 'General Page'}</span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    ID: <code>{pageData.id}</code>
                  </span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              {pageData.link && (
                <a
                  href={pageData.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary"
                >
                  <ExternalLink size={16} />
                  <span>Open on Facebook</span>
                </a>
              )}
            </div>
          </div>

          {/* Quick Metrics Row */}
          <div 
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
              padding: '1.25rem',
              backgroundColor: 'var(--bg-app)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-light)'
            }}
          >
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                Total Followers
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.2rem' }}>
                {(pageData.followersCount || 0).toLocaleString()}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                Fan Count / Page Likes
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.2rem' }}>
                {(pageData.fanCount || 0).toLocaleString()}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                Verification Status
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.35rem' }}>
                <span className={`badge ${pageData.isVerified ? 'badge-live' : 'badge-demo'}`}>
                  {pageData.verificationStatus || (pageData.isVerified ? 'Verified' : 'Unverified')}
                </span>
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                Data Source Status
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.35rem' }}>
                <span className={`badge ${isLive ? 'badge-live' : 'badge-demo'}`}>
                  {isLive ? 'Live Graph API' : 'Preview Demo Mode'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Section: Page Details & API Diagnostics */}
      <div className="dashboard-grid-2">
        {/* About & Contact Information */}
        <div 
          style={{
            background: 'white',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-light)',
            padding: '1.75rem',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1.25rem', color: 'var(--text-main)' }}>
            Page Information & About
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.35rem' }}>
                About / Description
              </div>
              <p style={{ fontSize: '0.925rem', color: '#334155', lineHeight: 1.6 }}>
                {pageData.about || 'No description provided by the Facebook Page.'}
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-light)' }}>
              {pageData.website && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <Globe size={18} color="var(--primary)" />
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Official Website</div>
                    <a href={pageData.website} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--primary)' }}>
                      {pageData.website}
                    </a>
                  </div>
                </div>
              )}

              {pageData.phone && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <Phone size={18} color="#10b981" />
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Phone</div>
                    <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{pageData.phone}</span>
                  </div>
                </div>
              )}

              {pageData.emails && pageData.emails.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <Mail size={18} color="#8b5cf6" />
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Contact Email</div>
                    <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{pageData.emails.join(', ')}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Live Graph API Diagnostics Card */}
        <div 
          style={{
            background: 'white',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-light)',
            padding: '1.75rem',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <Server size={18} color="var(--primary)" />
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Meta Graph Diagnostics
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div style={{ padding: '0.75rem', background: 'var(--bg-app)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Connection Protocol</div>
              <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-main)' }}>
                Meta Graph API {pageData.apiVersion || 'v25.0'} (REST)
              </div>
            </div>

            <div style={{ padding: '0.75rem', background: 'var(--bg-app)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Authentication Model</div>
              <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-main)' }}>Long-lived Page Access Token (Backend Env)</div>
            </div>

            <div style={{ padding: '0.75rem', background: 'var(--bg-app)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Graph Endpoint</div>
              <div style={{ fontWeight: 600, fontSize: '0.8rem', fontFamily: 'monospace', color: '#1e293b' }}>
                GET /{pageData.id}?fields=id,name,fan_count...
              </div>
            </div>

            {pageData.notice && (
              <div style={{ padding: '0.85rem', background: '#fffbeb', borderRadius: 'var(--radius-md)', border: '1px solid #fde68a', fontSize: '0.8rem', color: '#92400e' }}>
                {pageData.notice}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
