import { Routes, Route, Navigate, Outlet } from 'react-router';
import Register from './features/auth/authForm/Register';
import Login from './features/auth/authForm/Login';
import Inventory from './features/inventory/Inventory.tsx';
import NavBar from './components/NavBar.tsx';
import './assets/index.css';
import Warehouse from './features/warehouse/warehouse.tsx';
import { ToastProvider } from './features/toast';
import { SettingsLayout } from './features/settings/Settings.tsx';
import { useTheme } from './features/theme/hooks/useTheme.tsx';
import { AccountSettings } from './features/settings/components/AccountSettings.tsx';
import { WarehouseSettings } from './features/settings/components/WarehouseSettings.tsx';
import PreferenceSettings from './features/settings/components/PreferenceSettings.tsx';
import { AuthProvider, useAuth } from './features/auth/authContext/';
import InviteManager from './features/invite/invite.tsx';
import Homepage from './features/homepage/Homepage.tsx';
import CreateOrganization from './features/organization/Create Organization.tsx';

function ProtectedRoute() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}

function GuestRoute() {
  const { isAuthenticated } = useAuth();
  return !isAuthenticated ? <Outlet /> : <Navigate to="/warehouse" replace />;
}
export function AppLayout() {
  return (
    <div className="min-h-screen bg-base-200">
      <header className="w-full lg:max-w-3/5 mx-auto py-3 rounded-2xl">
        <NavBar />
      </header>
      <main className="h-full py-12 px-4 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}

export function HomeLayout() {
  return (
    <div className="min-h-screen bg-base-200">
      <Outlet />
    </div>
  );
}
function AppContent() {
  const { loading } = useAuth();
  useTheme();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-xl font-semibold">Loading your session...</div>
      </div>
    );
  }

  return (
    <ToastProvider>
      <Routes>
        <Route element={<GuestRoute />}>
          <Route element={<HomeLayout />}>
            <Route path="/" element={<Homepage />} />
          </Route>
          <Route element={<AppLayout />}>
            <Route path="/register" element={<Register />} />
            <Route path="/register/verify" element={<CreateOrganization />} />
            <Route path="/login" element={<Login />} />
            <Route path="/logout" element={<Navigate to="/login" replace />} />
            <Route path="/invite/accept" element={<InviteManager />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/warehouse" element={<Warehouse />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/settings" element={<SettingsLayout />}>
              <Route index element={<Navigate to="account" replace />} />

              <Route path="account" element={<AccountSettings />} />
              <Route path="warehouses" element={<WarehouseSettings />} />
              <Route path="preferences" element={<PreferenceSettings />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<div className="p-10">404 - Page Not Found</div>} />
      </Routes>
    </ToastProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}