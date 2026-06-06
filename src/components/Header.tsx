import { NavLink } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';

const navItems = [
  { to: '/', label: 'Home' },
  { to: '/simulador', label: 'Simulador' },
  { to: '/admin', label: 'Admin' },
];

export function Header() {
  const { signOut, user } = useAuth();

  return (
    <header className="border-b border-stoneLine bg-white">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <div>
          <p className="text-lg font-semibold tracking-normal text-graphite">
            Marmoraria 3D
          </p>
          <p className="text-sm text-stone-600">Fundação técnica do MVP</p>
        </div>
        <nav className="flex flex-wrap gap-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                [
                  'rounded-md px-3 py-2 text-sm font-medium transition',
                  isActive
                    ? 'bg-graphite text-white'
                    : 'text-stone-700 hover:bg-stone-100',
                ].join(' ')
              }
            >
              {item.label}
            </NavLink>
          ))}
          {user ? (
            <button
              className="rounded-md px-3 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-100"
              type="button"
              onClick={() => void signOut()}
            >
              Sair
            </button>
          ) : (
            <NavLink
              to="/login"
              className={({ isActive }) =>
                [
                  'rounded-md px-3 py-2 text-sm font-medium transition',
                  isActive
                    ? 'bg-graphite text-white'
                    : 'text-stone-700 hover:bg-stone-100',
                ].join(' ')
              }
            >
              Login
            </NavLink>
          )}
        </nav>
      </div>
    </header>
  );
}
