import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

// Initialize service layer
import { ServiceFactory } from './services/ServiceFactory';
import AuthService from './services/ModernAuthService';

// Get service factory instance and register core services
const serviceFactory = ServiceFactory.getInstance();
serviceFactory.registerService('auth', new AuthService());

const root = createRoot(document.getElementById('root')!);

root.render(
  <StrictMode>
    <App />
  </StrictMode>
);
