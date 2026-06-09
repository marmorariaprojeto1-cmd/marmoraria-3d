import { createBrowserRouter } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ProtectedAdminPage } from './pages/AdminPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { CommercialProductsPage } from './pages/admin/CommercialProductsPage';
import { CompanySettingsPage } from './pages/admin/CompanySettingsPage';
import { FinishesPage } from './pages/admin/FinishesPage';
import { OrdersPage } from './pages/admin/OrdersPage';
import { ProductsPage } from './pages/admin/ProductsPage';
import { SinksPage } from './pages/admin/SinksPage';
import { StonesPage } from './pages/admin/StonesPage';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { Preview3DPage } from './pages/Preview3DPage';
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
        path: 'preview-3d',
        element: <Preview3DPage />,
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
            element: <OrdersPage />,
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
            element: <FinishesPage />,
          },
          {
            path: 'produtos',
            element: <ProductsPage />,
          },
          {
            path: 'produtos-comerciais',
            element: <CommercialProductsPage />,
          },
          {
            path: 'configuracoes',
            element: <CompanySettingsPage />,
          },
        ],
      },
    ],
  },
]);
