
import React, { useEffect } from 'react';
import { HashRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { DataProvider } from './context/DataContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import FloatingContact from './components/FloatingContact';
import AIChatBot from './components/AIChatBot';
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import AboutUs from './pages/AboutUs';
import Contact from './pages/Contact';
import News from './pages/News';
import NewsDetail from './pages/NewsDetail';
import CommercialTool from './pages/CommercialTool';
import Operations from './pages/Operations';
import Login from './pages/Login';
import AdminDashboard from './pages/Admin/Dashboard';
import AdminInventory from './pages/Admin/Inventory';
import AdminNews from './pages/Admin/News';

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();

  if (isLoading) return <div className="p-6">Checking session...</div>;

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (!isAdmin) return <Navigate to="/login" replace />;

  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <DataProvider>
        <Router>
          <ScrollToTop />
          <div className="min-h-screen flex flex-col font-sans antialiased text-gray-900 bg-white">
            <Routes>
              {/* Admin Routes - Separate Layout & Protected */}
              <Route path="/login" element={<Login />} />
              <Route path="/admin" element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              } />
              <Route path="/admin/inventory" element={
                <ProtectedRoute>
                  <AdminInventory />
                </ProtectedRoute>
              } />
              <Route path="/admin/news" element={
                <ProtectedRoute>
                  <AdminNews />
                </ProtectedRoute>
              } />
              
              {/* Public Routes */}
              <Route path="/*" element={
                <>
                  <Navbar />
                  <main className="flex-grow">
                    <Routes>
                      <Route path="/" element={<Home />} />
                      <Route path="/products" element={<Products />} />
                      <Route path="/products/:category" element={<Products />} />
                      <Route path="/product/:id" element={<ProductDetail />} />
                      <Route path="/about" element={<AboutUs />} />
                      <Route path="/news" element={<News />} />
                      <Route path="/news/:id" element={<NewsDetail />} />
                      <Route path="/commercial-tool" element={<CommercialTool />} />
                      <Route path="/operations" element={<Operations />} />
                      <Route path="/contact" element={<Contact />} />
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </main>
                  <FloatingContact />
                  <AIChatBot />
                  <Footer />
                </>
              } />
            </Routes>
          </div>
        </Router>
      </DataProvider>
    </AuthProvider>
  );
};

export default App;
