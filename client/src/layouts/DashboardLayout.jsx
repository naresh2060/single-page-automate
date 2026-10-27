import React from 'react';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';
import { CreatePostModal } from '../components/CreatePostModal';
import { Toast } from '../components/Toast';

export const DashboardLayout = ({ children }) => {
  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-wrapper">
        <Header />
        <main className="content-area">
          {children}
        </main>
      </div>
      <CreatePostModal />
      <Toast />
    </div>
  );
};
