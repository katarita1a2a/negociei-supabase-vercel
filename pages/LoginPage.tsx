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
    <div className="min-h-screen flex flex-col bg-background-light antialiased">
      {/* Navbar Simplified */}
      <nav className="w-full px-6 py-4 flex justify-center sm:justify-start">
        <Logo size="md" />
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4 pb-12">
        <div className="w-full max-w-[560px] relative">
          <div className="absolute -top-10 -left-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl"></div>

          <div className="bg-white rounded-xl shadow-xl border border-slate-100 relative overflow-hidden">
            <div className="h-1.5 w-full bg-gradient-to-r from-primary/60 via-primary to-primary/60"></div>
            <div className="px-8 py-10 sm:px-12 sm:py-12">

              <div className="flex bg-slate-100 p-1 rounded-lg mb-8">
                <button
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${isLogin ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  onClick={() => setIsLogin(true)}
                >
                  Entrar
                </button>
                <button
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${!isLogin ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  onClick={() => setIsLogin(false)}
                >
                  Criar Conta
                </button>
              </div>

              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 mb-2">
                  {isLogin ? 'Bem-vindo de volta' : 'Crie sua conta'}
                </h1>
                <p className="text-slate-500 text-sm">
                  {isLogin ? 'Acesse sua conta para continuar suas negociações.' : 'Junte-se a maior plataforma B2B de negociação.'}
                </p>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-lg flex items-center gap-3 text-red-600 text-sm font-medium animate-in fade-in slide-in-from-top-2">
                  <span className="material-symbols-outlined text-[20px]">error</span>
                  {error}
                </div>
              )}

              <form onSubmit={handleAuth} className="flex flex-col gap-5">
                {!isLogin && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-slate-900" htmlFor="name">Nome Completo</label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">person</span>
                      <input
                        required
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full rounded-lg border-slate-200 bg-slate-50 h-12 pl-11 focus:ring-primary focus:border-primary transition-colors"
                        placeholder="Seu nome"
                      />
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-slate-900" htmlFor="email">E-mail</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">mail</span>
                    <input
                      required
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-lg border-slate-200 bg-slate-50 h-12 pl-11 focus:ring-primary focus:border-primary transition-colors"
                      placeholder="seuemail@empresa.com"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-slate-900" htmlFor="password">Senha</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">lock</span>
                    <input
                      required
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-lg border-slate-200 bg-slate-50 h-12 pl-11 focus:ring-primary focus:border-primary transition-colors"
                      placeholder="Sua senha segura"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      <span className="material-symbols-outlined">
                        {showPassword ? 'visibility' : 'visibility_off'}
                      </span>
                    </button>
                  </div>
                  {isLogin && <a className="text-xs text-primary font-semibold self-end mt-1 hover:underline" href="#">Esqueceu a senha?</a>}
                </div>

                {!isLogin && (
                  <div className="flex flex-col gap-3">
                    <span className="text-sm font-medium text-slate-900">Tipo de perfil</span>
                    <div className="grid grid-cols-3 gap-2">
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
                          <div className="p-3 border rounded-lg flex flex-col items-center gap-1 peer-checked:border-primary peer-checked:bg-primary/5 peer-checked:text-primary transition-all hover:bg-slate-50">
                            <span className="material-symbols-outlined text-xl">
                              {t.icon}
                            </span>
                            <span className="text-xs font-bold">{t.label}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary hover:bg-primary-dark text-white font-bold h-12 rounded-lg shadow-lg shadow-primary/20 transition-all transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading && <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
                  {isLogin ? 'Entrar' : 'Criar conta grátis'}
                </button>
              </form>

              <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col items-center gap-4">
                <div className="flex items-center gap-2 text-xs text-slate-400 font-bold uppercase tracking-widest">
                  <span className="material-symbols-outlined text-[16px]">lock</span> Ambiente Seguro
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-center gap-6 text-sm text-slate-500">
            <a className="hover:text-primary" href="#">Termos de Uso</a>
            <a className="hover:text-primary" href="#">Privacidade</a>
            <a className="hover:text-primary" href="#">Ajuda</a>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LoginPage;
