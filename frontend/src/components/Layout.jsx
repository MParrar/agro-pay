import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const NAV_ITEMS = [
  { to: '/', label: 'Registro', icon: '📝', end: true },
  { to: '/trabajadores', label: 'Trabajadores', icon: '👷' },
  { to: '/planilla', label: 'Planilla', icon: '💵' },
  { to: '/ajustes', label: 'Ajustes', icon: '⚙️' },
];

export default function Layout() {
  const { logout } = useAuth();

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 bg-brand-800 pt-[env(safe-area-inset-top)] text-white shadow print:hidden">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <span className="text-lg font-bold tracking-tight">🍒 Agro-Pay</span>

          <nav className="hidden gap-1 md:flex">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-1.5 text-sm font-medium ${isActive ? 'bg-white/20' : 'hover:bg-white/10'}`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <button onClick={logout} className="rounded-lg px-3 py-1.5 text-sm font-medium hover:bg-white/10">
            Salir
          </button>
        </div>

        {/* Tab row under the title on mobile */}
        <nav className="grid grid-cols-4 border-t border-white/10 md:hidden">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 border-b-2 py-2 text-xs font-medium ${
                  isActive ? 'border-white text-white' : 'border-transparent text-white/70'
                }`
              }
            >
              <span className="text-lg leading-none">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-4 print:max-w-none print:p-0">
        <Outlet />
      </main>
    </div>
  );
}
