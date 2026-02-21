
import React, { useState, useMemo } from 'react';
import Layout from '../components/Layout';
import DemandCard from '../components/DemandCard';
import DemandListItem from '../components/DemandListItem';
import { useDemands } from '../context/DemandsContext';

const FeedPage: React.FC = () => {
  const { filteredDemands } = useDemands();
  const [isBannerVisible, setIsBannerVisible] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('recent');

  const sortedDemands = useMemo(() => {
    const result = [...filteredDemands];
    
    if (sortBy === 'recent') {
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortBy === 'budget') {
      const getVal = (s?: string) => parseFloat(s?.replace(/[^\d]/g, '') || '0');
      result.sort((a, b) => getVal(b.budget) - getVal(a.budget));
    } else if (sortBy === 'deadline') {
      const parseDate = (d: string) => {
        const [day, month, year] = d.split('/');
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day)).getTime();
      };
      result.sort((a, b) => parseDate(a.deadline) - parseDate(b.deadline));
    }
    
    return result;
  }, [filteredDemands, sortBy]);

  return (
    <Layout>
      <div className="flex flex-col gap-10">
        {/* Bloco Como Funciona */}
        {isBannerVisible ? (
          <section className="bg-white rounded-2xl border border-slate-200 shadow-soft overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="p-8 relative">
              <button 
                onClick={() => setIsBannerVisible(false)}
                className="absolute top-6 right-6 text-slate-300 hover:text-slate-900 transition-colors"
                aria-label="Fechar guia"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>

              <div className="flex flex-col lg:flex-row gap-10 items-center">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-2 text-primary font-black uppercase text-xs tracking-widest">
                    <span className="material-symbols-outlined text-[20px] fill-1">tips_and_updates</span>
                     Marketplace Reverso
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">Onde quem manda é o comprador</h2>
                  <p className="text-slate-500 leading-relaxed text-sm max-w-xl">
                    No <span className="font-bold text-slate-900">Negociei.app</span> você descreve sua necessidade e os fornecedores competem para oferecer o melhor preço e prazo. Simples, rápido e inteligente.
                  </p>
                </div>
                
                <div className="w-full lg:w-auto flex flex-col sm:flex-row gap-8 lg:border-l lg:border-slate-100 lg:pl-10">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 size-10 rounded-full bg-primary/5 text-primary flex items-center justify-center font-black">1</div>
                    <div>
                      <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Poste</p>
                      <p className="text-[11px] text-slate-400 font-medium">Sua necessidade</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 size-10 rounded-full bg-primary/5 text-primary flex items-center justify-center font-black">2</div>
                    <div>
                      <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Analise</p>
                      <p className="text-[11px] text-slate-400 font-medium">As propostas</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 size-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-black">3</div>
                    <div>
                      <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Economize</p>
                      <p className="text-[11px] text-slate-400 font-medium">Feche o negócio</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        ) : (
          <div className="flex justify-start">
            <button 
              onClick={() => setIsBannerVisible(true)}
              className="group text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 hover:text-primary transition-all bg-white px-5 py-2 rounded-full border border-slate-200 shadow-soft"
            >
              <span className="material-symbols-outlined text-[18px] text-primary fill-1 group-hover:rotate-12 transition-transform">rocket_launch</span>
              Como economizar?
            </button>
          </div>
        )}

        {/* Content Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Feed de Demandas</h1>
            <p className="text-sm text-slate-500 font-medium">Explorando <span className="text-slate-900 font-bold">{sortedDemands.length}</span> oportunidades em tempo real</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-white rounded-xl border border-slate-200 p-1 shadow-sm">
              <button 
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-slate-100 text-primary' : 'text-slate-300 hover:text-slate-500'}`}
                title="Visualização em Grade"
              >
                <span className="material-symbols-outlined text-[20px]">grid_view</span>
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-slate-100 text-primary' : 'text-slate-300 hover:text-slate-500'}`}
                title="Visualização em Lista"
              >
                <span className="material-symbols-outlined text-[20px]">view_list</span>
              </button>
            </div>
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="form-select h-11 pl-4 pr-10 py-2 text-[10px] font-black uppercase tracking-widest border-slate-200 focus:ring-primary rounded-xl bg-white shadow-sm cursor-pointer"
            >
              <option value="recent">Mais recentes</option>
              <option value="budget">Maior orçamento</option>
              <option value="deadline">Menor prazo</option>
            </select>
          </div>
        </div>

        {/* Listagem de Demandas */}
        {sortedDemands.length > 0 ? (
          <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8" : "flex flex-col gap-4"}>
            {sortedDemands.map((demand) => (
              viewMode === 'grid' 
                ? <DemandCard key={demand.id} demand={demand} /> 
                : <DemandListItem key={demand.id} demand={demand} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-dashed border-slate-200 shadow-inner">
            <div className="size-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-6">
              <span className="material-symbols-outlined text-5xl">search_off</span>
            </div>
            <p className="text-slate-900 font-black text-xl tracking-tight">Nenhuma demanda encontrada</p>
            <p className="text-slate-400 text-sm mt-1">Experimente remover alguns filtros da sua busca.</p>
          </div>
        )}

        {/* Pagination Simples */}
        {sortedDemands.length > 0 && (
          <div className="flex justify-center pt-8">
            <button className="px-8 py-3 bg-white border border-slate-200 rounded-xl text-xs font-black uppercase tracking-widest text-slate-600 hover:border-primary transition-all shadow-soft">
              Carregar mais demandas
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default FeedPage;
