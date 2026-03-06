import React, { useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
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
import ResetPasswordPage from './pages/ResetPasswordPage';
import EditOfferPage from './pages/EditOfferPage';
import { DemandsProvider } from './context/DemandsContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { supabase } from './lib/supabase';

const AuthHandler: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // 1. Escuta eventos do Supabase (Ocorre quando o link é processado ou login via OTP)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      // Se houver rastro de recuperação na URL, força a ida para a página de reset
      // Fazemos isso para PASSWORD_RECOVERY, SIGNED_IN ou INITIAL_SESSION se for desse tipo.
      const isRecoveryUrl = window.location.hash.includes('type=recovery') ||
        window.location.hash.includes('access_token=') ||
        window.location.href.includes('type=recovery');

      if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && isRecoveryUrl)) {
        navigate('/reset-password');
      }
    });

    // 2. Checagem Manual da URL (Essencial para links clicados no e-mail no mobile)
    const checkRecoveryParams = () => {
      const fullUrl = window.location.href;
      if (fullUrl.includes('type=recovery') || fullUrl.includes('access_token=')) {
        navigate('/reset-password', { replace: true });
      }
    };

    checkRecoveryParams();

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  return null;
};

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

  // Se o usuário estiver logado e tentar acessar o /login, 
  // nós o mandamos para o dashboard, A MENOS que tenha indícios de recuperação na URL.
  const isRecovering = window.location.hash.includes('type=recovery') ||
    window.location.hash.includes('access_token=');

  return (
    <Router>
      <AuthHandler />
      <Routes>
        <Route path="/login" element={(session && !isRecovering) ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Public Routes */}
        <Route path="/" element={<FeedPage />} />
        <Route path="/demanda/:id" element={<DemandDetailPage />} />

        {/* Protected Routes */}
        <Route path="/dashboard" element={session ? <DashboardPage /> : <Navigate to="/login" replace />} />
        <Route path="/demanda/nova" element={session ? <NewDemandPage /> : <Navigate to="/login" replace />} />
        <Route path="/demanda/editar/:id" element={session ? <NewDemandPage /> : <Navigate to="/login" replace />} />
        <Route path="/demanda/:id/ofertas" element={session ? <DemandOffersPage /> : <Navigate to="/login" replace />} />
        <Route path="/demanda/:id/pedido" element={session ? <OrderPage /> : <Navigate to="/login" replace />} />
        <Route path="/pedido/:orderId" element={session ? <OrderPage /> : <Navigate to="/login" replace />} />
        <Route path="/minhas-demandas" element={session ? <MyDemandsPage /> : <Navigate to="/login" replace />} />
        <Route path="/ofertas" element={session ? <MyOffersPage /> : <Navigate to="/login" replace />} />
        <Route path="/oferta/editar/:offerId" element={session ? <EditOfferPage /> : <Navigate to="/login" replace />} />
        <Route path="/perfil" element={session ? <ProfilePage /> : <Navigate to="/login" replace />} />

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
