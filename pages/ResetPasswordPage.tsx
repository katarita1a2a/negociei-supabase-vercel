import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

const ResetPasswordPage: React.FC = () => {
    const { session: authSession, loading: authLoading } = useAuth();
    const [localSession, setLocalSession] = useState(authSession);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [validating, setValidating] = useState(true);
    const navigate = useNavigate();
    const retryRef = useRef(0);

    // Sync local session with auth session
    useEffect(() => {
        if (authSession) {
            setLocalSession(authSession);
            setValidating(false);
            setError(null);
        }
    }, [authSession]);

    // Enhanced session detection
    useEffect(() => {
        const checkSession = async () => {
            // If the context already has it, we're good
            if (authSession) {
                setLocalSession(authSession);
                setValidating(false);
                return;
            }

            // Retry checking the session directly from Supabase a few times
            // This handles cases where HashRouter redirects before the client finishes parsing
            if (retryRef.current < 5) {
                const { data } = await supabase.auth.getSession();
                if (data.session) {
                    setLocalSession(data.session);
                    setValidating(false);
                    return;
                }

                retryRef.current++;
                setTimeout(checkSession, 800); // Wait 800ms more
            } else if (!authLoading) {
                // If after all retries and AuthContext finished loading we still have nothing
                setValidating(false);
                if (!localSession && !success) {
                    setError('Sessão de recuperação não encontrada ou expirada. Tente solicitar um novo link pelo login.');
                }
            }
        };

        if (validating) {
            checkSession();
        }
    }, [authLoading, authSession, validating, localSession, success]);

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();

        const currentSession = localSession || authSession;

        if (!currentSession) {
            setError('Sessão de autenticação ausente. Tente abrir o link do e-mail novamente.');
            return;
        }

        if (password !== confirmPassword) {
            setError('As senhas não coincidem.');
            return;
        }

        if (password.length < 6) {
            setError('A senha deve ter pelo menos 6 caracteres.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const { error: updateError } = await supabase.auth.updateUser({
                password: password
            });

            if (updateError) throw updateError;

            setSuccess(true);
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (err: any) {
            setError(err.message || 'Ocorreu um erro ao atualizar a senha.');
        } finally {
            setLoading(false);
        }
    };

    if (validating || (authLoading && !localSession)) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-background-light p-6">
                <div className="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-slate-500 font-bold animate-pulse text-xs uppercase tracking-widest">Validando Sessão de Segurança...</p>
                <p className="text-slate-400 text-[10px] mt-2 italic">Isso pode levar alguns segundos</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background-light p-6">
            <div className="w-full max-w-[440px] space-y-10 bg-white p-8 sm:p-12 rounded-3xl shadow-xl shadow-slate-200/50 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="flex justify-center">
                    <Logo size="lg" className="transform scale-125" />
                </div>

                <header className="text-center space-y-3">
                    <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tighter">
                        Nova Senha
                    </h2>
                    <p className="text-sm text-slate-500 font-medium leading-relaxed">
                        Crie uma senha forte e segura para proteger sua conta.
                    </p>
                </header>

                {success ? (
                    <div className="p-6 bg-emerald-50 border border-emerald-100 rounded-2xl text-center space-y-4 animate-in zoom-in-95">
                        <div className="size-16 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-200">
                            <span className="material-symbols-outlined text-3xl">check</span>
                        </div>
                        <div className="space-y-1">
                            <p className="text-emerald-700 font-black">Senha atualizada!</p>
                            <p className="text-emerald-600/80 text-xs font-medium">Você será redirecionado para o login em instantes.</p>
                        </div>
                    </div>
                ) : (localSession || authSession ? (
                    <form onSubmit={handleReset} className="space-y-6">
                        {error && (
                            <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 text-sm font-medium">
                                <span className="material-symbols-outlined text-[20px]">error_outline</span>
                                <span className="flex-1">{error}</span>
                            </div>
                        )}

                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Nova Senha</label>
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
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">
                                            {showPassword ? 'visibility' : 'visibility_off'}
                                        </span>
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Confirmar Nova Senha</label>
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">lock_reset</span>
                                    <input
                                        required
                                        type={showPassword ? 'text' : 'password'}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full h-12 pl-11 pr-12 rounded-xl border border-slate-100 bg-slate-50 focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white transition-all text-sm font-bold text-slate-800"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full h-14 bg-primary hover:bg-primary-dark text-white font-black rounded-2xl shadow-xl shadow-primary/20 transition-all transform active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 text-xs uppercase tracking-[0.1em]"
                        >
                            {loading ? (
                                <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                'Atualizar Senha'
                            )}
                        </button>
                    </form>
                ) : (
                    <div className="space-y-6">
                        <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 text-xs font-bold">
                            <span className="material-symbols-outlined text-[20px]">error_outline</span>
                            <span className="flex-1">{error}</span>
                        </div>
                        <button
                            type="button"
                            onClick={() => navigate('/login')}
                            className="w-full h-12 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black rounded-xl transition-all text-[10px] uppercase tracking-widest"
                        >
                            Voltar para o Login
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ResetPasswordPage;
