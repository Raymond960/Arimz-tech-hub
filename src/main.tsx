import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerServiceWorker } from './utils/offlineCache';
import { ThemeProvider } from './context/ThemeContext';
import { BrandingProvider } from './context/BrandingContext';
import { UserAuthProvider } from './context/UserAuthContext';
import { ErrorBoundary } from './components/ErrorBoundary';

registerServiceWorker();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <BrandingProvider>
          <UserAuthProvider>
            <App />
          </UserAuthProvider>
        </BrandingProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </StrictMode>,
);

