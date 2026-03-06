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

  // Se o usuário clicar no link do e-mail (ou o link for pré-validado pelo navegador/scanner)
  // o Supabase já terá logado ele. Se estivermos na tela de OTP, mandamos ele 
  // direto para o reset em vez de ficar preso vendo erro de "expirado".
  useEffect(() => {
    const checkBgSession = async () => {
      if (authMode === 'otp') {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (currentSession) {
          console.log("Sessão ativa detectada durante OTP. Pulando para reset...");
          navigate('/reset-password');
        }
      }
    };

    // Checa quando o modo muda
    checkBgSession();

    // Checa quando a sessão do contexto muda
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
        if (!cleanEmail) throw new Error('Campo e-mail é obrigatório.');

        // LIMPEZA: Força um logout antes de pedir recuperação para evitar conflitos de sessão
        await supabase.auth.signOut();

        const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail);
        if (error) throw error;
        setSuccessMsg('Código de 6 dígitos enviado com sucesso!');
        setAuthMode('otp');
        setResendTimer(60);
        setOtpToken('');
      } else if (authMode === 'otp') {
        if (!otpToken || otpToken.length < 6) throw new Error('Digite o código de 6 dígitos completo.');

        // 1. Tenta verificar o OTP
        const { error: verifyError } = await supabase.auth.verifyOtp({
          email: cleanEmail,
          token: otpToken.trim(),
          type: 'recovery',
        });

        // 2. Se falhar, fazemos a "PROVA REAL": Checamos se existe uma sessão agora.
        // Isso salva usuários em que o Gmail/Antivírus "clicou" no link do e-mail por trás, 
        // consumindo o token mas já logando o usuário.
        if (verifyError) {
          const { data: { session: rescuedSession } } = await supabase.auth.getSession();
          if (rescuedSession) {
            console.log("OTP erro, mas usuário logado detectado. Sucesso!");
            navigate('/reset-password');
            return;
          }
          throw verifyError;
        }

        navigate('/reset-password');
      }
    } catch (err: any) {
      console.error("Erro na Auth:", err);
      if (err.message?.includes('expired') || err.message?.includes('invalid')) {
        setError('Código inválido ou já utilizado. Tente atualizar a página e pedir um novo se persistir.');
      } else {
        setError(err.message || 'Ocorreu um erro. Tente novamente.');
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
    <div className="min-h-screen flex flex-col lg:flex-row bg-background-light antialiased overflow-x-hidden">
      {/* Coluna Visual (Desktop) */}
      <aside className="hidden lg:flex lg:w-1/2 relative flex-col justify-center p-20 bg-primary overflow-hidden">
        <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-primary via-primary-dark to-primary opacity-90"></div>
        <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-white/5 rounded-full blur-[120px] animate-pulse"></div>
        <div className="relative z-10 space-y-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Plataforma Online</span>
          </div>
          <div>
            <h1 className="text-6xl font-black text-white tracking-tighter leading-none mb-6">
              Sua negociação <br /> mais <span className="text-emerald-400">eficiente.</span>
            </h1>
            <p className="text-xl text-primary-light font-medium max-w-sm">
              Conectamos demandas e ofertas reais com segurança e rapidez.
            </p>
          </div>
        </div>
      </aside>

      {/* Coluna Formulário */}
      <main className="w-full lg:w-1/2 flex flex-col min-h-screen relative bg-white">
        <div className="flex-1 flex items-center justify-center p-6 sm:p-8 overflow-y-auto">
          <div className="w-full max-w-[440px] space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex justify-center">
              <Logo size="lg" className="transform scale-150" />
            </div>

            <header className="text-center space-y-2">
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tighter">
                {authMode === 'login' && 'Bem-vindo de volta'}
                {authMode === 'register' && 'Crie sua conta'}
                {authMode === 'forgot' && 'Recuperar Senha'}
                {authMode === 'otp' && 'Verificar Código'}
              </h2>
              <p className="text-sm text-slate-500 font-medium">
                {authMode === 'login' && 'Acesse sua conta para continuar.'}
                {authMode === 'register' && 'Junte-se a milhares de negociadores.'}
                {authMode === 'forgot' && 'Enviaremos um código de 6 dígitos.'}
                {authMode === 'otp' && 'Confirme o código enviado para:'}
              </p>
              {authMode === 'otp' && (
                <div className="mt-2 text-primary font-black text-sm uppercase tracking-widest">{email}</div>
              )}
            </header>

            {(authMode === 'login' || authMode === 'register') && (
              <div className="flex bg-slate-100 p-1 rounded-xl">
                <button
                  className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${authMode === 'login' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  onClick={() => setAuthMode('login')}
                >
                  Entrar
                </button>
                <button
                  className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${authMode === 'register' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  onClick={() => setAuthMode('register')}
                >
                  Criar Conta
                </button>
              </div>
            )}

            {error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-xs font-bold animate-shake">
                <span className="material-symbols-outlined text-[18px]">report</span>
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
                    className="w-full h-12 px-4 rounded-xl border border-slate-100 bg-slate-50 focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white transition-all text-sm font-bold text-slate-800"
                    placeholder="Seu nome"
                  />
                </div>
              )}

              {authMode !== 'otp' && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">E-mail Corporativo</label>
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl border border-slate-100 bg-slate-50 focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white transition-all text-sm font-bold text-slate-800"
                    placeholder="exemplo@suaempresa.com"
                  />
                </div>
              )}

              {authMode === 'otp' && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 text-center block">Código Verificador</label>
                    <input
                      required
                      maxLength={6}
                      autoFocus
                      value={otpToken}
                      onChange={(e) => setOtpToken(e.target.value.replace(/\D/g, ''))}
                      className="w-full h-16 rounded-2xl border-2 border-slate-100 bg-slate-50 focus:border-primary focus:bg-white transition-all text-center text-4xl font-black tracking-[0.3em] text-slate-900"
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
                      {resendTimer > 0 ? `Reenviar em ${resendTimer}s` : 'Reenviar Código'}
                    </button>
                    <span className="text-slate-200">|</span>
                    <button
                      type="button"
                      onClick={() => setAuthMode('forgot')}
                      className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors"
                    >
                      Trocar E-mail
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
                    <input
                      required
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full h-12 pl-4 pr-12 rounded-xl border border-slate-100 bg-slate-50 focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white transition-all text-sm font-bold text-slate-800"
                      placeholder="••••••••"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      <span className="material-symbols-outlined text-[18px]">{showPassword ? 'visibility' : 'visibility_off'}</span>
                    </button>
                  </div>
                </div>
              )}

              {authMode === 'register' && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Crie sua Senha</label>
                    <input
                      required
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full h-12 px-4 rounded-xl border border-slate-100 bg-slate-50 focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white transition-all text-sm font-bold text-slate-800"
                      placeholder="••••••••"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: 'Comprador', value: 'buyer', icon: 'shopping_cart' },
                      { label: 'Vendedor', value: 'seller', icon: 'storefront' },
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
                </>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full h-14 bg-primary hover:bg-primary-dark text-white font-black rounded-2xl shadow-xl shadow-primary/30 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 text-xs uppercase tracking-widest mt-4"
              >
                {loading ? <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : (
                  <>
                    {authMode === 'login' && 'Entrar na Plataforma'}
                    {authMode === 'register' && 'Criar minha Conta'}
                    {authMode === 'forgot' && 'Enviar Código de Recuperação'}
                    {authMode === 'otp' && 'Validar Código Agora'}
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
                  className="w-full text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-primary transition-colors mt-2"
                >
                  Voltar para o Login
                </button>
              )}
            </form>
          </div>
        </div>

        <footer className="p-8 border-t border-slate-50 bg-white z-10">
          <div className="flex justify-center gap-6 text-[10px] font-black text-slate-300 uppercase tracking-widest">
            <span className="flex items-center gap-2"><span className="material-symbols-outlined text-[16px]">security</span> Criptografia SSL</span>
            <span className="flex items-center gap-2"><span className="material-symbols-outlined text-[16px]">verified</span> Negociei Hub</span>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default LoginPage;
