
import React from 'react';
import { Link } from 'react-router-dom';
import { Demand } from '../types';
import StatusBadge from './StatusBadge';
import PremiumBadge from './PremiumBadge';
import { useDemands } from '../context/DemandsContext';
import { useAuth } from '../context/AuthContext';

interface DemandCardProps {
  demand: Demand;
}

const DemandCard: React.FC<DemandCardProps> = ({ demand }) => {
  const { user } = useAuth();
  const { offers } = useDemands();
  const userHasOffer = offers.some(o => o.demandId === demand.id && o.sellerId === user?.id);
  const hasImage = demand.images && demand.images.length > 0;

  return (
    <article className={`
      group flex flex-col bg-white rounded-[1.5rem] border-2 transition-all duration-500 overflow-hidden relative
      ${demand.isPremium
        ? 'border-amber-400 shadow-xl shadow-amber-500/10 hover:border-amber-500'
        : 'border-slate-100 shadow-soft hover:shadow-elegant hover:border-primary/40'}
    `}>
      {/* Indicador Lateral Premium */}
      {demand.isPremium && (
        <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-amber-400 to-orange-500 z-20"></div>
      )}

      <div className="p-5 flex flex-col h-full relative z-10">
        {/* Topo: Tags e Status */}
        <div className="flex items-start justify-between mb-4 gap-2">
          <div className="flex flex-wrap gap-1.5">
            <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border transition-colors ${demand.isPremium
              ? 'bg-amber-50 text-amber-700 border-amber-100 group-hover:bg-amber-100'
              : 'bg-slate-50 text-slate-500 border-slate-100 group-hover:bg-slate-100'
              }`}>
              {demand.category}
            </span>
            {demand.isPremium && <PremiumBadge />}
          </div>
          <div className="flex items-start gap-2">
            <button
              onClick={(e) => {
                e.preventDefault();
                const url = `${window.location.origin}/demanda/${demand.id}`;
                navigator.clipboard.writeText(url);
                alert("Link da demanda copiado!");
              }}
              className="size-8 rounded-lg bg-slate-50 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 transition-all flex items-center justify-center border border-slate-100"
              title="Copiar Link"
            >
              <span className="material-symbols-outlined text-[18px]">content_copy</span>
            </button>
            <StatusBadge status={demand.status} className="scale-90 origin-right" />
          </div>
        </div>

        {/* Corpo: Título e Imagem (Layout Flex) */}
        <div className="flex gap-4 mb-4 items-start">
          <div className="flex-1 min-w-0">
            <p className="text-[9px] text-slate-400 font-black mb-0.5 uppercase tracking-[0.15em]">ID: #{demand.id}</p>
            <Link to={`/demanda/${demand.id}`} className="block">
              <h3 className="text-lg font-black text-slate-900 line-clamp-2 leading-tight group-hover:text-primary transition-colors h-[2.5rem] tracking-tight">
                {demand.title}
              </h3>
            </Link>
          </div>

          {/* Miniatura da Imagem */}
          {hasImage && (
            <div className="size-16 rounded-xl overflow-hidden border border-slate-100 flex-shrink-0 shadow-sm transform group-hover:scale-105 transition-transform">
              <img
                src={demand.images![0]}
                alt={demand.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>

        {/* Info Grid (Compacta) */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="flex items-center gap-2">
            <div className="size-7 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0 text-slate-400 group-hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-[16px]">location_on</span>
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5">Local</span>
              <span className="text-[11px] font-bold text-slate-700 truncate">{demand.location}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="size-7 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0 text-slate-400 group-hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-[16px]">calendar_today</span>
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5">Prazo</span>
              <span className="text-[11px] font-bold text-slate-700 truncate">{demand.deadline}</span>
            </div>
          </div>
        </div>

        {/* Rodapé: Orçamento e Ofertas */}
        <div className="mt-auto pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex flex-col">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Orçamento Estimado</span>
              <span className={`text-xl font-black tracking-tighter ${demand.isPremium ? 'text-amber-600' : 'text-slate-900'}`}>
                {demand.budget}
              </span>
            </div>

            <div className={`flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-lg border ${demand.offersCount > 0
              ? 'bg-emerald-50 border-emerald-100 text-emerald-600 shadow-sm'
              : 'bg-slate-50 border-slate-100 text-slate-400'
              }`}>
              <span className="text-xs font-black leading-none">{demand.offersCount}</span>
              <span className="text-[7px] font-black uppercase tracking-tighter">Ofertas</span>
            </div>
          </div>

          {userHasOffer ? (
            <div className="w-full h-11 flex items-center justify-center gap-2 rounded-xl bg-slate-50 text-slate-400 border border-slate-100 text-[10px] font-black uppercase tracking-widest cursor-default">
              <span className="material-symbols-outlined text-[16px] fill-1">check_circle</span>
              Proposta Enviada
            </div>
          ) : (
            <Link
              to={`/demanda/${demand.id}`}
              className={`
                w-full h-11 flex items-center justify-center gap-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all transform active:scale-95 shadow-lg
                ${demand.isPremium
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 shadow-amber-500/20'
                  : 'bg-primary text-white hover:bg-primary-dark shadow-primary/20'}
              `}
            >
              Quero Negociar
              <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">handshake</span>
            </Link>
          )}
        </div>
      </div>

      {/* Barra de Progresso Estética Inferior */}
      <div className={`absolute bottom-0 left-0 h-1 transition-all duration-500 rounded-full ${demand.isPremium ? 'w-full bg-orange-400 opacity-50' : 'w-0 group-hover:w-full bg-primary opacity-30'
        }`}></div>
    </article>
  );
};

export default DemandCard;
