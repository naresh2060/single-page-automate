import React from 'react';
import { Info, CheckCircle2, ArrowRight, AlertCircle } from 'lucide-react';
import { useDashboard } from '../context/DashboardContext';

export const StatusBanner = () => {
  const { pageData, error, setActiveTab } = useDashboard();

  if (error) {
    return (
      <div className="status-banner error" role="alert">
        <div className="status-banner-content">
          <AlertCircle size={20} />
          <div className="status-banner-text">
            <h4>Facebook Page connection failed</h4>
            <p>{error} Check the connection details in Settings after updating the Page Access Token.</p>
          </div>
        </div>
        <button
          className="btn btn-outline btn-sm"
          onClick={() => setActiveTab('settings')}
          style={{ whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
        >
          <span>View Details</span>
          <ArrowRight size={14} />
        </button>
      </div>
    );
  }

  if (!pageData) return null;

  const isLive = pageData.isLive;

  if (isLive) {
    return (
      <div className="status-banner live">
        <div className="status-banner-content">
          <CheckCircle2 size={20} />
          <div className="status-banner-text">
            <h4>Live Meta Graph API Connected</h4>
            <p>Directly synchronized with Facebook Page: <strong>{pageData.name}</strong> (ID: {pageData.id}).</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="status-banner demo">
      <div className="status-banner-content">
        <Info size={20} />
        <div className="status-banner-text">
          <h4>Running in Interactive Demo Mode</h4>
          <p>
            You are viewing sample metrics and posts. To connect your real Facebook Page, configure <code>FACEBOOK_PAGE_ID</code> and <code>FACEBOOK_PAGE_ACCESS_TOKEN</code> in <code>server/.env</code>.
          </p>
        </div>
      </div>
      <button 
        className="btn btn-outline btn-sm"
        onClick={() => setActiveTab('settings')}
        style={{ whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
      >
        <span>Configure Keys</span>
        <ArrowRight size={14} />
      </button>
    </div>
  );
};
