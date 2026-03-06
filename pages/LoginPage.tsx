import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

type AuthMode = 'login' | 'register' | 'forgot' | 'otp';

const LoginPage: React.FC = () => {
  const { session } = useAuth();
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpToken, setOtpToken] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('both');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(0);
  const navigate = useNavigate();

  // Timer para o botão de reenviar código
  useEffect(() => {
    if (resendTimer > 0) {
      const interval = setInterval(() => setResendTimer(prev => prev - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [resendTimer]);

  // Se o usuário clicar no link do e-mail (ou o link for pré-validado pelo navegador)
  // o Supabase já terá logado ele. Se estivermos na tela de OTP, mandamos ele 
  // direto para o reset em vez de dar erro de "código inválido".
  useEffect(() => {
    if (session && authMode === 'otp') {
      navigate('/reset-password');
    }
  }, [session, authMode, navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    const cleanEmail = email.trim().toLowerCase();

    try {
      if (authMode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });
        if (error) throw error;
      } else if (authMode === 'register') {
        const { error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: {
              full_name: name,
              role: role,
            },
          },
        });
        if (error) throw error;
        setSuccessMsg('Confirme seu e-mail para ativar sua conta!');
        setAuthMode('login');
      } else if (authMode === 'forgot') {
        if (!cleanEmail) throw new Error('Por favor, digite seu e-mail.');
        const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail);
        if (error) throw error;
        setSuccessMsg('Um e-mail com o código de 6 dígitos foi enviado!');
        setAuthMode('otp');
        setResendTimer(60);
      } else if (authMode === 'otp') {
        if (!otpToken) throw new Error('Por favor, digite o código de 6 dígitos.');
        const { error } = await supabase.auth.verifyOtp({
          email: cleanEmail,
          token: otpToken.trim(),
          type: 'recovery',
        });
        if (error) throw error;
        navigate('/reset-password');
      }
    } catch (err: any) {
      if (err.message?.includes('expired') || err.message?.includes('invalid')) {
        setError('O código expirou ou é inválido. Peça um novo se necessário.');
      } else {
        setError(err.message || 'Ocorreu um erro na autenticação.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0 || !email) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase());
      if (error) throw error;
      setSuccessMsg('Um novo código foi enviado para o seu e-mail!');
      setResendTimer(60);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-background-light antialiased overflow-x-hidden">
      {/* Coluna da Esquerda (Hero Section) */}
      <aside className="hidden lg:flex lg:w-1/2 relative flex-col justify-center p-20 bg-primary overflow-hidden">
        <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-primary via-primary-dark to-primary opacity-90 z-0"></div>
        <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-white/5 rounded-full blur-[120px] animate-pulse"></div>
        <div className="relative z-10 space-y-12 max-w-xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Plataforma Online</span>
          </div>

          <div className="space-y-6">
            <h1 className="text-5xl lg:text-7xl font-black text-white tracking-tighter leading-none">
              Sua próxima grande <span className="text-emerald-400">negociação</span> começa aqui.
            </h1>
            <p className="text-xl text-primary-light font-medium leading-relaxed max-w-md">
              A plataforma mais segura e eficiente para conectar ofertas e demandas no mercado B2B.
            </p>
          </div>

          <div className="space-y-6 pt-6">
            {[
              { icon: 'handshake', text: 'Negociações diretas e transparentes.' },
              { icon: 'verified_user', text: 'Ambiente 100% seguro com criptografia.' },
              { icon: 'trending_up', text: 'Acesso às melhores oportunidades em tempo real.' }
            ].map((item, idx) => (
              <div key={idx} className="flex items-center gap-4 group">
                <div className="size-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white border border-white/10 group-hover:bg-white/20 transition-all duration-300">
                  <span className="material-symbols-outlined text-2xl group-hover:scale-110 transition-transform">{item.icon}</span>
                </div>
                <span className="text-white font-bold text-lg">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* Coluna da Direita (Formulário) */}
      <main className="w-full lg:w-1/2 flex flex-col min-h-screen relative bg-white">
        <div className="absolute top-8 right-8 z-20 hidden sm:flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
          <span className="material-symbols-outlined text-[16px] text-emerald-500">verified</span>
          Ambiente Certificado
        </div>

        <div className="flex-1 flex items-center justify-center p-6 sm:p-8 pt-6 pb-6 sm:pt-16 sm:pb-16 overflow-y-auto">
          <div className="w-full max-w-[440px] space-y-4 sm:space-y-10">
            <div className="flex justify-center mb-4 sm:mb-6">
              <Logo size="lg" className="transform scale-125 sm:scale-150 md:scale-[1.75]" />
            </div>

            <header className="text-center space-y-2 sm:space-y-3">
              <h2 className="text-xl sm:text-3xl font-black text-slate-900 tracking-tighter">
                {authMode === 'forgot' && 'Recuperar Senha'}
                {authMode === 'otp' && 'Verificar Código'}
                {(authMode === 'login' || authMode === 'register') && 'Bem-vindo de volta'}
              </h2>
              <p className="text-sm sm:text-base text-slate-500 font-medium">
                {authMode === 'login' && 'Acesse sua conta para continuar suas negociações.'}
                {authMode === 'register' && 'Crie sua conta e comece a negociar.'}
                {authMode === 'forgot' && 'Digite seu e-mail para receber o código de 6 dígitos.'}
                {authMode === 'otp' && 'Digite o código de 6 dígitos que enviamos para seu e-mail.'}
              </p>

              {authMode === 'otp' && (
                <div className="mt-4 px-4 py-3 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center gap-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Código enviado para</span>
                  <span className="text-sm font-bold text-slate-700">{email}</span>
                  <button
                    type="button"
                    onClick={() => setAuthMode('forgot')}
                    className="text-[9px] font-black text-primary uppercase tracking-widest hover:underline mt-1"
                  >
                    Alterar E-mail
                  </button>
                </div>
              )}
            </header>

            {(authMode === 'login' || authMode === 'register') && (
              <div className="flex bg-slate-100 p-1 rounded-xl">
                <button
                  className={`flex-1 py-2 sm:py-2.5 text-[10px] sm:text-xs font-black uppercase tracking-widest rounded-lg transition-all ${authMode === 'login' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  onClick={() => setAuthMode('login')}
                >
                  Entrar
                </button>
                <button
                  className={`flex-1 py-2 sm:py-2.5 text-[10px] sm:text-xs font-black uppercase tracking-widest rounded-lg transition-all ${authMode === 'register' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  onClick={() => setAuthMode('register')}
                >
                  Criar Conta
                </button>
              </div>
            )}

            {error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 text-sm font-medium animate-in fade-in slide-in-from-top-2">
                <span className="material-symbols-outlined text-[20px]">error_outline</span>
                {error}
              </div>
            )}

            {successMsg && (
              <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-3 text-emerald-600 text-sm font-medium animate-in fade-in slide-in-from-top-2">
                <span className="material-symbols-outlined text-[20px]">check_circle</span>
                {successMsg}
              </div>
            )}

            <form onSubmit={handleAuth} className="space-y-4">
              {authMode === 'register' && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Nome Completo</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">person</span>
                    <input
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full h-12 pl-11 pr-4 rounded-xl border border-slate-100 bg-slate-50 focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white transition-all text-sm font-bold text-slate-800"
                      placeholder="Seu nome"
                    />
                  </div>
                </div>
              )}

              {authMode !== 'otp' && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">E-mail Corporativo</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">mail</span>
                    <input
                      required
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full h-12 pl-11 pr-4 rounded-xl border border-slate-100 bg-slate-50 focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white transition-all text-sm font-bold text-slate-800"
                      placeholder="nome@suaempresa.com"
                    />
                  </div>
                </div>
              )}

              {authMode === 'otp' && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Código de 6 Dígitos</label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">passkey</span>
                      <input
                        required
                        maxLength={6}
                        autoFocus
                        value={otpToken}
                        onChange={(e) => setOtpToken(e.target.value.replace(/\D/g, ''))}
                        className="w-full h-12 pl-11 pr-4 rounded-xl border border-slate-100 bg-slate-50 focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white transition-all text-center text-lg font-black tracking-[0.5em] text-slate-800"
                        placeholder="000000"
                      />
                    </div>
                  </div>

                  <div className="flex justify-center">
                    <button
                      type="button"
                      disabled={resendTimer > 0 || loading}
                      onClick={handleResendOtp}
                      className="text-[10px] font-black text-primary uppercase tracking-widest disabled:text-slate-300 transition-colors"
                    >
                      {resendTimer > 0 ? `Reenviar código em ${resendTimer}s` : 'Não recebi o código'}
                    </button>
                  </div>
                </div>
              )}

              {authMode === 'login' && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between px-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Senha de Acesso</label>
                    <button type="button" onClick={() => setAuthMode('forgot')} className="text-[9px] font-black text-primary uppercase tracking-widest hover:underline">Esqueci minha senha</button>
                  </div>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">lock</span>
                    <input
                      required
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full h-12 pl-11 pr-12 rounded-xl border border-slate-100 bg-slate-50 focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white transition-all text-sm font-bold text-slate-800"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                    >
                      <span className="material-symbols-outlined text-[18px]">{showPassword ? 'visibility' : 'visibility_off'}</span>
                    </button>
                  </div>
                </div>
              )}

              {authMode === 'register' && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Senha de Acesso</label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">lock</span>
                      <input
                        required
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full h-12 pl-11 pr-12 rounded-xl border border-slate-100 bg-slate-50 focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white transition-all text-sm font-bold text-slate-800"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 pt-2">
                    {[
                      { label: 'Comprador', value: 'buyer', icon: 'shopping_cart' },
                      { label: 'Vendedor', value: 'seller', icon: 'storefront' },
                      { label: 'Ambos', value: 'both', icon: 'handshake' }
                    ].map(t => (
                      <label key={t.value} className="cursor-pointer group">
                        <input type="radio" value={t.value} checked={role === t.value} onChange={(e) => setRole(e.target.value)} className="peer sr-only" />
                        <div className="p-3 border-2 border-slate-100 rounded-xl flex flex-col items-center gap-1peer-checked:border-primary peer-checked:bg-primary/5 peer-checked:text-primary transition-all">
                          <span className="material-symbols-outlined text-[18px]">{t.icon}</span>
                          <span className="text-[9px] font-black uppercase tracking-tight">{t.label}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 sm:h-14 bg-primary hover:bg-primary-dark text-white font-black rounded-2xl shadow-xl shadow-primary/20 transition-all transform active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 text-[10px] sm:text-xs uppercase tracking-[0.1em] mt-4"
              >
                {loading ? <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : (
                  <>
                    {authMode === 'login' && 'Entrar na Plataforma'}
                    {authMode === 'register' && 'Criar minha conta'}
                    {authMode === 'forgot' && 'Enviar código de recuperação'}
                    {authMode === 'otp' && 'Verificar código'}
                    <span className="material-symbols-outlined text-xl">arrow_forward</span>
                  </>
                )}
              </button>

              {(authMode === 'forgot' || authMode === 'otp') && (
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setError(null);
                    setSuccessMsg(null);
                  }}
                  className="w-full text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-primary transition-colors mt-2"
                >
                  Voltar para o Login
                </button>
              )}
            </form>
          </div>
        </div>

        <footer className="w-full p-6 sm:p-8 border-t border-slate-50 flex flex-col items-center gap-4 bg-white z-10">
          <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
            <span className="material-symbols-outlined text-[16px]">security</span>
            Ambiente 100% Seguro
          </div>
        </footer>
      </main>
    </div>
  );
};

export default LoginPage;
