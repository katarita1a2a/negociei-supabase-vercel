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
  const [hasBackgroundSession, setHasBackgroundSession] = useState(false);
  const navigate = useNavigate();

  // Timer para o botão de reenviar código
  useEffect(() => {
    if (resendTimer > 0) {
      const interval = setInterval(() => setResendTimer(prev => prev - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [resendTimer]);

  // MONITORAMENTO AGRESSIVO DE SESSÃO:
  // Se detectarmos uma sessão (mesmo que em background), mostramos um botão de "prosseguir" especial.
  useEffect(() => {
    const checkSession = async () => {
      if (authMode === 'otp') {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (currentSession) {
          setHasBackgroundSession(true);
          // Redireciona logo se a sessão existir
          console.log("🚀 Sessão detectada em background. Redirecionando...");
          navigate('/reset-password');
        }
      }
    };

    const interval = setInterval(checkSession, 2000); // Checa a cada 2 segundos no modo OTP
    return () => clearInterval(interval);
  }, [authMode, navigate]);

  // Se o AuthContext atualizar, redireciona também
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

    // Normalização padrão
    const cleanEmail = email.trim().toLowerCase();

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
        setSuccessMsg('Conta criada! Ative-a no link do seu e-mail.');
        setAuthMode('login');
      } else if (authMode === 'forgot') {
        if (!cleanEmail) throw new Error('E-mail necessário.');

        // Limpa estado antes de começar nova recuperação
        await supabase.auth.signOut();

        const { error: resetErr } = await supabase.auth.resetPasswordForEmail(cleanEmail);
        if (resetErr) throw resetErr;

        setSuccessMsg('Um e-mail com o código chegou! Basta digitar os 6 dígitos.');
        setAuthMode('otp');
        setResendTimer(60);
        setOtpToken('');
      } else if (authMode === 'otp') {
        if (!otpToken || otpToken.length < 6) throw new Error('Digite os 6 dígitos do código.');

        // 1. Tenta validar manualmente
        const { error: verifyError } = await supabase.auth.verifyOtp({
          email: cleanEmail,
          token: otpToken.trim(),
          type: 'recovery',
        });

        // 2. Se falhar, faz uma checagem instantânea de sessão
        if (verifyError) {
          console.warn("OTP via API falhou, checando sessão local...");
          const { data: { session: currentSession } } = await supabase.auth.getSession();
          if (currentSession) {
            console.log("✅ Sessão encontrada localmente! Redirecionando...");
            navigate('/reset-password');
            return;
          }
          throw verifyError;
        }

        navigate('/reset-password');
      }
    } catch (err: any) {
      console.error("Auth Failure Detail:", err);
      if (err.message?.includes('expired') || err.message?.includes('invalid')) {
        setError('O código não funcionou. Isse é comum se o Gmail "tocou" no link do e-mail por segurança. Tente clicar em PROSSEGUIR novamente ou peça um novo código.');
      } else {
        setError(err.message || 'Erro inesperado. Tente novamente.');
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
      const { error: resendErr } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase());
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
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50 antialiased overflow-x-hidden font-sans">
      {/* Visual Side */}
      <aside className="hidden lg:flex lg:w-1/2 relative flex-col justify-center p-24 bg-primary overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary-dark to-primary opacity-95"></div>
        <div className="absolute -top-20 -right-20 size-[600px] bg-white opacity-[0.03] rounded-full blur-[100px] animate-pulse"></div>
        <div className="relative z-10 space-y-12">
          <div className="inline-flex items-center gap-3 px-5 py-2.5 bg-white/10 backdrop-blur-md rounded-full border border-white/20">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-[10px] font-black text-white uppercase tracking-[0.25em]">Cloud Systems</span>
          </div>
          <div className="space-y-6">
            <h1 className="text-7xl font-black text-white tracking-tighter leading-[0.85]">
              Gestão de <br /> <span className="text-emerald-400">Sucesso.</span>
            </h1>
            <p className="text-xl text-primary-light font-medium max-w-sm leading-relaxed opacity-80">
              Transforme a maneira como sua empresa negocia e cresce.
            </p>
          </div>
        </div>
      </aside>

      {/* Form Side */}
      <main className="w-full lg:w-1/2 flex flex-col min-h-screen bg-white">
        <div className="flex-1 flex items-center justify-center p-6 sm:p-16">
          <div className="w-full max-w-[440px] space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <div className="flex justify-center transition-all duration-500 hover:scale-110">
              <Logo size="lg" className="transform scale-[2]" />
            </div>

            <header className="text-center space-y-3">
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tighter">
                {authMode === 'login' && 'Bem-vindo'}
                {authMode === 'register' && 'Novo Negociador'}
                {authMode === 'forgot' && 'Recuperar Acesso'}
                {authMode === 'otp' && 'Vantagem Exclusiva'}
              </h2>
              <p className="text-[11px] text-slate-400 font-black uppercase tracking-[0.2em] leading-relaxed">
                {authMode === 'login' && 'Entre para gerenciar suas negociações'}
                {authMode === 'register' && 'Crie sua identidade na plataforma'}
                {authMode === 'forgot' && 'Digite seu e-mail corporativo'}
                {authMode === 'otp' && 'Valide sua identidade com os 6 dígitos:'}
              </p>
              {authMode === 'otp' && (
                <div className="mt-4 p-4 bg-slate-50 rounded-[24px] border border-slate-100 ring-4 ring-primary/5 animate-bounce-subtle">
                  <span className="text-primary font-black text-base">{email}</span>
                </div>
              )}
            </header>

            {(authMode === 'login' || authMode === 'register') && (
              <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
                <button
                  className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-300 ${authMode === 'login' ? 'bg-white text-primary shadow-xl ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-800'}`}
                  onClick={() => setAuthMode('login')}
                >
                  Identificar
                </button>
                <button
                  className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-300 ${authMode === 'register' ? 'bg-white text-primary shadow-xl ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-800'}`}
                  onClick={() => setAuthMode('register')}
                >
                  Registrar
                </button>
              </div>
            )}

            {error && (
              <div className="p-6 bg-red-50 border-l-4 border-red-500 rounded-3xl flex items-start gap-4 text-red-700 text-[11px] font-bold shadow-sm animate-shake">
                <span className="material-symbols-outlined text-[24px] mt-0.5">warning_amber</span>
                <div className="flex-1 leading-relaxed">
                  {error}
                  {hasBackgroundSession && (
                    <button
                      onClick={() => navigate('/reset-password')}
                      className="block mt-3 px-4 py-2 bg-red-600 text-white rounded-xl uppercase tracking-tighter text-[9px] hover:bg-red-700 transition-colors"
                    >
                      Acessar de qualquer forma (Sessão OK)
                    </button>
                  )}
                </div>
              </div>
            )}

            {successMsg && (
              <div className="p-6 bg-emerald-50 border-l-4 border-emerald-500 rounded-3xl flex items-start gap-4 text-emerald-700 text-[11px] font-bold shadow-sm animate-in zoom-in-95">
                <span className="material-symbols-outlined text-[24px] mt-0.5">security_update_good</span>
                <div className="flex-1 leading-relaxed">{successMsg}</div>
              </div>
            )}

            <form onSubmit={handleAuth} className="space-y-6">
              {authMode === 'register' && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Nome de Exibição</label>
                  <input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full h-14 px-6 rounded-2xl border-2 border-slate-50 bg-slate-50 focus:border-primary focus:bg-white transition-all text-base font-bold text-slate-800"
                    placeholder="Seu nome ou empresa"
                  />
                </div>
              )}

              {authMode !== 'otp' && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">E-mail Corporativo</label>
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-14 px-6 rounded-2xl border-2 border-slate-50 bg-slate-50 focus:border-primary focus:bg-white transition-all text-base font-bold text-slate-800"
                    placeholder="voce@empresa.com"
                  />
                </div>
              )}

              {authMode === 'otp' && (
                <div className="space-y-8">
                  <div className="space-y-4 text-center">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">Código de 6 dígitos que enviamos agora:</label>
                    <input
                      required
                      maxLength={6}
                      autoFocus
                      type="text"
                      inputMode="numeric"
                      value={otpToken}
                      onChange={(e) => setOtpToken(e.target.value.replace(/\D/g, ''))}
                      className="w-full h-24 rounded-[40px] border-4 border-slate-100 bg-slate-50 focus:border-primary focus:bg-white transition-all text-center text-6xl font-black tracking-[0.5em] text-slate-900 shadow-inner"
                      placeholder="••••••"
                    />
                  </div>

                  <div className="flex flex-col items-center gap-5 pt-2">
                    <button
                      type="button"
                      disabled={resendTimer > 0 || loading}
                      onClick={handleResendOtp}
                      className="text-[11px] font-black text-primary uppercase tracking-widest disabled:text-slate-300 hover:text-primary-dark transition-all transform active:scale-95 flex items-center gap-2 px-1"
                    >
                      <span className="material-symbols-outlined text-sm">update</span>
                      {resendTimer > 0 ? `Reenviar disponível em ${resendTimer}s` : 'Solicitar um novo código'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setAuthMode('forgot')}
                      className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors"
                    >
                      Alterar e-mail informado
                    </button>
                  </div>
                </div>
              )}

              {(authMode === 'login' || authMode === 'register') && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Senha Pessoal</label>
                    {authMode === 'login' && (
                      <button type="button" onClick={() => setAuthMode('forgot')} className="text-[9px] font-black text-primary uppercase tracking-widest hover:underline hover:text-primary-dark">Esqueci minha senha</button>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      required
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full h-14 pl-6 pr-14 rounded-2xl border-2 border-slate-50 bg-slate-50 focus:border-primary focus:bg-white transition-all text-base font-bold text-slate-800"
                      placeholder="••••••••"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary">
                      <span className="material-symbols-outlined text-[20px]">{showPassword ? 'visibility' : 'visibility_off'}</span>
                    </button>
                  </div>
                </div>
              )}

              {authMode === 'register' && (
                <div className="grid grid-cols-3 gap-4 pt-4">
                  {[
                    { label: 'Comprar', value: 'buyer', icon: 'shopping_cart' },
                    { label: 'Vender', value: 'seller', icon: 'storefront' },
                    { label: 'Ambos', value: 'both', icon: 'handshake' }
                  ].map(t => (
                    <label key={t.value} className="cursor-pointer group">
                      <input type="radio" name="role" value={t.value} checked={role === t.value} onChange={(e) => setRole(e.target.value)} className="peer sr-only" />
                      <div className="p-4 border-2 border-slate-100 rounded-2xl flex flex-col items-center gap-3 peer-checked:border-primary peer-checked:bg-primary/5 peer-checked:text-primary group-hover:bg-slate-50 transition-all duration-500">
                        <span className="material-symbols-outlined text-[24px] transform group-hover:scale-110 transition-transform">{t.icon}</span>
                        <span className="text-[9px] font-black uppercase tracking-tighter">{t.label}</span>
                      </div>
                    </label>
                  ))}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full h-16 bg-primary hover:bg-primary-dark text-white font-black rounded-[24px] shadow-2xl shadow-primary/30 transition-all active:scale-[0.97] transform translate-y-0 hover:-translate-y-1.5 disabled:opacity-50 flex items-center justify-center gap-4 text-xs uppercase tracking-[0.3em] mt-8"
              >
                {loading ? (
                  <div className="size-6 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span>Prosseguir</span>
                    <span className="material-symbols-outlined font-black">arrow_forward_ios</span>
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
                  className="w-full text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-primary transition-all mt-6 p-2"
                >
                  Voltar para tela de Login
                </button>
              )}
            </form>
          </div>
        </div>

        <footer className="p-12 border-t border-slate-50 bg-white">
          <div className="flex justify-center gap-12 text-[10px] font-black text-slate-200 uppercase tracking-[0.3em]">
            <span className="flex items-center gap-2"><span className="material-symbols-outlined text-lg">encryption_lock</span> SSL Secure</span>
            <span className="flex items-center gap-2"><span className="material-symbols-outlined text-lg">policy</span> GDPR Compliant</span>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default LoginPage;
