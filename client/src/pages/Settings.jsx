import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  ShieldCheck, 
  Server, 
  Database, 
  Key, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ExternalLink,
  Info
} from 'lucide-react';
import { useDashboard } from '../context/DashboardContext';
import { facebookApi } from '../services/facebookApi';

export const Settings = () => {
  const { pageData, showToast } = useDashboard();

  const [connectionTestResult, setConnectionTestResult] = useState(null);
  const [isTesting, setIsTesting] = useState(false);
  const [healthData, setHealthData] = useState(null);

  useEffect(() => {
    facebookApi.getHealth()
      .then((data) => setHealthData(data))
      .catch((err) => console.warn('Health check error:', err));
  }, []);

  const handleTestConnection = async () => {
    setIsTesting(true);
    setConnectionTestResult(null);
    try {
      const res = await facebookApi.getConnectionStatus();
      setConnectionTestResult(res);
      if (res.isConnected) {
        showToast('Facebook Graph API connection validated!', 'success');
      } else {
        showToast(res.message || 'Credentials unconfigured or invalid', 'warning');
      }
    } catch (err) {
      setConnectionTestResult({
        isConnected: false,
        message: err.message || 'Network communication error'
      });
      showToast(err.message || 'Connection test failed', 'error');
    } finally {
      setIsTesting(false);
    }
  };

  const isLive = pageData?.isLive;
  const isFacebookConfigured = healthData?.facebook?.isConfigured;
  const connectionFailed = connectionTestResult?.isConfigured && !connectionTestResult?.isConnected;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <SettingsIcon size={24} color="var(--primary)" />
          <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
            Settings & Connectivity
          </h1>
        </div>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          System diagnostics, Facebook Graph API credentials status, and MongoDB integration
        </p>
      </div>

      {/* Two Column Grid */}
      <div className="dashboard-grid-2">
        {/* Left Column: Connection Diagnostics */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Facebook Connection Card */}
          <div 
            style={{
              background: 'white',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-light)',
              padding: '1.5rem',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Key size={18} color="#1877F2" />
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  Facebook Graph API Connection
                </h2>
              </div>
              <span className={`badge ${isLive ? 'badge-live' : 'badge-demo'}`}>
                {isLive ? 'Live Graph API' : connectionFailed ? 'Connection Failed' : isFacebookConfigured ? 'Configured' : 'Demo / Preview'}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: '#f8fafc', borderRadius: '8px', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Configured Page ID</span>
                <strong style={{ fontFamily: 'monospace' }}>
                  {pageData?.isLive ? pageData.id : isFacebookConfigured ? 'Configured in server/.env' : 'Not configured'}
                </strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: '#f8fafc', borderRadius: '8px', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Page Access Token Status</span>
                <span style={{ color: isLive ? 'var(--success)' : 'var(--warning)', fontWeight: 600 }}>
                  {isLive
                    ? 'Connected and stored securely in backend'
                    : isFacebookConfigured
                      ? connectionFailed
                        ? 'Configured, but Meta rejected the token'
                        : 'Stored securely in backend; connection not yet validated'
                      : 'Not configured'}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: '#f8fafc', borderRadius: '8px', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Graph API Protocol Version</span>
                <strong>{healthData?.facebook?.apiVersion || pageData?.apiVersion || 'v25.0'}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: '#f8fafc', borderRadius: '8px', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Gemini (news captions)</span>
                <strong>{healthData?.gemini?.isConfigured ? `Configured (${healthData.gemini.model})` : 'Not configured'}</strong>
              </div>

              <button
                className="btn btn-primary"
                onClick={handleTestConnection}
                disabled={isTesting}
                style={{ marginTop: '0.5rem' }}
              >
                {isTesting ? <Loader2 size={16} className="spinning" /> : <ShieldCheck size={16} />}
                <span>Test Live Graph API Connection</span>
              </button>

              {/* Diagnostic Test Output */}
              {connectionTestResult && (
                <div 
                  style={{
                    padding: '1rem',
                    borderRadius: '8px',
                    fontSize: '0.825rem',
                    background: connectionTestResult.isConnected ? '#ecfdf5' : '#fffbeb',
                    border: `1px solid ${connectionTestResult.isConnected ? '#a7f3d0' : '#fde68a'}`,
                    color: connectionTestResult.isConnected ? '#065f46' : '#92400e'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                    {connectionTestResult.isConnected ? (
                      <CheckCircle2 size={16} color="#10b981" />
                    ) : (
                      <AlertCircle size={16} color="#f59e0b" />
                    )}
                    <span>
                      {connectionTestResult.isConnected
                        ? 'Connection Successful'
                        : connectionTestResult.isConfigured
                          ? 'Connection Failed'
                          : 'Credentials Not Configured'}
                    </span>
                  </div>
                  <p>{connectionTestResult.message}</p>
                  {connectionTestResult.code === 190 && connectionTestResult.subcode === 460 && (
                    <p style={{ marginTop: '0.5rem', fontWeight: 600 }}>
                      Replace the saved token with a newly generated Page Access Token, restart the backend, and test the connection again.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Database & Server Health Card */}
          <div 
            style={{
              background: 'white',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-light)',
              padding: '1.5rem',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <Database size={18} color="#10b981" />
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                System & Database Status
              </h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: '#f8fafc', borderRadius: '8px' }}>
                <span style={{ color: 'var(--text-muted)' }}>MongoDB Status</span>
                <span style={{ color: healthData?.database?.isConnected ? 'var(--success)' : 'var(--text-muted)', fontWeight: 700 }}>
                  {healthData?.database?.state || 'Connected'}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: '#f8fafc', borderRadius: '8px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Database Name</span>
                <strong>{healthData?.database?.database || 'facebook_automation'}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: '#f8fafc', borderRadius: '8px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Backend Server Port</span>
                <strong>5000</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Setup Instructions & Token Guide */}
        <div 
          style={{
            background: 'white',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-light)',
            padding: '1.5rem',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Info size={18} color="var(--primary)" />
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>
              How to Connect Your Real Facebook Page
            </h2>
          </div>

          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
            Follow these steps to connect your Facebook Page with full Graph API live posting and analytics capabilities:
          </p>

          <ol style={{ paddingLeft: '1.25rem', fontSize: '0.85rem', color: '#334155', display: 'flex', flexDirection: 'column', gap: '0.85rem', lineHeight: 1.5 }}>
            <li>
              <strong>Create or open a Meta Developer App:</strong>
              <div style={{ color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                Visit <a href="https://developers.facebook.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>developers.facebook.com</a> and create a "Business" type app.
              </div>
            </li>
            <li>
              <strong>Generate a User Token in Graph API Explorer:</strong>
              <div style={{ color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                Open the Graph API Explorer. Select your App, and grant permissions:
                <br />
                <code style={{ fontSize: '0.75rem', background: '#f1f5f9', padding: '0.2rem 0.4rem', borderRadius: '4px', display: 'inline-block', marginTop: '0.3rem' }}>
                  pages_show_list, pages_read_engagement, pages_manage_posts, pages_read_user_content
                </code>
              </div>
            </li>
            <li>
              <strong>Get your Page Access Token:</strong>
              <div style={{ color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                Call <code>GET /me/accounts</code> in the explorer to retrieve your Facebook Page ID and Page Access Token.
              </div>
            </li>
            <li>
              <strong>Add Credentials to <code>server/.env</code>:</strong>
              <div style={{ background: '#1e293b', color: '#f8fafc', padding: '0.75rem', borderRadius: '6px', fontSize: '0.75rem', fontFamily: 'monospace', marginTop: '0.35rem' }}>
                FACEBOOK_PAGE_ID=123456789<br />
                FACEBOOK_PAGE_ACCESS_TOKEN=EAAB...
              </div>
            </li>
            <li>
              <strong>Restart backend or refresh this page:</strong>
              <div style={{ color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                The dashboard will automatically switch to Live Graph API mode!
              </div>
            </li>
          </ol>

          <div style={{ padding: '0.85rem', background: '#ecfdf5', borderRadius: 'var(--radius-md)', border: '1px solid #a7f3d0', fontSize: '0.8rem', color: '#065f46' }}>
            🔒 <strong>Strict Security Architecture:</strong> The Facebook Page Access Token is strictly held on the Node.js backend. It is never exposed in browser network responses or client environment variables.
          </div>
        </div>
      </div>
    </div>
  );
};
