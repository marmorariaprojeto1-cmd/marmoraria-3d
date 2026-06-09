import { NavLink, Outlet } from 'react-router-dom';

const adminNavItems = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/pedidos', label: 'Pedidos' },
  { to: '/admin/pedras', label: 'Pedras' },
  { to: '/admin/cubas', label: 'Cubas' },
  { to: '/admin/acabamentos', label: 'Acabamentos' },
  { to: '/admin/produtos', label: 'Produtos' },
  { to: '/admin/produtos-comerciais', label: 'Produtos Comerciais' },
  { to: '/admin/configuracoes', label: 'Configurações' },
];

export function AdminLayout() {
  return (
    <section className="grid gap-6 lg:grid-cols-[240px_1fr]">
      <aside className="surface-card h-fit p-4">
        <div className="mb-5">
          <p className="text-xs font-semibold uppercase text-moss">Painel</p>
          <h2 className="mt-1 text-lg font-semibold text-graphite">
            Administração
          </h2>
        </div>
        <nav className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
          {adminNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                [
                  'whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition',
                  isActive
                    ? 'bg-graphite text-white'
                    : 'text-stone-700 hover:bg-stone-100 hover:text-graphite',
                ].join(' ')
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="min-w-0">
        <Outlet />
      </div>
    </section>
  );
}
