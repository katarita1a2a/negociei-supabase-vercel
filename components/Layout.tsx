import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BR_STATES, CATEGORIES } from '../mockData';
import { useDemands } from '../context/DemandsContext';
import { useAuth } from '../context/AuthContext';
import Logo from './Logo';

interface LayoutProps {
  children: React.ReactNode;
  showSidebar?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, showSidebar = true }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { filters, setFilters, resetFilters, notifications = [], markNotificationsAsRead } = useDemands();
  const { user, signOut } = useAuth();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const unreadCount = (notifications || []).filter(n => !n.read).length;

  const [cities, setCities] = useState<string[]>([]);
  const [isLoadingCities, setIsLoadingCities] = useState(false);

  useEffect(() => {
    if (filters.state) {
      setIsLoadingCities(true);
      fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${filters.state}/municipios`)
        .then(response => response.json())
        .then(data => {
          const cityNames = data.map((city: any) => city.nome).sort();
          setCities(cityNames);
          setIsLoadingCities(false);
        })
        .catch(() => {
          setIsLoadingCities(false);
          setCities([]);
        });
    } else {
      setCities([]);
    }
  }, [filters.state]);

  const toggleCategory = (cat: string) => {
    setFilters(prev => ({
      ...prev,
      categories: prev.categories.includes(cat)
        ? prev.categories.filter(c => c !== cat)
        : [...prev.categories, cat]
    }));
  };

  const navLinks = [
    { label: 'Feed', path: '/', icon: 'list_alt' },
    { label: 'Demandas', path: '/minhas-demandas', icon: 'inventory' },
    { label: 'Propostas', path: '/ofertas', icon: 'send' },
    { label: 'Dashboard', path: '/dashboard', icon: 'dashboard' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background-light">
      {/* Topbar Refinada */}
      <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-lg border-b border-slate-100 shadow-sm">
        <div className="px-6 md:px-10 flex items-center justify-between h-20 max-w-[1536px] mx-auto w-full">
          <div className="flex items-center gap-6">
            <button
              className="lg:hidden p-2 text-slate-500 hover:bg-slate-50 rounded-lg"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
            <Link to="/" className="flex-shrink-0">
              <Logo size="md" />
            </Link>

            <div className="hidden lg:flex flex-1 max-w-lg ml-10">
              <label className="relative flex w-full items-center">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-400">
                  <span className="material-symbols-outlined text-[20px]">search</span>
                </div>
                <input
                  className="block w-full h-11 rounded-xl border-none bg-slate-100 py-2.5 pl-11 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all shadow-inner"
                  placeholder="Pesquisar demandas por título ou código..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                />
              </label>
            </div>
          </div>

          <div className="flex items-center gap-4 lg:gap-8">
            <nav className="hidden lg:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  to={link.path}
                  className={`text-[11px] font-black uppercase tracking-widest transition-all hover:text-primary ${(location.pathname === link.path) ? 'text-primary' : 'text-slate-500'
                    }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="flex items-center gap-3">
              <button
                onClick={signOut}
                className="hidden sm:flex items-center justify-center size-10 rounded-full bg-slate-50 text-slate-500 hover:bg-red-50 hover:text-red-500 transition-colors"
                title="Sair"
              >
                <span className="material-symbols-outlined text-[20px]">logout</span>
              </button>
              <div className="relative">
                <button
                  onClick={() => {
                    setIsNotificationsOpen(!isNotificationsOpen);
                    if (!isNotificationsOpen) markNotificationsAsRead();
                  }}
                  className={`relative flex items-center justify-center size-10 rounded-full transition-colors ${isNotificationsOpen ? 'bg-primary text-white shadow-lg' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                >
                  <span className="material-symbols-outlined text-[20px]">notifications</span>
                  {unreadCount > 0 && (
                    <span className="absolute top-2.5 right-2.5 size-2 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
                  )}
                </button>

                {isNotificationsOpen && (
                  <div className="absolute top-full right-0 mt-3 w-80 bg-white rounded-2xl border border-slate-100 shadow-2xl z-[60] overflow-hidden flex flex-col max-h-[480px]">
                    <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                      <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Notificações</h3>
                      <span className="text-[10px] font-bold text-slate-400">{notifications.length} total</span>
                    </div>

                    <div className="overflow-y-auto">
                      {notifications.length > 0 ? (
                        <div className="divide-y divide-slate-50">
                          {notifications.map((notif) => (
                            <Link
                              key={notif.id}
                              to={notif.link}
                              onClick={() => setIsNotificationsOpen(false)}
                              className="block p-4 hover:bg-slate-50 transition-colors"
                            >
                              <div className="flex gap-3">
                                <div className={`size-8 rounded-lg flex items-center justify-center flex-shrink-0 ${notif.type === 'new_offer' ? 'bg-blue-50 text-blue-500' : 'bg-emerald-50 text-emerald-500'}`}>
                                  <span className="material-symbols-outlined text-[18px]">
                                    {notif.type === 'new_offer' ? 'local_offer' : 'shopping_cart_checkout'}
                                  </span>
                                </div>
                                <div className="space-y-1">
                                  <p className="text-xs font-black text-slate-900 leading-tight">{notif.title}</p>
                                  <p className="text-[11px] text-slate-500 leading-relaxed font-medium line-clamp-2">{notif.message}</p>
                                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">
                                    {new Date(notif.createdAt).toLocaleDateString()} • {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </p>
                                </div>
                              </div>
                            </Link>
                          ))}
                        </div>
                      ) : (
                        <div className="p-10 text-center space-y-3">
                          <div className="size-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-300">
                            <span className="material-symbols-outlined text-3xl">notifications_off</span>
                          </div>
                          <p className="text-xs font-bold text-slate-400">Nenhuma notificação por aqui.</p>
                        </div>
                      )}
                    </div>

                    {notifications.length > 0 && (
                      <div className="p-3 bg-slate-50/80 border-t border-slate-100">
                        <button
                          onClick={() => setIsNotificationsOpen(false)}
                          className="w-full py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-primary transition-colors"
                        >
                          Fechar
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Backdrop invisível para fechar ao clicar fora */}
                {isNotificationsOpen && (
                  <div
                    className="fixed inset-0 z-[-1]"
                    onClick={() => setIsNotificationsOpen(false)}
                  />
                )}
              </div>
              <Link to="/perfil" className="size-10 rounded-full border border-slate-200 cursor-pointer overflow-hidden shadow-soft flex items-center justify-center bg-slate-100">
                {user?.user_metadata?.avatar_url ? (
                  <img src={user.user_metadata.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="material-symbols-outlined text-slate-400">person</span>
                )}
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex max-w-[1536px] mx-auto w-full relative">
        {/* Mobile Backdrop */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden" onClick={() => setIsMobileMenuOpen(false)} />
        )}

        {/* Sidebar Clean */}
        {showSidebar && (
          <aside className={`
            fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-100 p-8 flex flex-col gap-10 overflow-y-auto transition-transform lg:static lg:translate-x-0
            ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
          `}>
            <div className="lg:hidden flex justify-end mb-4">
              <button onClick={() => setIsMobileMenuOpen(false)} className="size-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <Link to="/demanda/nova" className="w-full flex items-center justify-center gap-2 bg-primary text-white text-xs font-black uppercase tracking-widest py-4 px-4 rounded-xl shadow-lg shadow-primary/10 transition-all transform hover:scale-[1.02] hover:bg-primary-dark">
              <span className="material-symbols-outlined text-[18px]">add_circle</span>
              Criar nova demanda
            </Link>

            <div className="flex flex-col gap-8">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-slate-900 font-black uppercase text-[10px] tracking-widest">Filtros Avançados</h3>
                <button onClick={resetFilters} className="text-[10px] text-primary font-bold hover:underline">Limpar</button>
              </div>

              <div className="space-y-6">
                {/* State Filter */}
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Localidade (UF)</label>
                  <select
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 px-4 text-xs font-bold focus:ring-primary/20 transition-all cursor-pointer"
                    value={filters.state}
                    onChange={(e) => setFilters(prev => ({ ...prev, state: e.target.value, city: '' }))}
                  >
                    <option value="">Brasil (Todos)</option>
                    {BR_STATES.map(s => <option key={s.uf} value={s.uf}>{s.name}</option>)}
                  </select>
                </div>

                {/* City Filter */}
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cidade</label>
                  <select
                    className={`w-full rounded-xl border border-slate-200 bg-slate-50 py-3 px-4 text-xs font-bold focus:ring-primary/20 transition-all cursor-pointer ${!filters.state ? 'opacity-50' : ''}`}
                    disabled={!filters.state || isLoadingCities}
                    value={filters.city}
                    onChange={(e) => setFilters(prev => ({ ...prev, city: e.target.value }))}
                  >
                    <option value="">{isLoadingCities ? 'Carregando...' : 'Todas as Cidades'}</option>
                    {cities.map(city => <option key={city} value={city}>{city}</option>)}
                  </select>
                </div>

                {/* Category Filter */}
                <div className="flex flex-col gap-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Categorias</label>
                  <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-2">
                    {CATEGORIES.slice(0, 10).map((cat) => (
                      <label key={cat} className="flex items-center gap-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={filters.categories.includes(cat)}
                          onChange={() => toggleCategory(cat)}
                          className="rounded border-slate-200 text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                        />
                        <span className="text-xs font-medium text-slate-500 group-hover:text-slate-900 transition-colors">{cat}</span>
                      </label>
                    ))}
                    <button className="text-[9px] font-black text-primary uppercase tracking-widest pt-2 text-left hover:underline">Ver todas as categorias</button>
                  </div>
                </div>

                {/* Status Filter */}
                <div className="flex flex-col gap-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status da Demanda</label>
                  <div className="space-y-2">
                    {['Todas', 'Abertas', 'Em análise'].map((st) => (
                      <label key={st} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:border-primary/30 cursor-pointer transition-all">
                        <input
                          type="radio"
                          name="status"
                          checked={filters.status === st}
                          onChange={() => setFilters(prev => ({ ...prev, status: st }))}
                          className="h-4 w-4 border-slate-300 text-primary focus:ring-primary"
                        />
                        <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">{st}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </aside>
        )}

        {/* Main Content */}
        <main className="flex-1 p-8 md:p-12 overflow-x-hidden">
          <div className="max-w-[1200px] mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Floating Action Mobile */}
      {location.pathname === '/' && (
        <Link to="/demanda/nova" className="lg:hidden fixed bottom-10 right-8 size-14 bg-primary text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-105 transition-transform z-40">
          <span className="material-symbols-outlined">add</span>
        </Link>
      )}
    </div>
  );
};

export default Layout;
