import React, { lazy, Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './pwaInstall';
import Landing from './landing/Landing';
import AppSkeleton from './components/Layout/AppSkeleton';
import NotFound from './landing/NotFound';
import { shouldShowLanding, isKnownRoute } from './landing/entry';

const AppRoot = lazy(() => import('./AppRoot'));

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {!isKnownRoute() ? (
      <NotFound />
    ) : shouldShowLanding() ? (
      <Landing />
    ) : (
      <Suspense fallback={<AppSkeleton />}>
        <AppRoot />
      </Suspense>
    )}
  </React.StrictMode>
);
