
import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useParams, Navigate, Outlet } from 'react-router-dom';
import { DataProvider } from './context/DataContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LocaleProvider, useLocale } from './context/LocaleContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import FloatingContact from './components/FloatingContact';
import LazyAIChatBot from './components/LazyAIChatBot';
import AppShellLoader from './components/AppShellLoader';
import AppErrorBoundary from './components/AppErrorBoundary';
import { appRoutes } from './lib/routes';

const Home = lazy(() => import('./pages/Home'));
const Products = lazy(() => import('./pages/Products'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const ProductRouteResolver = lazy(() => import('./pages/ProductRouteResolver'));
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
const AdminInteractiveMapContent = lazy(() => import('./pages/Admin/InteractiveMapContent'));

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
  const location = useLocation();

  if (isLoading) {
    return <AppShellLoader label={locale === 'zh' ? '正在检查安全会话...' : 'Checking secure session...'} compact />;
  }

  if (!isAuthenticated) {
    const redirectPath = `${location.pathname}${location.search}${location.hash}`;
    return <Navigate to={`${appRoutes.login}?redirect=${encodeURIComponent(redirectPath)}`} replace />;
  }

  if (!isAdmin) {
    const redirectPath = `${location.pathname}${location.search}${location.hash}`;
    return <Navigate to={`${appRoutes.login}?redirect=${encodeURIComponent(redirectPath)}`} replace />;
  }

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

const InteractiveMapLayout: React.FC = () => {
  const { locale } = useLocale();

  return (
    <Suspense fallback={<AppShellLoader label={locale === 'zh' ? 'æ­£åœ¨åŠ è½½äº’åŠ¨åœ°å›¾...' : 'Loading interactive map...'} compact />}>
      <Outlet />
    </Suspense>
  );
};

const LocalizedAppBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { locale } = useLocale();
  return <AppErrorBoundary locale={locale}>{children}</AppErrorBoundary>;
};

const LegacyProductCategoryRedirect: React.FC = () => {
  const { category } = useParams<{ category?: string }>();
  const location = useLocation();

  if (!category) {
    return <Navigate to={appRoutes.products} replace />;
  }

  return <Navigate to={`${appRoutes.products}/${category}${location.search}`} replace />;
};

const LegacyProductsRedirect: React.FC = () => {
  const location = useLocation();
  return <Navigate to={`${appRoutes.products}${location.search}`} replace />;
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
                  path={appRoutes.login}
                  element={
                    <Suspense fallback={<AppShellLoader label={locale === 'zh' ? '正在加载登录页面...' : 'Loading sign-in...'} compact />}>
                      <Login />
                    </Suspense>
                  }
                />
                <Route
                  path={appRoutes.admin}
                  element={
                    <ProtectedRoute>
                      <Suspense fallback={<AppShellLoader label={locale === 'zh' ? '正在加载后台总览...' : 'Loading dashboard...'} compact />}>
                        <AdminDashboard />
                      </Suspense>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path={appRoutes.adminInventory}
                  element={
                    <ProtectedRoute>
                      <Suspense fallback={<AppShellLoader label={locale === 'zh' ? '正在加载产品库...' : 'Loading inventory...'} compact />}>
                        <AdminInventory />
                      </Suspense>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path={appRoutes.adminNews}
                  element={
                    <ProtectedRoute>
                      <Suspense fallback={<AppShellLoader label={locale === 'zh' ? '正在加载资讯中心...' : 'Loading insights...'} compact />}>
                        <AdminNews />
                      </Suspense>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path={appRoutes.adminMapContent}
                  element={
                    <ProtectedRoute>
                      <Suspense fallback={<AppShellLoader label={locale === 'zh' ? '正在加载地图内容...' : 'Loading map content...'} compact />}>
                        <AdminInteractiveMapContent />
                      </Suspense>
                    </ProtectedRoute>
                  }
                />

                <Route element={<InteractiveMapLayout />}>
                  <Route path={appRoutes.commercialTool} element={<CommercialTool />} />
                  <Route path="/interactivemap" element={<Navigate to={appRoutes.commercialTool} replace />} />
                  <Route path={appRoutes.legacyCommercialTool} element={<Navigate to={appRoutes.commercialTool} replace />} />
                </Route>

                <Route element={<PublicLayout />}>
                  <Route path={appRoutes.home} element={<Home />} />
                  <Route path={appRoutes.products} element={<Products />} />
                  <Route path={`${appRoutes.productBase}/:id`} element={<ProductDetail />} />
                  <Route path={`${appRoutes.products}/:slug`} element={<ProductRouteResolver />} />
                  <Route path={appRoutes.legacyProducts} element={<LegacyProductsRedirect />} />
                  <Route path={`${appRoutes.legacyProducts}/:category`} element={<LegacyProductCategoryRedirect />} />
                  <Route path={appRoutes.about} element={<AboutUs />} />
                  <Route path={appRoutes.news} element={<News />} />
                  <Route path={`${appRoutes.news}/:slug`} element={<NewsDetail />} />
                  <Route path={`${appRoutes.news}/:legacyId/:legacySlug`} element={<NewsDetail />} />
                  <Route path={appRoutes.operations} element={<Operations />} />
                  <Route path={appRoutes.contact} element={<Contact />} />
                  <Route path="*" element={<Navigate to={appRoutes.home} replace />} />
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
