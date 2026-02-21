
import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useDemands } from '../context/DemandsContext';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import PremiumBadge from '../components/PremiumBadge';
import { Demand, DemandStatus } from '../types';

const MyDemandsPage: React.FC = () => {
  const { demands, deleteDemand } = useDemands();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Todas' | DemandStatus>('Todas');
  const [dateRange, setDateRange] = useState<'all' | '7d' | '30d' | 'thisMonth' | 'custom'>('all');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'offers'>('recent');
  const [demandToDelete, setDemandToDelete] = useState<Demand | null>(null);

  const { user } = useAuth();

  // Filtra as demandas criadas pelo usuário logado
  const myDemands = useMemo(() => {
    let filtered = demands.filter(d => d.ownerId === user?.id);

    // Filtro de Busca
    if (searchTerm) {
      filtered = filtered.filter(d =>
        d.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro de Status
    if (statusFilter !== 'Todas') {
      filtered = filtered.filter(d => d.status === statusFilter);
    }

    // Filtro de Data
    if (dateRange !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      filtered = filtered.filter(d => {
        const createdDate = new Date(d.createdAt);

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

    // Ordenação
    if (sortBy === 'offers') {
      filtered = [...filtered].sort((a, b) => b.offersCount - a.offersCount);
    } else {
      filtered = [...filtered].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return filtered;
  }, [demands, searchTerm, statusFilter, dateRange, customStart, customEnd, sortBy]);

  const openDeleteModal = (e: React.MouseEvent, demand: Demand) => {
    e.preventDefault();
    e.stopPropagation();
    setDemandToDelete(demand);
  };

  const closeDeleteModal = () => {
    setDemandToDelete(null);
  };

  const confirmDelete = () => {
    if (demandToDelete) {
      deleteDemand(demandToDelete.id);
      setDemandToDelete(null);
    }
  };

  return (
    <Layout showSidebar={false}>
      <div className="max-w-[1200px] mx-auto flex flex-col gap-8 pb-12">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-sm text-slate-500 font-medium">
          <Link to="/" className="hover:text-primary flex items-center gap-1">
            <span className="material-symbols-outlined text-lg">home</span> Início
          </Link>
          <span className="material-symbols-outlined text-sm">chevron_right</span>
          <span className="text-slate-900 font-bold">Minhas Demandas</span>
        </nav>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">Gestão de Demandas</h1>
            <p className="text-slate-500">Acompanhe e gerencie todas as suas solicitações de compra ativas.</p>
          </div>
          <Link
            to="/demanda/nova"
            className="flex items-center gap-2 bg-primary text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all transform active:scale-95"
          >
            <span className="material-symbols-outlined text-[20px]">add_circle</span>
            Nova Demanda
          </Link>
        </div>

        {/* Filtros e Busca */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2 relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
              <input
                type="text"
                placeholder="Buscar por título ou ID..."
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

            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">sort</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full pl-10 h-12 bg-slate-50 border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:ring-primary transition-all cursor-pointer"
              >
                <option value="recent">Mais Recentes</option>
                <option value="offers">Mais Ofertas</option>
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
            {['Todas', DemandStatus.ABERTO, DemandStatus.EM_ANALISE, DemandStatus.FECHADO].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st as any)}
                className={`px-5 py-2 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${statusFilter === st
                  ? 'bg-primary text-white shadow-md shadow-primary/20'
                  : 'text-slate-500 hover:bg-slate-100'
                  }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {myDemands.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {myDemands.map((demand) => (
              <div
                key={demand.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden"
              >
                <div className="p-6 flex flex-col lg:flex-row lg:items-center gap-6">
                  <div className="flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <StatusBadge status={demand.status} />
                      {demand.isPremium && <PremiumBadge />}
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">ID: {demand.id}</span>
                      <span className="text-[10px] text-slate-400 font-medium">Criado em: {new Date(demand.createdAt).toLocaleDateString('pt-BR')}</span>
                    </div>
                    <Link to={`/demanda/${demand.id}`}>
                      <h3 className="text-xl font-black text-slate-900 hover:text-primary transition-colors line-clamp-1">
                        {demand.title}
                      </h3>
                    </Link>
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-500">
                      <span className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[18px] text-slate-400">category</span>
                        {demand.category}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[18px] text-slate-400">location_on</span>
                        {demand.location}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[18px] text-slate-400">calendar_today</span>
                        Prazo: <strong className="text-slate-700">{demand.deadline}</strong>
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-6 lg:border-l lg:border-slate-100 lg:pl-8">
                    <div className="flex flex-col items-center text-center">
                      <p className={`text-3xl font-black ${demand.offersCount > 0 ? 'text-primary' : 'text-slate-300'}`}>{demand.offersCount}</p>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ofertas</p>
                    </div>

                    <div className="flex flex-col gap-2 w-full sm:w-auto min-w-[180px]">
                      <Link
                        to={`/demanda/${demand.id}/ofertas`}
                        className="flex items-center justify-center gap-2 bg-slate-900 text-white font-bold py-3 px-4 rounded-xl hover:bg-slate-800 transition-all text-sm shadow-sm"
                      >
                        <span className="material-symbols-outlined text-[18px]">visibility</span>
                        Ver Ofertas
                      </Link>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => navigate(`/demanda/editar/${demand.id}`)}
                          className="flex items-center justify-center p-2.5 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors"
                          title="Editar Demanda"
                        >
                          <span className="material-symbols-outlined text-[20px]">edit</span>
                        </button>
                        <button
                          onClick={(e) => openDeleteModal(e, demand)}
                          className="flex items-center justify-center p-2.5 border border-slate-200 text-red-500 rounded-xl hover:bg-red-50 transition-all"
                          title="Excluir Demanda"
                        >
                          <span className="material-symbols-outlined text-[20px]">delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Orçamento Ref: <span className="text-slate-600 font-black">{demand.budget || 'A negociar'}</span></span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Progresso</span>
                    <div className="w-24 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div className={`h-full transition-all duration-500 ${demand.status === DemandStatus.ABERTO ? 'w-1/3 bg-primary' : demand.status === DemandStatus.EM_ANALISE ? 'w-2/3 bg-amber-500' : 'w-full bg-primary-green'}`}></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center flex flex-col items-center gap-6 bg-white rounded-3xl border-2 border-dashed border-slate-100 shadow-inner">
            <div className="size-24 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
              <span className="material-symbols-outlined text-6xl">inventory</span>
            </div>
            <div className="max-w-md px-4">
              <p className="text-2xl font-black text-slate-900 mb-2">Nenhuma demanda encontrada</p>
              <p className="text-sm text-slate-500 leading-relaxed mb-8">
                Não existem demandas para os filtros selecionados. Tente expandir sua busca ou período.
              </p>
              <Link to="/demanda/nova" className="inline-flex items-center gap-2 px-10 py-4 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/30 hover:bg-blue-600 transition-all transform active:scale-95">
                <span className="material-symbols-outlined">add_circle</span>
                CRIAR AGORA
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Confirmação de Exclusão */}
      {demandToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={closeDeleteModal}></div>
          <div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 flex flex-col items-center text-center">
              <div className="size-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-5xl">warning</span>
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">Excluir Demanda?</h3>
              <p className="text-slate-500 leading-relaxed mb-8">
                Você está prestes a excluir a demanda <strong className="text-slate-900 font-bold">"{demandToDelete.title}"</strong>. Esta ação é irreversível.
              </p>
              <div className="flex flex-col w-full gap-3">
                <button
                  onClick={confirmDelete}
                  className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-black rounded-2xl shadow-lg shadow-red-200 transition-all transform active:scale-[0.98]"
                >
                  EXCLUIR PERMANENTEMENTE
                </button>
                <button
                  onClick={closeDeleteModal}
                  className="w-full py-4 bg-white border-2 border-slate-100 text-slate-500 font-bold rounded-2xl hover:bg-slate-50 transition-all"
                >
                  CANCELAR
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default MyDemandsPage;
