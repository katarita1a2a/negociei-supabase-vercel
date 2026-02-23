import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import { supabase } from '../lib/supabase';

const LoginPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('both');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name,
              role: role,
            },
          },
        });
        if (error) throw error;
        alert('Confirme seu e-mail para ativar sua conta!');
        setIsLogin(true);
      }
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro na autenticação.');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen flex bg-background-light antialiased overflow-x-hidden">
      {/* Coluna da Esquerda (Hero Section) - Visível apenas em Desktop */}
      <aside className="hidden lg:flex lg:w-1/2 relative flex-col justify-center p-20 bg-primary overflow-hidden">
        {/* Elementos Decorativos de Fundo */}
        <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-primary via-primary-dark to-primary opacity-90 z-0"></div>
        <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-white/5 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-white/5 rounded-full blur-[100px]"></div>

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

          <div className="pt-12 flex items-center gap-6 border-t border-white/10">
            <div className="flex -space-x-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="size-10 rounded-full border-2 border-primary bg-slate-200 overflow-hidden shadow-xl">
                  <img src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="User" />
                </div>
              ))}
            </div>
            <p className="text-primary-light text-sm font-bold">
              + de <span className="text-white">5.000 empresas</span> já estão fechando negócios.
            </p>
          </div>
        </div>
      </aside>

      {/* Coluna da Direita (Formulário) */}
      <main className="w-full lg:w-1/2 flex flex-col min-h-screen relative bg-white">
        {/* Badge de Segurança (Discreto) */}
        <div className="absolute top-8 right-8 z-20 hidden sm:flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
          <span className="material-symbols-outlined text-[16px] text-emerald-500">verified</span>
          Ambiente Certificado
        </div>

        <div className="flex-1 flex items-center justify-center p-8 pt-16 pb-16">
          <div className="w-full max-w-[440px] space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Logo Centralizada e Maior */}
            <div className="flex justify-center mb-2">
              <Logo size="lg" className="transform scale-125 md:scale-150" />
            </div>

            <header className="text-center space-y-3">
              <h2 className="text-3xl font-black text-slate-900 tracking-tighter">
                {isLogin ? 'Bem-vindo de volta' : 'Faça parte da rede'}
              </h2>
              <p className="text-slate-500 font-medium">
                {isLogin
                  ? 'Acesse sua conta para continuar suas negociações.'
                  : 'Cadastro gratuito e rápido. Leva menos de 1 minuto.'}
              </p>
            </header>



            {/* Seletor de Abas */}
            <div className="flex bg-slate-100 p-1.5 rounded-xl">
              <button
                className={`flex-1 py-2.5 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${isLogin ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                onClick={() => setIsLogin(true)}
              >
                Entrar
              </button>
              <button
                className={`flex-1 py-2.5 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${!isLogin ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                onClick={() => setIsLogin(false)}
              >
                Criar Conta
              </button>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 text-sm font-medium animate-in fade-in slide-in-from-top-2">
                <span className="material-symbols-outlined text-[20px]">error_outline</span>
                {error}
              </div>
            )}

            <form onSubmit={handleAuth} className="space-y-4">
              {!isLogin && (
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

              <div className="space-y-1.5">
                <div className="flex items-center justify-between px-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Senha de Acesso</label>
                  {isLogin && <a href="#" className="text-[9px] font-black text-primary uppercase tracking-widest hover:underline">Recuperar Senha</a>}
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
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {showPassword ? 'visibility' : 'visibility_off'}
                    </span>
                  </button>
                </div>
              </div>

              {!isLogin && (
                <div className="space-y-3 pt-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Tipo de Perfil</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'Comprador', value: 'buyer', icon: 'shopping_cart' },
                      { label: 'Vendedor', value: 'seller', icon: 'storefront' },
                      { label: 'Ambos', value: 'both', icon: 'handshake' }
                    ].map(t => (
                      <label key={t.value} className="cursor-pointer group">
                        <input
                          type="radio"
                          name="role"
                          value={t.value}
                          checked={role === t.value}
                          onChange={(e) => setRole(e.target.value)}
                          className="peer sr-only"
                        />
                        <div className="p-3 border-2 border-slate-100 rounded-xl flex flex-col items-center gap-1.5 peer-checked:border-primary peer-checked:bg-primary/5 peer-checked:text-primary transition-all hover:border-slate-200">
                          <span className="material-symbols-outlined text-[18px]">
                            {t.icon}
                          </span>
                          <span className="text-[9px] font-black uppercase tracking-tight">{t.label}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full h-14 bg-primary hover:bg-primary-dark text-white font-black rounded-2xl shadow-xl shadow-primary/20 transition-all transform active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 text-xs uppercase tracking-[0.1em] mt-4"
              >
                {loading ? (
                  <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    {isLogin ? 'Entrar na Plataforma' : 'Começar a Negociar'}
                    <span className="material-symbols-outlined text-xl">arrow_forward</span>
                  </>
                )}
              </button>
            </form>
          </div>

          <footer className="pt-8 flex flex-col items-center gap-6 border-t border-slate-50">
            <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <span className="material-symbols-outlined text-[16px]">security</span>
              Sua segurança em primeiro lugar
            </div>
            <div className="flex justify-center gap-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <a className="hover:text-primary transition-colors" href="#">Ajuda</a>
              <a className="hover:text-primary transition-colors" href="#">Termos</a>
              <a className="hover:text-primary transition-colors" href="#">Privacidade</a>
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
};

export default LoginPage;
