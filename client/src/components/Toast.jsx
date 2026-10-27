import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useDashboard } from '../context/DashboardContext';

export const Toast = () => {
  const { toast } = useDashboard();

  if (!toast) return null;

  const icons = {
    success: <CheckCircle2 size={18} color="#10b981" />,
    error: <AlertCircle size={18} color="#ef4444" />,
    warning: <AlertCircle size={18} color="#f59e0b" />,
    info: <Info size={18} color="#1877F2" />
  };

  return (
    <div className="toast-container">
      <div className={`toast ${toast.type}`}>
        {icons[toast.type] || icons.info}
        <span style={{ flex: 1 }}>{toast.message}</span>
      </div>
    </div>
  );
};
