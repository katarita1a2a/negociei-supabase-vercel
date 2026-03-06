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

  // Checagem de segurança: Se o usuário já tiver uma sessão enquanto está no modo OTP,
  // significa que a verificação (Link ou Código) funcionou em "segundo plano" (ex: Gmail pre-fetch).
  useEffect(() => {
    const checkBackgroundSession = async () => {
      if (authMode === 'otp') {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (currentSession) {
          console.log("🎯 Sessão detectada no modo OTP! Redirecionando para reset...");
          navigate('/reset-password');
        }
      }
    };

    checkBackgroundSession();

    // Se a sessão principal do contexto mudar, também redireciona
    if (session && authMode === 'otp') {
      navigate('/reset-password');
    }
  }, [session, authMode, navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    // IMPORTANTE: Removemos o lowercase automático para evitar conflitos de case-sensitivity no Supabase
    const cleanEmail = email.trim();

    try {
      if (authMode === 'login') {
        const { error: loginErr } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });
        if (loginErr) throw loginErr;
      } else if (authMode === 'register') {
        const { error: regErr } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: { full_name: name, role: role },
          },
        });
        if (regErr) throw regErr;
        setSuccessMsg('Cadastro realizado! Clique no link enviado para seu e-mail.');
        setAuthMode('login');
      } else if (authMode === 'forgot') {
        if (!cleanEmail) throw new Error('O e-mail é obrigatório.');

        // Limpa estado anterior antes de pedir nova recuperação
        await supabase.auth.signOut();

        const { error: resetErr } = await supabase.auth.resetPasswordForEmail(cleanEmail);
        if (resetErr) throw resetErr;

        setSuccessMsg('Código enviado! Verifique seu e-mail.');
        setAuthMode('otp');
        setResendTimer(60);
        setOtpToken('');
      } else if (authMode === 'otp') {
        if (!otpToken || otpToken.length < 6) throw new Error('Digite o código de 6 dígitos completo.');

        // 1. Tenta validar o código
        const { data: otpData, error: verifyError } = await supabase.auth.verifyOtp({
          email: cleanEmail,
          token: otpToken.trim(),
          type: 'recovery',
        });

        // 2. Se a validação deu erro, checamos se o usuário já não está logado 
        // (O Gmail pode ter "consumido" o token via pre-fetch do link oculto)
        if (verifyError || !otpData?.session) {
          const { data: { session: rescuedSession } } = await supabase.auth.getSession();
          if (rescuedSession) {
            console.log("🚀 Usuário logado via pre-fetch. Recuperando fluxo...");
            navigate('/reset-password');
            return;
          }

          if (verifyError) throw verifyError;
          throw new Error('Não foi possível iniciar a sessão. Tente pedir um novo código.');
        }

        // Se chegou aqui com otpData.session, a navegação ocorrerá pelos useEffects ou manualmente
        navigate('/reset-password');
      }
    } catch (err: any) {
      console.error("Auth Failure:", err);
      if (err.message?.includes('expired') || err.message?.includes('invalid')) {
        setError('O código expirou ou é inválido. Se o erro persistir, peça um novo código e NÃO clique em nenhum link do e-mail.');
      } else {
        setError(err.message || 'Ocorreu um erro inesperado.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0 || !email) return;
    setLoading(true);
    try {
      await supabase.auth.signOut();
      const { error: resendErr } = await supabase.auth.resetPasswordForEmail(email.trim());
      if (resendErr) throw resendErr;
      setSuccessMsg('Um novo código de 6 dígitos foi enviado!');
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
      {/* Branding Section */}
      <aside className="hidden lg:flex lg:w-1/2 relative flex-col justify-center p-20 bg-primary overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary-dark to-primary opacity-95"></div>
        <div className="relative z-10 space-y-8 animate-in fade-in slide-in-from-left-8 duration-700">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Hub Negociei</span>
          </div>
          <div className="space-y-4">
            <h1 className="text-6xl font-black text-white tracking-tighter leading-none">
              Negocie com <br /> <span className="text-emerald-400 text-7xl">excelência.</span>
            </h1>
            <p className="text-xl text-primary-light font-medium max-w-sm leading-relaxed">
              A maior rede de conexões B2B do Brasil ao seu alcance.
            </p>
          </div>
        </div>
      </aside>

      {/* Auth Content */}
      <main className="w-full lg:w-1/2 flex flex-col min-h-screen bg-white shadow-2xl z-10">
        <div className="flex-1 flex items-center justify-center p-6 sm:p-12 overflow-y-auto">
          <div className="w-full max-w-[420px] space-y-8">
            <div className="flex justify-center mb-8 transform hover:scale-105 transition-transform duration-300">
              <Logo size="lg" className="transform scale-[1.7]" />
            </div>

            <header className="text-center space-y-2">
              <h2 className="text-3xl font-black text-slate-900 tracking-tighter">
                {authMode === 'login' && 'Bem-vindo de volta'}
                {authMode === 'register' && 'Crie sua conta'}
                {authMode === 'forgot' && 'Recuperar Acesso'}
                {authMode === 'otp' && 'Validação Exclusiva'}
              </h2>
              <p className="text-sm text-slate-500 font-bold uppercase tracking-wide opacity-60">
                {authMode === 'login' && 'Acesse sua conta para continuar'}
                {authMode === 'register' && 'Rápido, fácil e transformador'}
                {authMode === 'forgot' && 'Digite seu e-mail corporativo'}
                {authMode === 'otp' && 'Digite o código de 6 dígitos que enviamos'}
              </p>

              {authMode === 'otp' && (
                <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100 animate-pulse">
                  <div className="text-[10px] text-slate-400 font-black tracking-widest uppercase mb-1">E-mail de Destino</div>
                  <div className="text-primary font-black text-base">{email}</div>
                </div>
              )}
            </header>

            {(authMode === 'login' || authMode === 'register') && (
              <div className="flex bg-slate-100 p-1.5 rounded-2xl">
                <button
                  className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-300 ${authMode === 'login' ? 'bg-white text-primary shadow-lg shadow-primary/5' : 'text-slate-500 hover:text-slate-900'}`}
                  onClick={() => setAuthMode('login')}
                >
                  Fazer Login
                </button>
                <button
                  className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-300 ${authMode === 'register' ? 'bg-white text-primary shadow-lg shadow-primary/5' : 'text-slate-500 hover:text-slate-900'}`}
                  onClick={() => setAuthMode('register')}
                >
                  Criar Conta
                </button>
              </div>
            )}

            {error && (
              <div className="p-5 bg-red-50 border-l-4 border-red-500 rounded-2xl flex items-start gap-3 text-red-700 text-xs font-bold shadow-sm animate-shake">
                <span className="material-symbols-outlined text-[20px] mt-0.5">warning</span>
                <div className="flex-1 leading-relaxed">{error}</div>
              </div>
            )}

            {successMsg && (
              <div className="p-5 bg-emerald-50 border-l-4 border-emerald-500 rounded-2xl flex items-start gap-3 text-emerald-700 text-xs font-bold shadow-sm animate-in fade-in zoom-in-95">
                <span className="material-symbols-outlined text-[20px] mt-0.5">check_circle</span>
                <div className="flex-1 leading-relaxed">{successMsg}</div>
              </div>
            )}

            <form onSubmit={handleAuth} className="space-y-6">
              {authMode === 'register' && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Nome da Empresa / Profissional</label>
                  <input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full h-14 px-5 rounded-2xl border-2 border-slate-50 bg-slate-50 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all text-base font-bold text-slate-800"
                    placeholder="Seu nome completo"
                  />
                </div>
              )}

              {authMode !== 'otp' && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Seu E-mail Corporativo</label>
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-14 px-5 rounded-2xl border-2 border-slate-50 bg-slate-50 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all text-base font-bold text-slate-800"
                    placeholder="exemplo@empresa.com"
                  />
                </div>
              )}

              {authMode === 'otp' && (
                <div className="space-y-6">
                  <div className="space-y-2 text-center">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Código de Verificação</label>
                    <input
                      required
                      maxLength={6}
                      autoFocus
                      type="text"
                      inputMode="numeric"
                      value={otpToken}
                      onChange={(e) => setOtpToken(e.target.value.replace(/\D/g, ''))}
                      className="w-full h-20 rounded-3xl border-4 border-slate-100 bg-slate-50 focus:border-primary focus:bg-white transition-all text-center text-5xl font-black tracking-[0.4em] text-slate-900 shadow-inner"
                      placeholder="000000"
                    />
                  </div>

                  <div className="flex flex-col items-center gap-4">
                    <button
                      type="button"
                      disabled={resendTimer > 0 || loading}
                      onClick={handleResendOtp}
                      className="text-[11px] font-black text-primary uppercase tracking-widest disabled:text-slate-300 hover:text-primary-dark transition-all transform active:scale-95"
                    >
                      {resendTimer > 0 ? `Novo código em ${resendTimer}s` : 'Não recebi o código'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setAuthMode('forgot')}
                      className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors"
                    >
                      Alterar e-mail de recuperação
                    </button>
                  </div>
                </div>
              )}

              {(authMode === 'login' || authMode === 'register') && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sua Senha</label>
                    {authMode === 'login' && (
                      <button type="button" onClick={() => setAuthMode('forgot')} className="text-[9px] font-black text-primary uppercase tracking-widest hover:underline hover:text-primary-dark transition-colors">Esqueci a senha</button>
                    )}
                  </div>
                  <div className="relative group">
                    <input
                      required
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full h-14 pl-5 pr-14 rounded-2xl border-2 border-slate-50 bg-slate-50 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all text-base font-bold text-slate-800"
                      placeholder="••••••••"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors">
                      <span className="material-symbols-outlined text-[20px]">{showPassword ? 'visibility' : 'visibility_off'}</span>
                    </button>
                  </div>
                </div>
              )}

              {authMode === 'register' && (
                <div className="grid grid-cols-3 gap-3 pt-2">
                  {[
                    { label: 'Comprar', value: 'buyer', icon: 'shopping_cart' },
                    { label: 'Vender', value: 'seller', icon: 'storefront' },
                    { label: 'Ambos', value: 'both', icon: 'handshake' }
                  ].map(t => (
                    <label key={t.value} className="cursor-pointer group">
                      <input type="radio" name="role" value={t.value} checked={role === t.value} onChange={(e) => setRole(e.target.value)} className="peer sr-only" />
                      <div className="p-4 border-2 border-slate-100 rounded-2xl flex flex-col items-center gap-2 peer-checked:border-primary peer-checked:bg-primary/5 peer-checked:text-primary group-hover:bg-slate-50 transition-all duration-300">
                        <span className="material-symbols-outlined text-[22px] transform group-hover:scale-110 transition-transform">{t.icon}</span>
                        <span className="text-[9px] font-black uppercase tracking-tight">{t.label}</span>
                      </div>
                    </label>
                  ))}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full h-16 bg-primary hover:bg-primary-dark text-white font-black rounded-3xl shadow-2xl shadow-primary/25 transition-all active:scale-[0.97] transform translate-y-0 hover:-translate-y-1 disabled:opacity-50 flex items-center justify-center gap-4 text-sm uppercase tracking-widest mt-6"
              >
                {loading ? (
                  <div className="size-6 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span>Prosseguir</span>
                    <span className="material-symbols-outlined font-bold">arrow_forward</span>
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
                  className="w-full text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-primary transition-all mt-4 p-2"
                >
                  Voltar para tela de Login
                </button>
              )}
            </form>
          </div>
        </div>

        <footer className="p-10 border-t border-slate-50 bg-white">
          <div className="flex justify-center gap-8 text-[11px] font-black text-slate-300 uppercase tracking-[0.2em]">
            <span className="flex items-center gap-2 group cursor-help"><span className="material-symbols-outlined text-[18px] text-emerald-500">lock</span> Criptografia de Ponta</span>
            <span className="flex items-center gap-2 group cursor-help"><span className="material-symbols-outlined text-[18px] text-blue-500">verified</span> KYC Validado</span>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default LoginPage;
