import React, { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import OfferCard from '../components/OfferCard';
import StatusBadge from '../components/StatusBadge';
import { useDemands } from '../context/DemandsContext';
import { useAuth } from '../context/AuthContext';
import { DemandStatus, Offer } from '../types';

const DemandOffersPage: React.FC = () => {
  const { user } = useAuth();
  const { id } = useParams();
  const { demands, offers, orders } = useDemands();
  const [sortBy, setSortBy] = useState<'menor' | 'maior' | 'recent'>('menor');

  // Mapeia ID do Item -> ID da Oferta (quem está fornecendo esse item no carrinho global)
  const [selectionMap, setSelectionMap] = useState<Record<string, string>>({});

  const toggleItemSelection = (itemId: string, offerId: string) => {
    setSelectionMap(prev => {
      const newMap = { ...prev };
      if (newMap[itemId] === offerId) {
        delete newMap[itemId];
      } else {
        newMap[itemId] = offerId;
      }
      return newMap;
    });
  };

  const demand = demands.find(d => d.id === id);

  const demandOffers = useMemo(() => {
    const filtered = offers.filter(o => o.demandId === id);
    return [...filtered].sort((a, b) => {
      if (sortBy === 'menor') return a.value - b.value;
      if (sortBy === 'maior') return b.value - a.value;
      return 0;
    });
  }, [offers, id, sortBy]);

  const minPrice = useMemo(() => {
    if (demandOffers.length === 0) return 0;
    return Math.min(...demandOffers.map(o => o.value));
  }, [demandOffers]);

  // Cálculo de economia (Se houver ofertas e demanda)
  const savingsData = useMemo(() => {
    if (!demand || demandOffers.length === 0) return null;
    const refBudgetStr = demand.budget?.replace(/[^\d,]/g, '').replace(',', '.') || "0";
    const refBudget = parseFloat(refBudgetStr);
    const bestOffer = minPrice;
    const diff = refBudget - bestOffer;
    const percent = (diff / refBudget) * 100;
    return { diff, percent, refBudget };
  }, [demand, demandOffers, minPrice]);

  const { purchasedCount, totalCount } = useMemo(() => {
    const demandOrders = orders.filter(o => o.demandId === id);
    const purchasedNames = new Set();
    demandOrders.forEach(ord => ord.items?.forEach(i => purchasedNames.add(i.description)));

    return {
      purchasedCount: purchasedNames.size,
      totalCount: demand?.items?.length || 0
    };
  }, [orders, id, demand]);

  const globalTotal = useMemo(() => {
    let total = 0;
    Object.entries(selectionMap).forEach(([itemId, offerId]) => {
      const offer = offers.find(o => o.id === offerId);
      const item = offer?.items?.find(i => i.id === itemId);
      if (item) total += item.totalPrice;
    });
    return total;
  }, [selectionMap, offers]);

  if (!demand) {
    return (
      <Layout>
        <div className="py-24 text-center">
          <p className="text-xl font-black text-slate-900">Demanda não encontrada</p>
          <Link to="/" className="text-primary hover:underline mt-4 inline-block">Voltar ao Feed</Link>
        </div>
      </Layout>
    );
  }

  const isOwner = demand.ownerId === user?.id;

  if (!isOwner) {
    return (
      <Layout>
        <div className="py-24 text-center">
          <p className="text-xl font-black text-slate-900">Acesso negado</p>
          <p className="text-slate-500 mt-2">Você só pode visualizar propostas das suas próprias demandas.</p>
          <Link to="/" className="text-primary hover:underline mt-4 inline-block">Voltar ao Feed</Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout showSidebar={false}>
      <div className="max-w-[1300px] mx-auto flex flex-col gap-10 pb-20">

        {/* Floating Global Total Bar */}
        {globalTotal > 0 && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-8 duration-500">
            <div className="bg-slate-900 text-white px-10 py-5 rounded-[2.5rem] shadow-2xl flex items-center gap-8 border border-slate-800 backdrop-blur-xl bg-opacity-95">
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Total dos selecionados</span>
                <span className="text-3xl font-black text-primary-green tracking-tighter">
                  R$ {globalTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="h-10 w-px bg-slate-800"></div>
              <div className="flex flex-col text-right">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Itens marcados</span>
                <span className="text-xl font-black text-white">{Object.keys(selectionMap).length} itens</span>
              </div>
            </div>
          </div>
        )}

        {/* Navegação e Cabeçalho */}
        <div className="flex flex-col gap-6">
          <nav className="flex items-center justify-between">
            <Link to="/minhas-demandas" className="flex items-center gap-2 text-slate-500 hover:text-primary font-black text-xs uppercase tracking-widest transition-colors group">
              <span className="material-symbols-outlined text-lg group-hover:-translate-x-1 transition-transform">arrow_back</span>
              Minhas Demandas
            </Link>
            <div className="flex items-center gap-3">
              <StatusBadge status={demand.status} />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Cód: {demand.id}</span>
            </div>
          </nav>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2">
              <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter leading-none">
                {demand.title}
              </h1>
              <div className="flex flex-wrap items-center gap-4">
                <p className="text-slate-500 text-lg font-medium">
                  Compare as <strong className="text-primary">{demandOffers.length} propostas</strong> recebidas.
                </p>
                {totalCount > 0 && (
                  <div className="flex items-center gap-3 bg-slate-100 px-4 py-2 rounded-2xl">
                    <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-slate-600 tracking-widest">
                      <span className="material-symbols-outlined text-lg text-emerald-500">shopping_cart</span>
                      {purchasedCount} de {totalCount} itens comprados
                    </div>
                    <div className="w-24 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 transition-all duration-500"
                        style={{ width: `${(purchasedCount / totalCount) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 items-start">

          {/* COLUNA ESQUERDA: SUA ESPECIFICAÇÃO (REFERÊNCIA) */}
          <aside className="xl:col-span-1 space-y-6 sticky top-24">
            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-soft overflow-hidden">
              <div className="bg-slate-900 p-6 text-white">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] opacity-60 mb-1">Sua Especificação</h3>
                <p className="text-lg font-bold tracking-tight">Referência de Compra</p>
              </div>
              <div className="p-6 space-y-6">
                <div className="space-y-4">
                  {demand.items?.map(item => (
                    <div key={item.id} className="pb-4 border-b border-slate-50 last:border-0 last:pb-0">
                      <p className="text-sm font-bold text-slate-900 leading-tight mb-1">{item.description}</p>
                      <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                        <span className="text-slate-400">{item.quantity} {item.unit}</span>
                        <span className="text-slate-600">Ref: R$ {item.unitPrice?.toLocaleString('pt-BR')}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-slate-100 flex flex-col gap-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Seu Orçamento Total</span>
                  <span className="text-2xl font-black text-slate-900">{demand.budget}</span>
                </div>

                <Link to={`/demanda/editar/${demand.id}`} className="flex items-center justify-center gap-2 w-full py-3 bg-slate-50 text-slate-500 hover:text-primary hover:bg-primary/5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-transparent hover:border-primary/20">
                  <span className="material-symbols-outlined text-[18px]">edit_note</span>
                  Ajustar Especificação
                </Link>
              </div>
            </div>

            {/* Metrica de Economia */}
            {savingsData && savingsData.diff > 0 && (
              <div className="bg-emerald-600 rounded-[2rem] p-6 text-white shadow-lg shadow-emerald-100 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined fill-1">trending_down</span>
                  <span className="text-[10px] font-black uppercase tracking-widest">Economia Detectada</span>
                </div>
                <div>
                  <h4 className="text-3xl font-black leading-none">R$ {savingsData.diff.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h4>
                  <p className="text-xs font-bold opacity-80 mt-1">-{savingsData.percent.toFixed(1)}% abaixo do esperado</p>
                </div>
              </div>
            )}
          </aside>

          {/* COLUNA DIREITA: LISTA DE OFERTAS */}
          <div className="xl:col-span-3 space-y-8">
            <div className="flex flex-wrap items-center justify-between gap-6 border-b border-slate-200 pb-6">
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-3 tracking-tight uppercase">
                Propostas Disponíveis
                <span className="bg-primary text-white text-[10px] px-3 py-1 rounded-full font-black">
                  {demandOffers.length}
                </span>
              </h2>
              <div className="flex items-center gap-4">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ordenar por:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="form-select h-10 pl-4 pr-10 py-0 bg-white border border-slate-200 rounded-xl text-[10px] font-black text-slate-700 focus:ring-primary cursor-pointer shadow-sm uppercase tracking-widest"
                >
                  <option value="menor">Menor Preço Total</option>
                  <option value="maior">Maior Preço Total</option>
                  <option value="recent">Mais recente</option>
                </select>
              </div>
            </div>

            {demandOffers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {demandOffers.map((offer) => (
                  <OfferCard
                    key={offer.id}
                    offer={offer}
                    isBest={offer.value === minPrice && offer.status === 'pending'}
                    referenceBudget={savingsData?.refBudget}
                    selectionMap={selectionMap}
                    onToggleItem={toggleItemSelection}
                  />
                ))}
              </div>
            ) : (
              <div className="py-24 text-center flex flex-col items-center gap-8 bg-white rounded-[3rem] border-2 border-dashed border-slate-100 shadow-inner">
                <div className="size-24 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 animate-pulse">
                  <span className="material-symbols-outlined text-6xl">hourglass_empty</span>
                </div>
                <div className="max-w-md px-6 space-y-3">
                  <p className="text-2xl font-black text-slate-900 tracking-tight">Nenhuma proposta ainda...</p>
                  <p className="text-slate-500 font-medium leading-relaxed">
                    Sua demanda foi enviada para nossa rede de parceiros.
                    Normalmente as primeiras propostas chegam em menos de 2 horas.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default DemandOffersPage;
