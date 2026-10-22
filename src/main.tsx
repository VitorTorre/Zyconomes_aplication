import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';
import { onCLS, onINP, onLCP, onFCP, onTTFB } from 'web-vitals';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);

// Capture performance metrics and log to console as requested
const logVitals = (metric: any) => {
  console.log(`[Web Vitals] ${metric.name}:`, Math.round(metric.value), 'ms/score');
};

onCLS(logVitals);
onINP(logVitals);
onLCP(logVitals);
onFCP(logVitals);
onTTFB(logVitals);
