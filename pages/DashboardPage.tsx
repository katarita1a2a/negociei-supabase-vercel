
import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { useDemands } from '../context/DemandsContext';
import { useAuth } from '../context/AuthContext';
import { DemandStatus } from '../types';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { demands, offers, isLoading } = useDemands();

  // Metrics calculation
  const myDemands = demands.filter(d => d.ownerId === user?.id);
  const myOffers = offers.filter(o => o.sellerId === user?.id);

  const stats = useMemo(() => {
    const totalDemands = myDemands.length;
    const activeDemands = myDemands.filter(d => d.status !== DemandStatus.FECHADO).length;
    const totalOffersSent = myOffers.length;
    const acceptedOffers = myOffers.filter(o => o.status === 'accepted').length;

    // Simulate savings (buyer perspective)
    const estimatedSavings = myDemands
      .filter(d => d.status === DemandStatus.FECHADO)
      .reduce((acc, curr) => acc + 1250, 0); // Mocked fixed saving per closed deal

    return {
      totalDemands,
      activeDemands,
      totalOffersSent,
      acceptedOffers,
      estimatedSavings,
      conversionRate: totalOffersSent > 0 ? (acceptedOffers / totalOffersSent * 100).toFixed(1) : 0
    };
  }, [myDemands, myOffers]);

  if (isLoading) {
    return (
      <Layout showSidebar={false}>
        <div className="flex flex-col items-center justify-center py-24">
          <div className="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-bold mt-4 animate-pulse uppercase tracking-widest text-xs">Carregando painel...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout showSidebar={false}>
      <div className="max-w-[1200px] mx-auto flex flex-col gap-8 pb-10">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Olá, {user?.user_metadata?.full_name || 'Usuário'}!</h1>
            <p className="text-slate-500 mt-1">Bem-vindo à sua central de negociações no Negociei.app</p>
          </div>
          <div className="flex gap-3">
            <Link
              to="/demanda/nova"
              className="flex items-center gap-2 bg-primary text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all transform active:scale-95"
            >
              <span className="material-symbols-outlined text-[20px]">add_circle</span>
              Nova Demanda
            </Link>
          </div>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className="size-12 rounded-xl bg-blue-50 text-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-[28px]">assignment</span>
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Comprador</span>
            </div>
            <p className="text-3xl font-black text-slate-900">{stats.totalDemands}</p>
            <p className="text-sm font-bold text-slate-500">Minhas Demandas</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className="size-12 rounded-xl bg-green-50 text-primary-green flex items-center justify-center">
                <span className="material-symbols-outlined text-[28px]">send</span>
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Vendedor</span>
            </div>
            <p className="text-3xl font-black text-slate-900">{stats.totalOffersSent}</p>
            <p className="text-sm font-bold text-slate-500">Ofertas Enviadas</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className="size-12 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center">
                <span className="material-symbols-outlined text-[28px]">handshake</span>
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Performance</span>
            </div>
            <p className="text-3xl font-black text-slate-900">{stats.conversionRate}%</p>
            <p className="text-sm font-bold text-slate-500">Taxa de Conversão</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className="size-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <span className="material-symbols-outlined text-[28px]">payments</span>
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Resultado</span>
            </div>
            <p className="text-3xl font-black text-emerald-600">R$ {stats.estimatedSavings.toLocaleString('pt-BR')}</p>
            <p className="text-sm font-bold text-slate-500">Economia Gerada</p>
          </div>
        </div>

        {/* Charts & Lists Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Activity Chart (Simulated) */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">insights</span>
                Atividade Semanal
              </h3>
              <select className="text-xs font-bold text-slate-500 bg-slate-50 border-none rounded-lg py-1 px-3 focus:ring-0">
                <option>Últimos 7 dias</option>
                <option>Últimos 30 dias</option>
              </select>
            </div>

            <div className="h-64 flex items-end justify-between gap-4 px-2">
              {[45, 80, 55, 90, 30, 65, 100].map((h, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-3">
                  <div className="w-full relative group">
                    <div
                      className="w-full bg-slate-100 rounded-lg group-hover:bg-primary/20 transition-all duration-500"
                      style={{ height: '200px' }}
                    ></div>
                    <div
                      className="absolute bottom-0 w-full bg-primary rounded-lg shadow-lg shadow-primary/20 transition-all duration-700 ease-out flex items-center justify-center"
                      style={{ height: `${h}%` }}
                    >
                      <span className="text-[10px] font-black text-white opacity-0 group-hover:opacity-100 transition-opacity">{(h / 10).toFixed(0)}</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">
                    {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'][i]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions / Recent Feedback */}
          <div className="flex flex-col gap-6">

            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6">Próximos Passos</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100 cursor-pointer">
                  <div className="size-8 rounded-lg bg-blue-50 text-primary flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-[20px]">verified</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 leading-tight">Completar Perfil</p>
                    <p className="text-xs text-slate-500 mt-1">Aumente sua credibilidade em 40%.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100 cursor-pointer">
                  <div className="size-8 rounded-lg bg-green-50 text-primary-green flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-[20px]">explore</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 leading-tight">Explorar Categorias</p>
                    <p className="text-xs text-slate-500 mt-1">Veja novas demandas no seu setor.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100 cursor-pointer">
                  <div className="size-8 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-[20px]">chat</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 leading-tight">Responder Mensagens</p>
                    <p className="text-xs text-slate-500 mt-1">Você tem 2 novas dúvidas em aberto.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity List */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">history</span>
              Atividade Recente
            </h3>
            <Link to="/ofertas" className="text-sm font-bold text-primary hover:underline">Ver tudo</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="py-4 px-6 text-[10px] font-black uppercase text-slate-400">Ação</th>
                  <th className="py-4 px-6 text-[10px] font-black uppercase text-slate-400">Referência</th>
                  <th className="py-4 px-6 text-[10px] font-black uppercase text-slate-400">Status</th>
                  <th className="py-4 px-6 text-[10px] font-black uppercase text-slate-400 text-right">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {myOffers.slice(0, 5).map((offer, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                          <span className="material-symbols-outlined text-[18px]">send</span>
                        </div>
                        <span className="text-sm font-bold text-slate-900">Oferta Enviada</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-sm text-slate-600 line-clamp-1 max-w-[200px]">Proposta #{offer.id} para Demanda</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${offer.status === 'accepted' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                        {offer.status === 'accepted' ? 'Concluído' : 'Pendente'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <span className="text-sm text-slate-400 font-medium">Há {i + 1} dia(s)</span>
                    </td>
                  </tr>
                ))}
                {!myOffers.length && (
                  <tr>
                    <td colSpan={4} className="py-10 text-center text-slate-400 italic text-sm">Nenhuma atividade recente encontrada.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default DashboardPage;
