/* eslint-disable react-refresh/only-export-components -- test helper, never hot-reloaded */
import { render } from '@testing-library/react';
import { createMemoryRouter, Outlet, RouterProvider, useLocation } from 'react-router-dom';

import { appRoutes } from '../routes/appRoutes';

/** `location` / `search` outputs a test can read to see where the router ended up. */
function LocationProbe() {
  const location = useLocation();
  return (
    <>
      <output data-testid="location">{location.pathname}</output>
      <output data-testid="search">{location.search}</output>
    </>
  );
}

/** Renders the real route tree at `path` in a memory data router, with a `LocationProbe`. */
export function renderApp(path = '/') {
  const router = createMemoryRouter(
    [
      {
        element: (
          <>
            <Outlet />
            <LocationProbe />
          </>
        ),
        children: appRoutes,
      },
    ],
    { initialEntries: [path] },
  );
  return { router, ...render(<RouterProvider router={router} />) };
}
