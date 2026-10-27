import React from 'react';

export const LoadingSkeleton = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
      {/* Banner Skeleton */}
      <div className="skeleton" style={{ height: '60px', width: '100%' }}></div>

      {/* Stats Grid Skeleton */}
      <div className="stats-grid">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="stat-card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div className="skeleton" style={{ width: '40%', height: '14px' }}></div>
              <div className="skeleton" style={{ width: '36px', height: '36px', borderRadius: '8px' }}></div>
            </div>
            <div className="skeleton" style={{ width: '60%', height: '32px', marginBottom: '0.75rem' }}></div>
            <div className="skeleton" style={{ width: '50%', height: '12px' }}></div>
          </div>
        ))}
      </div>

      {/* Grid Content Skeleton */}
      <div className="dashboard-grid-2">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {[1, 2].map((i) => (
            <div key={i} className="post-card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                <div className="skeleton" style={{ width: '48px', height: '48px', borderRadius: '50%' }}></div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div className="skeleton" style={{ width: '30%', height: '14px' }}></div>
                  <div className="skeleton" style={{ width: '20%', height: '12px' }}></div>
                </div>
              </div>
              <div className="skeleton" style={{ width: '90%', height: '16px', marginBottom: '0.5rem' }}></div>
              <div className="skeleton" style={{ width: '75%', height: '16px', marginBottom: '1rem' }}></div>
              <div className="skeleton" style={{ width: '100%', height: '200px', borderRadius: '8px', marginBottom: '1rem' }}></div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="stat-card" style={{ height: '320px' }}>
            <div className="skeleton" style={{ width: '50%', height: '20px', marginBottom: '1.5rem' }}></div>
            <div className="skeleton" style={{ width: '100%', height: '220px', borderRadius: '8px' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};
