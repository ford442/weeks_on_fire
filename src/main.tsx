import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

import { appRoutes } from './routes/appRoutes';
import { routerBasename } from './lib/basePath';
import { registerServiceWorker } from './lib/serviceWorker';
import './styles.css';

const router = createBrowserRouter(appRoutes, { basename: routerBasename() });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);

registerServiceWorker();
