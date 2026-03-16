
import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate, Outlet } from 'react-router-dom';
import { DataProvider } from './context/DataContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LocaleProvider, useLocale } from './context/LocaleContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import FloatingContact from './components/FloatingContact';
import LazyAIChatBot from './components/LazyAIChatBot';
import AppShellLoader from './components/AppShellLoader';
import AppErrorBoundary from './components/AppErrorBoundary';

const Home = lazy(() => import('./pages/Home'));
const Products = lazy(() => import('./pages/Products'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const AboutUs = lazy(() => import('./pages/AboutUs'));
const Contact = lazy(() => import('./pages/Contact'));
const News = lazy(() => import('./pages/News'));
const NewsDetail = lazy(() => import('./pages/NewsDetail'));
const CommercialTool = lazy(() => import('./pages/CommercialTool'));
const Operations = lazy(() => import('./pages/Operations'));
const Login = lazy(() => import('./pages/Login'));
const AdminDashboard = lazy(() => import('./pages/Admin/Dashboard'));
const AdminInventory = lazy(() => import('./pages/Admin/Inventory'));
const AdminNews = lazy(() => import('./pages/Admin/News'));

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();
  const { locale } = useLocale();

  if (isLoading) {
    return <AppShellLoader label={locale === 'zh' ? '正在检查安全会话...' : 'Checking secure session...'} compact />;
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (!isAdmin) return <Navigate to="/login" replace />;

  return <>{children}</>;
};

const PublicLayout: React.FC = () => {
  const { locale } = useLocale();

  return (
    <>
      <Navbar />
      <main className="flex-grow">
        <Suspense fallback={<AppShellLoader label={locale === 'zh' ? '正在加载页面...' : 'Loading page...'} compact />}>
          <Outlet />
        </Suspense>
      </main>
      <FloatingContact />
      <LazyAIChatBot />
      <Footer />
    </>
  );
};

const LocalizedAppBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { locale } = useLocale();
  return <AppErrorBoundary locale={locale}>{children}</AppErrorBoundary>;
};

const AppRoutes: React.FC = () => {
  const { locale } = useLocale();

  return (
    <LocalizedAppBoundary>
      <AuthProvider>
        <DataProvider>
          <Router>
            <ScrollToTop />
            <div className="min-h-screen flex flex-col font-sans antialiased text-gray-900 bg-white">
              <Routes>
                <Route
                  path="/login"
                  element={
                    <Suspense fallback={<AppShellLoader label={locale === 'zh' ? '正在加载登录页面...' : 'Loading sign-in...'} compact />}>
                      <Login />
                    </Suspense>
                  }
                />
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute>
                      <Suspense fallback={<AppShellLoader label={locale === 'zh' ? '正在加载后台总览...' : 'Loading dashboard...'} compact />}>
                        <AdminDashboard />
                      </Suspense>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/inventory"
                  element={
                    <ProtectedRoute>
                      <Suspense fallback={<AppShellLoader label={locale === 'zh' ? '正在加载产品库...' : 'Loading inventory...'} compact />}>
                        <AdminInventory />
                      </Suspense>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/news"
                  element={
                    <ProtectedRoute>
                      <Suspense fallback={<AppShellLoader label={locale === 'zh' ? '正在加载资讯中心...' : 'Loading insights...'} compact />}>
                        <AdminNews />
                      </Suspense>
                    </ProtectedRoute>
                  }
                />

                <Route element={<PublicLayout />}>
                  <Route path="/" element={<Home />} />
                  <Route path="/products" element={<Products />} />
                  <Route path="/products/:category" element={<Products />} />
                  <Route path="/product/:id" element={<ProductDetail />} />
                  <Route path="/about" element={<AboutUs />} />
                  <Route path="/news" element={<News />} />
                  <Route path="/news/:slug" element={<NewsDetail />} />
                  <Route path="/news/:legacyId/:legacySlug" element={<NewsDetail />} />
                  <Route path="/commercial-tool" element={<CommercialTool />} />
                  <Route path="/operations" element={<Operations />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Route>
              </Routes>
            </div>
          </Router>
        </DataProvider>
      </AuthProvider>
    </LocalizedAppBoundary>
  );
};

const App: React.FC = () => {
  return (
    <LocaleProvider>
      <AppRoutes />
    </LocaleProvider>
  );
};

export default App;
