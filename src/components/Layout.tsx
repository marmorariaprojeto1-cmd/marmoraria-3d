import { Outlet } from 'react-router-dom';
import { Footer } from './Footer';
import { Header } from './Header';

export function Layout() {
  return (
    <div className="min-h-screen text-graphite">
      <Header />
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
