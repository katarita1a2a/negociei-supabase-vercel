import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { useDemands } from '../context/DemandsContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const MyOffersPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { offers, demands, orders, deleteOffer, isLoading } = useDemands();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Todas' | 'pending' | 'accepted' | 'rejected'>('Todas');
  const [dateRange, setDateRange] = useState<'all' | '7d' | '30d' | 'thisMonth' | 'custom'>('all');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [expandedOfferId, setExpandedOfferId] = useState<string | null>(null);

  // Filtra as ofertas enviadas pelo usuário atual e aplica filtros locais
  const myOffers = useMemo(() => {
    let filtered = offers.filter(o => o.sellerId === user?.id);

    // Filtro de Busca
    if (searchTerm) {
      filtered = filtered.filter(o => {
        const demand = demands.find(d => d.id === o.demandId);
        return (
          demand?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          o.id.toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
    }

    // Filtro de Status
    if (statusFilter !== 'Todas') {
      filtered = filtered.filter(o => o.status === statusFilter);
    }

    // Filtro de Data
    if (dateRange !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      filtered = filtered.filter(o => {
        const createdDate = new Date(o.createdAt);

        if (dateRange === '7d') {
          const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
          return createdDate >= sevenDaysAgo;
        }
        if (dateRange === '30d') {
          const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
          return createdDate >= thirtyDaysAgo;
        }
        if (dateRange === 'thisMonth') {
          return createdDate.getMonth() === now.getMonth() && createdDate.getFullYear() === now.getFullYear();
        }
        if (dateRange === 'custom') {
          if (customStart && createdDate < new Date(customStart)) return false;
          if (customEnd && createdDate > new Date(customEnd)) return false;
          return true;
        }
        return true;
      });
    }

    // Ordenação fixa por recentes (ID descendente)
    return [...filtered].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [offers, demands, searchTerm, statusFilter, dateRange, customStart, customEnd]);

  const toggleExpand = (id: string) => {
    setExpandedOfferId(expandedOfferId === id ? null : id);
  };

  return (
    <Layout showSidebar={false}>
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24">
          <div className="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-bold mt-4 animate-pulse uppercase tracking-widest text-xs">Carregando suas propostas...</p>
        </div>
      ) : (
        <>
          <div className="max-w-[1200px] mx-auto flex flex-col gap-8 pb-12">
            {/* Breadcrumbs */}
            <nav className="flex items-center gap-2 text-sm text-slate-500 font-medium">
              <Link to="/" className="hover:text-primary flex items-center gap-1">
                <span className="material-symbols-outlined text-lg">home</span> Início
              </Link>
              <span className="material-symbols-outlined text-sm">chevron_right</span>
              <span className="text-slate-900 font-bold">Minhas Ofertas</span>
            </nav>

            <div className="flex flex-col gap-2">
              <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">Minhas Propostas Comerciais</h1>
              <p className="text-slate-500">Gerencie todos os orçamentos que você enviou e acompanhe o fechamento de novos negócios.</p>
            </div>

            {/* Filtros e Busca */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                  <input
                    type="text"
                    placeholder="Buscar por título da demanda ou ID da proposta..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 h-12 bg-slate-50 border-slate-200 rounded-xl text-sm focus:ring-primary focus:border-primary transition-all"
                  />
                </div>

                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">calendar_month</span>
                  <select
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value as any)}
                    className="w-full pl-10 h-12 bg-slate-50 border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:ring-primary transition-all cursor-pointer"
                  >
                    <option value="all">Todo o período</option>
                    <option value="7d">Últimos 7 dias</option>
                    <option value="30d">Últimos 30 dias</option>
                    <option value="thisMonth">Este Mês</option>
                    <option value="custom">Customizado...</option>
                  </select>
                </div>
              </div>

              {/* Custom Date Range Inputs */}
              {dateRange === 'custom' && (
                <div className="flex flex-wrap items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 animate-in slide-in-from-top-2 duration-300">
                  <div className="flex flex-col gap-1 flex-1 min-w-[150px]">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Data Início</span>
                    <input
                      type="date"
                      value={customStart}
                      onChange={(e) => setCustomStart(e.target.value)}
                      className="h-10 px-3 bg-white border-slate-200 rounded-lg text-sm focus:ring-primary"
                    />
                  </div>
                  <div className="flex flex-col gap-1 flex-1 min-w-[150px]">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Data Fim</span>
                    <input
                      type="date"
                      value={customEnd}
                      onChange={(e) => setCustomEnd(e.target.value)}
                      className="h-10 px-3 bg-white border-slate-200 rounded-lg text-sm focus:ring-primary"
                    />
                  </div>
                  <button
                    onClick={() => { setCustomStart(''); setCustomEnd(''); }}
                    className="mt-5 h-10 px-4 text-xs font-bold text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    LIMPAR DATAS
                  </button>
                </div>
              )}

              <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-hide border-t border-slate-100 pt-4">
                {[
                  { id: 'Todas', label: 'Todas as Ofertas' },
                  { id: 'pending', label: 'Pendentes' },
                  { id: 'accepted', label: 'Aceitas' },
                  { id: 'rejected', label: 'Recusadas' }
                ].map((st) => (
                  <button
                    key={st.id}
                    onClick={() => setStatusFilter(st.id as any)}
                    className={`px-5 py-2 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${statusFilter === st.id
                      ? 'bg-slate-900 text-white shadow-md'
                      : 'text-slate-500 hover:bg-slate-100'
                      }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            {myOffers.length > 0 ? (
              <div className="flex flex-col gap-4">
                <div className="px-2 flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Mostrando {myOffers.length} ofertas encontradas</span>
                </div>
                {myOffers.map((offer) => {
                  const demand = demands.find(d => d.id === offer.demandId);
                  const isAccepted = offer.status === 'accepted';
                  const isRejected = offer.status === 'rejected';
                  const isExpanded = expandedOfferId === offer.id;

                  // Parsing demand budget for comparison
                  const demandBudgetStr = demand?.budget?.replace(/[^\d,]/g, '').replace(',', '.') || "0";
                  const demandBudgetValue = parseFloat(demandBudgetStr);
                  const isBelowBudget = offer.value <= demandBudgetValue;
                  const diffValue = demandBudgetValue - offer.value;
                  const diffPercent = demandBudgetValue > 0 ? (Math.abs(diffValue) / demandBudgetValue) * 100 : 0;

                  return (
                    <div
                      key={offer.id}
                      className={`
                    bg-white rounded-2xl border transition-all overflow-hidden
                    ${isAccepted ? 'border-primary-green ring-1 ring-primary-green/20' : isRejected ? 'border-slate-100 opacity-75' : 'border-slate-200'}
                    ${isExpanded ? 'shadow-xl' : 'shadow-sm hover:shadow-md'}
                  `}
                    >
                      <div className={`p-5 md:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 ${isAccepted ? 'bg-green-50/20' : ''}`}>
                        <div className="flex-1 flex gap-5 items-center">
                          <div className={`size-14 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform ${isAccepted ? 'bg-primary-green text-slate-900 shadow-lg shadow-green-200' :
                            isRejected ? 'bg-slate-100 text-slate-400' : 'bg-blue-50 text-primary'
                            }`}>
                            <span className="material-symbols-outlined text-[32px]">
                              {isAccepted ? 'check_circle' : isRejected ? 'cancel' : 'outbox'}
                            </span>
                          </div>
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <h3 className="font-black text-slate-900 leading-tight text-lg">
                                {demand?.title || 'Demanda Inexistente'}
                              </h3>
                              {isAccepted && (
                                <div className="bg-primary-green text-slate-900 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 uppercase tracking-tighter border border-green-400">
                                  <span className="material-symbols-outlined text-[14px] fill-1">celebration</span>
                                  NEGÓCIO FECHADO
                                </div>
                              )}
                              <span className="text-[10px] text-slate-400 font-medium">Enviada em: {new Date(offer.createdAt).toLocaleDateString('pt-BR')}</span>
                            </div>
                            <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm text-slate-500">
                              <span className="flex items-center gap-1.5 font-medium">
                                <span className="material-symbols-outlined text-[18px] text-slate-400">location_on</span>
                                {demand?.location || '---'}
                              </span>
                              <span className="flex items-center gap-1.5 font-medium">
                                <span className="material-symbols-outlined text-[18px] text-slate-400">payments</span>
                                Sua Oferta: <strong className={`text-base ${isAccepted ? 'text-green-700' : 'text-primary'}`}>R$ {offer.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 w-full md:w-auto border-t md:border-t-0 pt-4 md:pt-0">
                          <div className="flex gap-2 w-full">
                            <button
                              onClick={() => toggleExpand(offer.id)}
                              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all ${isExpanded ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                            >
                              {isExpanded ? 'Ocultar' : 'Detalhes'}
                            </button>

                            {isAccepted ? (
                              <Link
                                to={`/demanda/${offer.demandId}/pedido`}
                                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-primary-green text-slate-900 rounded-xl hover:bg-green-500 transition-all font-black text-xs shadow-lg shadow-green-200"
                              >
                                <span className="material-symbols-outlined text-[18px]">description</span>
                                VER PEDIDO
                              </Link>
                            ) : (
                              <div className="flex gap-2">
                                {!isRejected && orders.every(o => String(o.demandId) !== String(offer.demandId)) && (
                                  <>
                                    <button
                                      onClick={() => navigate(`/oferta/editar/${offer.id}`)}
                                      className="flex items-center justify-center gap-2 px-4 py-2 bg-amber-50 text-amber-600 border border-amber-200 rounded-xl hover:bg-amber-100 transition-all font-bold text-xs"
                                    >
                                      <span className="material-symbols-outlined text-[18px]">edit</span>
                                      Editar
                                    </button>
                                    <button
                                      onClick={async () => {
                                        if (window.confirm('Deseja realmente excluir sua proposta?')) {
                                          try {
                                            await deleteOffer(offer.id);
                                          } catch (err) {
                                            alert('Erro ao excluir a proposta.');
                                          }
                                        }
                                      }}
                                      className="flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-xl hover:bg-red-100 transition-all font-bold text-xs"
                                    >
                                      <span className="material-symbols-outlined text-[18px]">delete</span>
                                      Excluir
                                    </button>
                                  </>
                                )}
                                <Link
                                  to={`/demanda/${offer.demandId}`}
                                  className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors font-bold text-xs shadow-sm"
                                >
                                  Ver Demanda
                                </Link>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="border-t border-slate-100 bg-slate-50/30 p-6 animate-in slide-in-from-top-4 duration-300">
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-1 space-y-6">
                              {/* Comparativo de Valor */}
                              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Comparativo vs Demanda</h4>
                                <div className="space-y-3">
                                  <div className="flex justify-between items-center">
                                    <span className="text-xs text-slate-500">Budget do Comprador:</span>
                                    <span className="text-xs font-bold text-slate-900">{demand?.budget}</span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-xs text-slate-500">Sua Oferta Total:</span>
                                    <span className="text-xs font-black text-primary">R$ {offer.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                  </div>
                                  {demandBudgetValue > 0 ? (
                                    <div className={`flex justify-between items-center pt-2 border-t border-slate-100 ${diffValue > 0 ? 'text-emerald-600' : diffValue < 0 ? 'text-red-500' : 'text-slate-500'}`}>
                                      <span className="text-[10px] font-black uppercase tracking-widest">Diferença:</span>
                                      <div className="text-right">
                                        <p className="text-xs font-black">
                                          {diffValue >= 0 ? '+' : ''} R$ {diffValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </p>
                                        <p className="text-[9px] font-bold">({diffValue >= 0 ? 'Abaixo' : 'Acima'} do budget: {diffPercent.toFixed(1)}%)</p>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex justify-between items-center pt-2 border-t border-slate-100 text-slate-500 italic">
                                      <span className="text-[10px] font-black uppercase tracking-widest">Negociação:</span>
                                      <span className="text-[10px] font-bold">Valor a combinar</span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div>
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Sua Proposta Técnica</h4>
                                <div className="bg-white p-4 rounded-xl border border-slate-200 text-sm text-slate-600 italic leading-relaxed shadow-sm">
                                  "{offer.message || 'Sem mensagem adicional.'}"
                                </div>
                              </div>

                              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Condições</h4>
                                <div className="space-y-2">
                                  <div className="flex justify-between text-xs">
                                    <span className="text-slate-500">Prazo de Entrega:</span>
                                    <span className="text-slate-900 font-bold">{offer.deadlineDays} dias úteis</span>
                                  </div>
                                  <div className="flex justify-between text-xs">
                                    <span className="text-slate-500">Garantia:</span>
                                    <span className="text-slate-900 font-bold">{offer.warrantyMonths} meses</span>
                                  </div>
                                  <div className="flex justify-between text-xs pt-2 border-t border-slate-50">
                                    <span className="text-slate-500">ID da Proposta:</span>
                                    <span className="font-mono text-slate-900">#{offer.id}</span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="lg:col-span-2">
                              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Detalhamento Financeiro</h4>
                              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                                <table className="w-full text-left border-collapse text-sm">
                                  <thead>
                                    <tr className="bg-slate-50 border-b border-slate-100">
                                      <th className="py-3 px-4 font-black uppercase text-slate-400 text-[10px]">Item</th>
                                      <th className="py-3 px-4 font-black uppercase text-slate-400 text-[10px] text-center">Qtd</th>
                                      <th className="py-3 px-4 font-black uppercase text-slate-400 text-[10px] text-right">Unitário</th>
                                      <th className="py-3 px-4 font-black uppercase text-slate-400 text-[10px] text-right">Total</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-50">
                                    {offer.items?.map((item) => (
                                      <tr key={item.id}>
                                        <td className="py-3 px-4 font-bold text-slate-800">{item.description}</td>
                                        <td className="py-3 px-4 text-center text-slate-500">{item.quantity} {item.unit}</td>
                                        <td className="py-3 px-4 text-right text-slate-600">
                                          R$ {(item.unitPrice || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="py-3 px-4 text-right font-black text-slate-900">
                                          R$ {((item.unitPrice || 0) * item.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                  <tfoot>
                                    <tr className="bg-slate-50/50 font-black border-t border-slate-100">
                                      <td colSpan={3} className="py-4 px-4 text-slate-500 text-right uppercase tracking-wider text-[10px]">Valor Total da Oferta:</td>
                                      <td className={`py-4 px-4 text-lg text-right ${isAccepted ? 'text-green-600' : 'text-primary'}`}>
                                        R$ {offer.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                      </td>
                                    </tr>
                                  </tfoot>
                                </table>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-20 text-center flex flex-col items-center gap-6 bg-white rounded-3xl border-2 border-dashed border-slate-100 shadow-inner">
                <div className="size-24 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                  <span className="material-symbols-outlined text-6xl">outbox</span>
                </div>
                <div className="max-w-md px-4">
                  <p className="text-2xl font-black text-slate-900 mb-2">Nenhuma proposta encontrada</p>
                  <p className="text-sm text-slate-500 leading-relaxed mb-8">
                    Tente ajustar o período ou filtros para encontrar suas ofertas passadas.
                  </p>
                  <Link to="/" className="inline-flex items-center gap-2 px-10 py-4 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/30 hover:bg-blue-600 transition-all transform active:scale-95">
                    <span className="material-symbols-outlined">explore</span>
                    EXPLORAR FEED
                  </Link>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </Layout>
  );
};

export default MyOffersPage;
