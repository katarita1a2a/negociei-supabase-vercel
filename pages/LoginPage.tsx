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

  // REDIRECIONAMENTO AGRESSIVO:
  // Se detectarmos uma sessão e o usuário estiver tentando recuperar senha,
  // ou se houver qualquer rastro de recuperação na URL, mandamos para o reset.
  useEffect(() => {
    const isRecoveryUrl = window.location.href.includes('recovery') ||
      window.location.hash.includes('recovery') ||
      window.location.hash.includes('access_token=');

    if (session && (authMode === 'otp' || isRecoveryUrl)) {
      console.log("🚀 Sessão de recuperação detectada! Redirecionando...");
      navigate('/reset-password');
    }
  }, [session, authMode, navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    // Normalização agressiva para evitar erros de case-sensitivity
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
        setSuccessMsg('Conta criada! Verifique seu e-mail para confirmar.');
        setAuthMode('login');
      } else if (authMode === 'forgot') {
        if (!cleanEmail) throw new Error('E-mail obrigatório.');

        // Limpa qualquer sessão lixo antes de começar
        await supabase.auth.signOut();

        const { error: resetErr } = await supabase.auth.resetPasswordForEmail(cleanEmail);
        if (resetErr) throw resetErr;

        setSuccessMsg('Código exclusivo enviado! Confira sua caixa de entrada.');
        setAuthMode('otp');
        setResendTimer(60);
        setOtpToken('');
      } else if (authMode === 'otp') {
        if (!otpToken || otpToken.length < 6) throw new Error('Digite o código completo.');

        // 1. Tenta validar o código no Supabase
        const { error: verifyError } = await supabase.auth.verifyOtp({
          email: cleanEmail,
          token: otpToken.trim(),
          type: 'recovery',
        });

        // 2. SE DER ERRO: Checamos se a sessão JÁ EXISTE. 
        // Isso é o "resgate" fundamental caso o Gmail tenha consumido o código.
        if (verifyError) {
          console.warn("OTP Error, checking for rescued session...", verifyError.message);
          const { data: { session: existingSession } } = await supabase.auth.getSession();

          if (existingSession) {
            console.log("✅ Sessão resgatada com sucesso! Redirecionando...");
            navigate('/reset-password');
            return;
          }
          throw verifyError;
        }

        navigate('/reset-password');
      }
    } catch (err: any) {
      console.error("Auth Exception:", err);
      // Mensagem amigável para o erro de expiração
      if (err.message?.includes('expired') || err.message?.includes('invalid')) {
        setError('O código não funcionou. Isso acontece se o Gmail clicou no link escondido antes de você. Tente clicar em "PROSSEGUIR" mais uma vez ou peça um novo código.');
      } else {
        setError(err.message || 'Erro de conexão. Tente novamente.');
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
      setSuccessMsg('Um novo código de 6 dígitos chegou!');
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
      {/* Branding Column */}
      <aside className="hidden lg:flex lg:w-1/2 relative flex-col justify-center p-20 bg-primary overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary-dark to-primary opacity-95"></div>
        <div className="relative z-10 space-y-12 animate-in fade-in slide-in-from-left-8 duration-1000">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Secure Access</span>
          </div>
          <div>
            <h1 className="text-7xl font-black text-white tracking-tighter leading-[0.9] mb-8">
              A inteligência por trás do <span className="text-emerald-400">B2B.</span>
            </h1>
            <p className="text-xl text-primary-light font-medium max-w-sm leading-relaxed opacity-80">
              Conectamos sua empresa às melhores oportunidades do mercado.
            </p>
          </div>
        </div>
      </aside>

      {/* Main Form Area */}
      <main className="w-full lg:w-1/2 flex flex-col min-h-screen bg-white">
        <div className="flex-1 flex items-center justify-center p-6 sm:p-12 overflow-y-auto">
          <div className="w-full max-w-[440px] space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
            <div className="flex justify-center transform hover:scale-105 transition-transform duration-500">
              <Logo size="lg" className="transform scale-[1.8]" />
            </div>

            <header className="text-center space-y-2">
              <h2 className="text-3xl font-black text-slate-900 tracking-tighter">
                {authMode === 'login' && 'Bem-vindo de volta'}
                {authMode === 'register' && 'Novo Cadastro'}
                {authMode === 'forgot' && 'Recuperar Acesso'}
                {authMode === 'otp' && 'Validação em Duas Etapas'}
              </h2>
              <p className="text-[11px] text-slate-400 font-black uppercase tracking-[0.2em]">
                {authMode === 'login' && 'Faça login para gerenciar suas demandas'}
                {authMode === 'register' && 'Crie sua conta em menos de 1 minuto'}
                {authMode === 'forgot' && 'Enviaremos um código de 6 dígitos'}
                {authMode === 'otp' && 'Válido por 10 minutos para:'}
              </p>
              {authMode === 'otp' && (
                <div className="mt-4 p-4 bg-primary/5 rounded-2xl border border-primary/10">
                  <div className="text-primary font-black text-lg tracking-tight">{email}</div>
                </div>
              )}
            </header>

            {(authMode === 'login' || authMode === 'register') && (
              <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
                <button
                  className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-300 ${authMode === 'login' ? 'bg-white text-primary shadow-xl shadow-primary/5 ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-800'}`}
                  onClick={() => setAuthMode('login')}
                >
                  Continuar
                </button>
                <button
                  className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-300 ${authMode === 'register' ? 'bg-white text-primary shadow-xl shadow-primary/5 ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-800'}`}
                  onClick={() => setAuthMode('register')}
                >
                  Criar Conta
                </button>
              </div>
            )}

            {error && (
              <div className="p-5 bg-red-50 border-l-4 border-red-500 rounded-2xl flex items-start gap-3 text-red-700 text-[11px] font-bold shadow-sm animate-shake">
                <span className="material-symbols-outlined text-[20px] mt-0.5">report</span>
                <div className="flex-1 leading-relaxed">{error}</div>
              </div>
            )}

            {successMsg && (
              <div className="p-5 bg-emerald-50 border-l-4 border-emerald-500 rounded-2xl flex items-start gap-3 text-emerald-700 text-[11px] font-bold shadow-sm">
                <span className="material-symbols-outlined text-[20px] mt-0.5">verified_user</span>
                <div className="flex-1 leading-relaxed">{successMsg}</div>
              </div>
            )}

            <form onSubmit={handleAuth} className="space-y-6">
              {authMode === 'register' && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Nome Completo</label>
                  <input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full h-14 px-5 rounded-2xl border-2 border-slate-50 bg-slate-50 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all text-base font-bold text-slate-800"
                    placeholder="Seu nome"
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
                    className="w-full h-14 px-5 rounded-2xl border-2 border-slate-50 bg-slate-50 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all text-base font-bold text-slate-800"
                    placeholder="email@empresa.com"
                  />
                </div>
              )}

              {authMode === 'otp' && (
                <div className="space-y-8">
                  <div className="space-y-3 text-center">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Digite o Código de 6 Dígitos</label>
                    <input
                      required
                      maxLength={6}
                      autoFocus
                      type="text"
                      inputMode="numeric"
                      value={otpToken}
                      onChange={(e) => setOtpToken(e.target.value.replace(/\D/g, ''))}
                      className="w-full h-24 rounded-[32px] border-4 border-slate-100 bg-slate-50 focus:border-primary focus:bg-white transition-all text-center text-5xl font-black tracking-[0.5em] text-slate-900 shadow-inner"
                      placeholder="••••••"
                    />
                  </div>

                  <div className="flex flex-col items-center gap-4">
                    <button
                      type="button"
                      disabled={resendTimer > 0 || loading}
                      onClick={handleResendOtp}
                      className="text-[11px] font-black text-primary uppercase tracking-widest disabled:text-slate-300 hover:text-primary-dark transition-all transform active:scale-95 flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-sm">refresh</span>
                      {resendTimer > 0 ? `Novo código em ${resendTimer}s` : 'Solicitar novo código'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setAuthMode('forgot')}
                      className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors"
                    >
                      Mudar e-mail de recuperação
                    </button>
                  </div>
                </div>
              )}

              {(authMode === 'login' || authMode === 'register') && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sua Senha</label>
                    {authMode === 'login' && (
                      <button type="button" onClick={() => setAuthMode('forgot')} className="text-[9px] font-black text-primary uppercase tracking-widest hover:underline hover:text-primary-dark transition-colors">Esqueci minha senha</button>
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
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Comprar', value: 'buyer', icon: 'shopping_cart' },
                    { label: 'Vender', value: 'seller', icon: 'storefront' },
                    { label: 'Ambos', value: 'both', icon: 'handshake' }
                  ].map(t => (
                    <label key={t.value} className="cursor-pointer group">
                      <input type="radio" name="role" value={t.value} checked={role === t.value} onChange={(e) => setRole(e.target.value)} className="peer sr-only" />
                      <div className="p-4 border-2 border-slate-100 rounded-2xl flex flex-col items-center gap-2 peer-checked:border-primary peer-checked:bg-primary/5 peer-checked:text-primary group-hover:bg-slate-50 transition-all duration-300">
                        <span className="material-symbols-outlined text-[20px] transform group-hover:scale-110 transition-transform">{t.icon}</span>
                        <span className="text-[8px] font-black uppercase tracking-tight">{t.label}</span>
                      </div>
                    </label>
                  ))}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full h-16 bg-primary hover:bg-primary-dark text-white font-black rounded-3xl shadow-2xl shadow-primary/30 transition-all active:scale-[0.97] transform translate-y-0 hover:-translate-y-1 disabled:opacity-50 flex items-center justify-center gap-4 text-xs uppercase tracking-[0.2em] mt-6"
              >
                {loading ? (
                  <div className="size-6 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span>Confirmar Identidade</span>
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
                  Cancelar e voltar para o Login
                </button>
              )}
            </form>
          </div>
        </div>

        <footer className="p-10 border-t border-slate-50 bg-white">
          <div className="flex justify-center gap-10 text-[10px] font-black text-slate-300 uppercase tracking-[0.25em]">
            <span className="flex items-center gap-2"><span className="material-symbols-outlined text-emerald-500 text-lg">verified_user</span> Criptografia B2B</span>
            <span className="flex items-center gap-2"><span className="material-symbols-outlined text-blue-500 text-lg">shield</span> Dados Protegidos</span>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default LoginPage;
