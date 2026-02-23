
import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import FeedPage from './pages/FeedPage';
import NewDemandPage from './pages/NewDemandPage';
import DemandDetailPage from './pages/DemandDetailPage';
import DemandOffersPage from './pages/DemandOffersPage';
import ProfilePage from './pages/ProfilePage';
import OrderPage from './pages/OrderPage';
import MyOffersPage from './pages/MyOffersPage';
import MyDemandsPage from './pages/MyDemandsPage';
import DashboardPage from './pages/DashboardPage';
import PremiumPage from './pages/PremiumPage';
import { DemandsProvider } from './context/DemandsContext';
import { AuthProvider, useAuth } from './context/AuthContext';

const AppContent: React.FC = () => {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-bold animate-pulse text-xs uppercase tracking-widest">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={!session ? <LoginPage /> : <Navigate to="/" replace />} />

        {/* Public Routes */}
        <Route path="/" element={<FeedPage />} />
        <Route path="/demanda/:id" element={<DemandDetailPage />} />

        {/* Protected Routes */}
        <Route path="/dashboard" element={session ? <DashboardPage /> : <Navigate to="/login" replace />} />
        <Route path="/demanda/nova" element={session ? <NewDemandPage /> : <Navigate to="/login" replace />} />
        <Route path="/demanda/editar/:id" element={session ? <NewDemandPage /> : <Navigate to="/login" replace />} />
        {/* Note: /demanda/:id is now public above */}
        <Route path="/demanda/:id/ofertas" element={session ? <DemandOffersPage /> : <Navigate to="/login" replace />} />
        <Route path="/demanda/:id/pedido" element={session ? <OrderPage /> : <Navigate to="/login" replace />} />
        <Route path="/pedido/:orderId" element={session ? <OrderPage /> : <Navigate to="/login" replace />} />
        <Route path="/minhas-demandas" element={session ? <MyDemandsPage /> : <Navigate to="/login" replace />} />
        <Route path="/ofertas" element={session ? <MyOffersPage /> : <Navigate to="/login" replace />} />
        <Route path="/perfil" element={session ? <ProfilePage /> : <Navigate to="/login" replace />} />
        {/* <Route path="/premium" element={session ? <PremiumPage /> : <Navigate to="/login" replace />} /> */}

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <DemandsProvider>
        <AppContent />
      </DemandsProvider>
    </AuthProvider>
  );
};

export default App;
