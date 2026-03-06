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

  // Se uma sessão ativa for detectada enquanto estamos no modo OTP,
  // significa que o token foi validado (seja manualmente ou via link pre-fetch).
  // Nesse caso, pulamos direto para a troca de senha.
  useEffect(() => {
    const checkSession = async () => {
      if (authMode === 'otp') {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (currentSession) {
          navigate('/reset-password');
        }
      }
    };

    if (session && authMode === 'otp') {
      navigate('/reset-password');
    } else if (authMode === 'otp') {
      checkSession();
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
        const { error: loginError } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });
        if (loginError) throw loginError;
      } else if (authMode === 'register') {
        const { error: regError } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: { full_name: name, role: role },
          },
        });
        if (regError) throw regError;
        setSuccessMsg('Cadastro realizado! Confirme seu e-mail.');
        setAuthMode('login');
      } else if (authMode === 'forgot') {
        if (!cleanEmail) throw new Error('O e-mail é obrigatório.');

        // Garante que não há sessão pendente antes de iniciar
        await supabase.auth.signOut();

        const { error: resetError } = await supabase.auth.resetPasswordForEmail(cleanEmail);
        if (resetError) throw resetError;

        setSuccessMsg('Código enviado! Verifique sua caixa de entrada.');
        setAuthMode('otp');
        setResendTimer(60);
        setOtpToken('');
      } else if (authMode === 'otp') {
        if (!otpToken || otpToken.length < 6) throw new Error('Digite o código de 6 dígitos.');

        // 1. Tenta verificar o OTP
        const { error: verifyError } = await supabase.auth.verifyOtp({
          email: cleanEmail,
          token: otpToken.trim(),
          type: 'recovery',
        });

        // 2. Fallback: Se der erro (ex: código consumido mas sessão iniciada)
        if (verifyError) {
          const { data: { session: currentSession } } = await supabase.auth.getSession();
          if (currentSession) {
            navigate('/reset-password');
            return;
          }
          throw verifyError;
        }

        navigate('/reset-password');
      }
    } catch (err: any) {
      console.error("Auth Error:", err);
      if (err.message?.includes('expired') || err.message?.includes('invalid')) {
        setError('Código inválido ou já utilizado. Peça um novo se necessário.');
      } else {
        setError(err.message || 'Erro na autenticação. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0 || !email) return;
    setLoading(true);
    try {
      await supabase.auth.signOut(); // Limpa estado antes de reenviar
      const { error: resendError } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase());
      if (resendError) throw resendError;
      setSuccessMsg('Um novo código foi enviado!');
      setResendTimer(60);
      setOtpToken('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50 antialiased overflow-x-hidden">
      {/* Lado Esquerdo - Info */}
      <aside className="hidden lg:flex lg:w-1/2 relative flex-col justify-center p-20 bg-primary overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary-dark to-primary opacity-95"></div>
        <div className="relative z-10 space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Live Platform</span>
          </div>
          <h1 className="text-6xl font-black text-white tracking-tighter leading-none">
            Potencialize suas <br /> <span className="text-emerald-400">negociações.</span>
          </h1>
          <p className="text-lg text-primary-light font-medium max-w-sm">
            A forma mais rápida e segura de gerenciar suas demandas e ofertas.
          </p>
        </div>
      </aside>

      {/* Lado Direito - Form */}
      <main className="w-full lg:w-1/2 flex flex-col min-h-screen bg-white">
        <div className="flex-1 flex items-center justify-center p-6 sm:p-12 overflow-y-auto">
          <div className="w-full max-w-[420px] space-y-8">
            <div className="flex justify-center mb-8">
              <Logo size="lg" className="transform scale-150" />
            </div>

            <header className="text-center space-y-2">
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tighter">
                {authMode === 'login' && 'Bem-vindo de volta'}
                {authMode === 'register' && 'Crie sua conta'}
                {authMode === 'forgot' && 'Recuperar Acesso'}
                {authMode === 'otp' && 'Validar Código'}
              </h2>
              <p className="text-sm text-slate-500 font-medium">
                {authMode === 'login' && 'Acesse sua conta para continuar.'}
                {authMode === 'register' && 'Rápido, fácil e intuitivo.'}
                {authMode === 'forgot' && 'Digite seu e-mail corporativo.'}
                {authMode === 'otp' && 'Digite os 6 dígitos enviados para:'}
              </p>
              {authMode === 'otp' && (
                <div className="mt-2 text-primary font-black text-sm">{email}</div>
              )}
            </header>

            {(authMode === 'login' || authMode === 'register') && (
              <div className="flex bg-slate-100 p-1 rounded-2xl">
                <button
                  className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${authMode === 'login' ? 'bg-white text-primary shadow-sm' : 'text-slate-500'}`}
                  onClick={() => setAuthMode('login')}
                >
                  Entrar
                </button>
                <button
                  className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${authMode === 'register' ? 'bg-white text-primary shadow-sm' : 'text-slate-500'}`}
                  onClick={() => setAuthMode('register')}
                >
                  Cadastrar
                </button>
              </div>
            )}

            {error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-xs font-bold animate-shake">
                <span className="material-symbols-outlined text-[18px]">emergency_home</span>
                {error}
              </div>
            )}

            {successMsg && (
              <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3 text-emerald-600 text-xs font-bold">
                <span className="material-symbols-outlined text-[18px]">verified</span>
                {successMsg}
              </div>
            )}

            <form onSubmit={handleAuth} className="space-y-4">
              {authMode === 'register' && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Nome Completo</label>
                  <input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl border border-slate-100 bg-slate-50 focus:border-primary focus:bg-white transition-all text-sm font-bold text-slate-800"
                    placeholder="Como devemos te chamar?"
                  />
                </div>
              )}

              {authMode !== 'otp' && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">E-mail</label>
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl border border-slate-100 bg-slate-50 focus:border-primary focus:bg-white transition-all text-sm font-bold text-slate-800"
                    placeholder="seu@email.com"
                  />
                </div>
              )}

              {authMode === 'otp' && (
                <div className="space-y-4">
                  <div className="space-y-1.5 text-center">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Inserir Código</label>
                    <input
                      required
                      maxLength={6}
                      autoFocus
                      value={otpToken}
                      onChange={(e) => setOtpToken(e.target.value.replace(/\D/g, ''))}
                      className="w-full h-16 rounded-2xl border-2 border-slate-100 bg-slate-50 focus:border-primary focus:bg-white transition-all text-center text-4xl font-black tracking-[0.4em] text-slate-900"
                      placeholder="000000"
                    />
                  </div>
                  <div className="flex items-center justify-center gap-4">
                    <button
                      type="button"
                      disabled={resendTimer > 0 || loading}
                      onClick={handleResendOtp}
                      className="text-[10px] font-black text-primary uppercase tracking-widest disabled:text-slate-300 hover:text-primary-dark transition-colors"
                    >
                      {resendTimer > 0 ? `Novo código em ${resendTimer}s` : 'Reenviar Código'}
                    </button>
                    <span className="text-slate-200">|</span>
                    <button
                      type="button"
                      onClick={() => setAuthMode('forgot')}
                      className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors"
                    >
                      Mudar e-mail
                    </button>
                  </div>
                </div>
              )}

              {(authMode === 'login' || authMode === 'register') && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between px-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Senha</label>
                    {authMode === 'login' && (
                      <button type="button" onClick={() => setAuthMode('forgot')} className="text-[9px] font-black text-primary uppercase tracking-widest hover:underline">Esqueci a senha</button>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      required
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full h-12 pl-4 pr-12 rounded-xl border border-slate-100 bg-slate-50 focus:border-primary focus:bg-white transition-all text-sm font-bold text-slate-800"
                      placeholder="••••••••"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      <span className="material-symbols-outlined text-[18px]">{showPassword ? 'visibility' : 'visibility_off'}</span>
                    </button>
                  </div>
                </div>
              )}

              {authMode === 'register' && (
                <div className="grid grid-cols-3 gap-2 pt-2">
                  {[
                    { label: 'Comprar', value: 'buyer', icon: 'shopping_cart' },
                    { label: 'Vender', value: 'seller', icon: 'storefront' },
                    { label: 'Ambos', value: 'both', icon: 'handshake' }
                  ].map(t => (
                    <label key={t.value} className="cursor-pointer">
                      <input type="radio" value={t.value} checked={role === t.value} onChange={(e) => setRole(e.target.value)} className="peer sr-only" />
                      <div className="p-3 border-2 border-slate-100 rounded-xl flex flex-col items-center gap-1 peer-checked:border-primary peer-checked:bg-primary/5 peer-checked:text-primary transition-all">
                        <span className="material-symbols-outlined text-[18px]">{t.icon}</span>
                        <span className="text-[8px] font-black uppercase tracking-tight">{t.label}</span>
                      </div>
                    </label>
                  ))}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full h-14 bg-primary hover:bg-primary-dark text-white font-black rounded-2xl shadow-xl shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 text-xs uppercase tracking-widest mt-4"
              >
                {loading ? <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : (
                  <>
                    <span>Confirmar</span>
                    <span className="material-symbols-outlined">arrow_forward</span>
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
                  className="w-full text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-primary transition-colors mt-4"
                >
                  Voltar para o Login
                </button>
              )}
            </form>
          </div>
        </div>

        <footer className="p-8 border-t border-slate-50 flex justify-center bg-white">
          <div className="flex items-center gap-4 text-[10px] font-black text-slate-300 uppercase tracking-widest">
            <span className="flex items-center gap-2"><span className="material-symbols-outlined text-[16px]">verified_user</span> Seguro</span>
            <span className="flex items-center gap-2"><span className="material-symbols-outlined text-[16px]">terminal</span> Negociei API</span>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default LoginPage;
