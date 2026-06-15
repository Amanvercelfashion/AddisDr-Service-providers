import { BrowserRouter, Routes, Route, useParams } from 'react-router-dom';
import { BusinessProvider } from './context/BusinessContext';
import { SuperAdminProvider } from './context/SuperAdminContext';
import { AdminAuthProvider } from './context/AdminAuthContext';
import { ThemeProvider } from './context/ThemeContext';

// Platform home
import PlatformHome from './pages/PlatformHome';

// Service storefront
import ServicePage from './pages/ServicePage';

// Business admin
import AdminLayout from './pages/admin/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import ServicesPage from './pages/admin/ServicesPage';
import CategoriesPage from './pages/admin/CategoriesPage';
import StaffPage from './pages/admin/StaffPage';
import WorkHoursPage from './pages/admin/WorkHoursPage';
import FeedbackPage from './pages/admin/FeedbackPage';
import SettingsPage from './pages/admin/SettingsPage';

// Super Admin
import SuperAdminLogin from './pages/superadmin/SuperAdminLogin';
import SuperAdminLayout from './pages/superadmin/SuperAdminLayout';
import SuperAdminDashboard from './pages/superadmin/SuperAdminDashboard';
import BusinessesPage from './pages/superadmin/BusinessesPage';

function BusinessBySlug() {
  const { slug } = useParams();
  return (
    <BusinessProvider key={slug} slug={slug}>
      <ThemeProvider>
        <ServicePage />
      </ThemeProvider>
    </BusinessProvider>
  );
}

const NotFound = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <h1 className="text-6xl font-bold text-gray-200 mb-4">404</h1>
      <p className="text-gray-500 mb-6">Page not found</p>
      <a href="/" className="btn-primary inline-block">Back to Home</a>
    </div>
  </div>
);

export default function App() {
  return (
    <BrowserRouter>
      <SuperAdminProvider>
        <AdminAuthProvider>
          <Routes>

            {/* ── Platform home ─────────────────────────────── */}
            <Route path="/" element={<PlatformHome />} />

            {/* ── Service storefront (business context) ─────── */}
            <Route
              path="/store"
              element={
                <BusinessProvider>
                  <ThemeProvider>
                    <ServicePage />
                  </ThemeProvider>
                </BusinessProvider>
              }
            />

            {/* ── Admin panel ───────────────────────────────── */}
            <Route
              path="/adminmanager"
              element={
                <BusinessProvider>
                  <AdminLayout />
                </BusinessProvider>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="services" element={<ServicesPage />} />
              <Route path="categories" element={<CategoriesPage />} />
              <Route path="staff" element={<StaffPage />} />
              <Route path="work-hours" element={<WorkHoursPage />} />
              <Route path="feedback" element={<FeedbackPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>

            {/* ── Super Admin ───────────────────────────────── */}
            <Route path="/superadmin" element={<SuperAdminLogin />} />
            <Route path="/superadmin" element={<SuperAdminLayout />}>
              <Route path="dashboard" element={<SuperAdminDashboard />} />
              <Route path="businesses" element={<BusinessesPage />} />
            </Route>

            {/* ── Business by subdomain slug ───────────────── */}
            <Route path="/:slug" element={<BusinessBySlug />} />

            {/* ── 404 ──────────────────────────────────────── */}
            <Route path="*" element={<NotFound />} />

          </Routes>
        </AdminAuthProvider>
      </SuperAdminProvider>
    </BrowserRouter>
  );
}
