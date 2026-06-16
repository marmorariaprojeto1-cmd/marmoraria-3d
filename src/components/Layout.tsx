import { Outlet, useLocation } from 'react-router-dom';
import { Footer } from './Footer';
import { Header } from './Header';

export function Layout() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');
  const isConfigurator =
    location.pathname === '/simulador' ||
    location.pathname === '/configurador-tampo';

  return (
    <div className="min-h-screen text-graphite">
      <Header />
      <main
        className={[
          'mx-auto w-full py-8 sm:py-10',
          isConfigurator
            ? 'max-w-none px-2 sm:px-3 lg:px-4'
            : `px-4 sm:px-6 lg:px-8 ${isAdmin ? 'max-w-[1600px]' : 'max-w-6xl'}`,
        ].join(' ')}
      >
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
