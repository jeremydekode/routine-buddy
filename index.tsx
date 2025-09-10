import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AppProvider } from './hooks/useAppContext';
import { AuthGate } from './components/AuthGate';   // 👈 add this

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <AuthGate>
      <AppProvider>
        <App />
      </AppProvider>
    </AuthGate>
  </React.StrictMode>
);
