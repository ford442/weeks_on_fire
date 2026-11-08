import { useEffect } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';

/** Public-facing shell: no production tooling, no prompts, no crew tabs. */
const nav = [
  { to: '/', label: 'Home', end: true },
  { to: '/listen', label: 'Listen', end: false },
  { to: '/lace-waterfall', label: 'Lace Waterfall', end: false },
];

const titles: Record<string, string> = {
  '/': 'Weeks of Fire',
  '/listen': 'Listen · Weeks of Fire',
  '/lace-waterfall': 'Lace Waterfall · Weeks of Fire',
};

export const DISCLOSURE =
  'Weeks of Fire is a comedy series. Lace Waterfall is a fictional band from the show. Music and visuals are AI-generated.';

export default function PublicLayout() {
  const { pathname } = useLocation();

  useEffect(() => {
    const key = Object.keys(titles)
      .sort((a, b) => b.length - a.length)
      .find((path) => pathname.startsWith(path));
    document.title = (key && titles[key]) ?? 'Weeks of Fire';
  }, [pathname]);

  return (
    <div className="flex min-h-screen flex-col bg-[#0b0710] text-zinc-100">
      <header className="border-b border-fuchsia-950/60 bg-[radial-gradient(circle_at_top,_rgba(217,70,239,0.14),_transparent_55%)]">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-4 px-4 py-4 sm:px-6">
          <Link
            to="/"
            className="text-lg font-black uppercase tracking-[0.2em] text-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-300"
          >
            Weeks of Fire
          </Link>
          <nav aria-label="Public site" className="ml-auto">
            <ul className="flex gap-1">
              {nav.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      `rounded-full px-3 py-1.5 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-fuchsia-300 ${
                        isActive
                          ? 'bg-fuchsia-500/20 text-fuchsia-100'
                          : 'text-zinc-300 hover:text-white'
                      }`
                    }
                  >
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </header>

      <div className="flex-1">
        <Outlet />
      </div>

      <footer className="border-t border-zinc-900 py-6 text-xs text-zinc-500">
        <div className="mx-auto flex max-w-5xl flex-col gap-2 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>{DISCLOSURE}</p>
          <Link
            to="/show"
            className="shrink-0 underline-offset-2 hover:text-zinc-300 hover:underline"
          >
            Crew hub →
          </Link>
        </div>
      </footer>
    </div>
  );
}
