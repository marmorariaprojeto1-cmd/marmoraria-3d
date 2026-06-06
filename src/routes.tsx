import { createBrowserRouter } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ProtectedAdminPage } from './pages/AdminPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminPlaceholderPage } from './pages/admin/AdminPlaceholderPage';
import { SinksPage } from './pages/admin/SinksPage';
import { StonesPage } from './pages/admin/StonesPage';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { SimulatorPage } from './pages/SimulatorPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: 'simulador',
        element: <SimulatorPage />,
      },
      {
        path: 'login',
        element: <LoginPage />,
      },
      {
        path: 'admin',
        element: <ProtectedAdminPage />,
        children: [
          {
            index: true,
            element: <AdminDashboardPage />,
          },
          {
            path: 'pedidos',
            element: (
              <AdminPlaceholderPage
                eyebrow="Pedidos"
                title="Pedidos recebidos"
                description="Lista futura de pedidos e oportunidades enviadas pelos clientes."
              />
            ),
          },
          {
            path: 'pedras',
            element: <StonesPage />,
          },
          {
            path: 'cubas',
            element: <SinksPage />,
          },
          {
            path: 'acabamentos',
            element: (
              <AdminPlaceholderPage
                eyebrow="Catálogo"
                title="Acabamentos"
                description="Gestão futura de acabamentos, bordas, rodabancas e saias."
              />
            ),
          },
          {
            path: 'produtos',
            element: (
              <AdminPlaceholderPage
                eyebrow="Catálogo"
                title="Produtos"
                description="Gestão futura dos tipos de peças oferecidos pela marmoraria."
              />
            ),
          },
          {
            path: 'configuracoes',
            element: (
              <AdminPlaceholderPage
                eyebrow="Empresa"
                title="Configurações"
                description="Configurações futuras da empresa, WhatsApp, dados comerciais e preferências."
              />
            ),
          },
        ],
      },
    ],
  },
]);
