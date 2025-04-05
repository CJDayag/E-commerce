import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import RootErrorBoundary from './RootErrorBoundary';
import { AuthProvider } from './context/AuthContext';
import { HelmetProvider } from 'react-helmet-async';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <RootErrorBoundary>
      <HelmetProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </HelmetProvider>
    </RootErrorBoundary>
  </React.StrictMode>
);
