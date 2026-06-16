import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/useAuth';

const adminNavGroups = [
  {
    label: 'Painel',
    items: [
      { to: '/admin', label: 'Dashboard', end: true },
      { to: '/admin/pedidos', label: 'Pedidos' },
    ],
  },
  {
    label: 'Catálogo',
    items: [
      { to: '/admin/pedras', label: 'Pedras' },
      { to: '/admin/cubas', label: 'Cubas' },
    ],
  },
  {
    label: 'Serviços',
    items: [
      { to: '/admin/recortes', label: 'Recortes' },
      { to: '/admin/furacoes', label: 'Furações' },
    ],
  },
  {
    label: 'Sistema',
    items: [
      { to: '/admin/configuracoes', label: 'Configurações' },
    ],
  },
];

export function AdminLayout() {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    navigate('/login', { replace: true });
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[240px_1fr]">
      <aside className="overflow-hidden rounded-lg border border-slate-800 bg-slate-950 text-white shadow-sm">
        <div className="border-b border-white/10 px-5 py-5">
          <p className="text-lg font-bold tracking-tight">
            Marmoraria 3D
          </p>
          <p className="mt-1 text-sm text-slate-400">
            Painel administrativo
          </p>
        </div>

        <nav className="flex gap-6 overflow-x-auto p-4 lg:flex-col lg:overflow-visible">
          {adminNavGroups.map((group) => (
            <div key={group.label} className="min-w-max lg:min-w-0">
              <p className="mb-3 px-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                {group.label}
              </p>
              <div className="flex gap-2 lg:flex-col">
                {group.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      [
                        'whitespace-nowrap rounded-md px-3 py-3 text-sm font-semibold transition',
                        isActive
                          ? 'bg-white/10 text-white shadow-sm ring-1 ring-white/10'
                          : 'text-slate-300 hover:bg-white/10 hover:text-white',
                      ].join(' ')
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-white/10 p-4">
          <button
            className="w-full rounded-md px-3 py-3 text-left text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
            type="button"
            onClick={handleSignOut}
          >
            Sair
          </button>
        </div>
      </aside>

      <div className="min-w-0 rounded-lg border border-stoneLine bg-white/60 p-5 shadow-sm">
        <Outlet />
      </div>
    </section>
  );
}
