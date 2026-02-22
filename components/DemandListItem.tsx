
import React from 'react';
import { Link } from 'react-router-dom';
import { Demand } from '../types';
import StatusBadge from './StatusBadge';
import PremiumBadge from './PremiumBadge';
import { useDemands } from '../context/DemandsContext';
import { useAuth } from '../context/AuthContext';

interface DemandListItemProps {
  demand: Demand;
}

const DemandListItem: React.FC<DemandListItemProps> = ({ demand }) => {
  const { user } = useAuth();
  const { offers } = useDemands();
  const userHasOffer = offers.some(o => o.demandId === demand.id && o.sellerId === user?.id);
  const hasImage = demand.images && demand.images.length > 0;

  return (
    <article className={`
      group flex flex-col md:flex-row items-center bg-white rounded-2xl border-2 transition-all duration-300 overflow-hidden relative p-4 gap-6
      ${demand.isPremium
        ? 'border-amber-400 shadow-lg shadow-amber-500/5 hover:border-amber-500'
        : 'border-slate-100 hover:border-primary/40 shadow-sm'}
    `}>
      {/* Imagem (Esquerda) */}
      <div className="relative flex-shrink-0">
        <div className="size-20 md:size-24 rounded-xl overflow-hidden border border-slate-100 shadow-inner bg-slate-50">
          {hasImage ? (
            <img src={demand.images![0]} alt={demand.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-200">
              <span className="material-symbols-outlined text-4xl">image_not_supported</span>
            </div>
          )}
        </div>
        {demand.isPremium && (
          <div className="absolute -top-2 -left-2 scale-75 origin-top-left">
            <PremiumBadge />
          </div>
        )}
      </div>

      {/* Info Principal (Centro) */}
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center gap-2">
          <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">#{demand.id}</p>
          <button
            onClick={(e) => {
              e.preventDefault();
              const url = `${window.location.origin}/demanda/${demand.id}`;
              navigator.clipboard.writeText(url);
              alert("Link da demanda copiado!");
            }}
            className="size-6 rounded-md bg-slate-50 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 transition-all flex items-center justify-center border border-slate-100"
            title="Copiar Link"
          >
            <span className="material-symbols-outlined text-[14px]">content_copy</span>
          </button>
          <StatusBadge status={demand.status} className="scale-75 origin-left" />
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-0.5 rounded">{demand.category}</span>
        </div>
        <Link to={`/demanda/${demand.id}`}>
          <h3 className="text-base md:text-lg font-black text-slate-900 truncate group-hover:text-primary transition-colors tracking-tight">
            {demand.title}
          </h3>
        </Link>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <div className="flex items-center gap-1.5 text-slate-500">
            <span className="material-symbols-outlined text-[16px]">location_on</span>
            <span className="text-xs font-bold">{demand.location}</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-500">
            <span className="material-symbols-outlined text-[16px]">calendar_today</span>
            <span className="text-xs font-bold">Prazo: {demand.deadline}</span>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-600">
            <span className="material-symbols-outlined text-[16px]">local_offer</span>
            <span className="text-xs font-black uppercase">{demand.offersCount} Ofertas</span>
          </div>
        </div>
      </div>

      {/* Preço e Ação (Direita) */}
      <div className="flex flex-col items-center md:items-end gap-3 min-w-[180px] border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
        <div className="text-center md:text-right">
          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Orçamento Estimado</p>
          <p className={`text-xl font-black tracking-tighter ${demand.isPremium ? 'text-amber-600' : 'text-slate-900'}`}>
            {demand.budget}
          </p>
        </div>

        {userHasOffer ? (
          <div className="w-full h-10 flex items-center justify-center gap-2 rounded-xl bg-slate-50 text-slate-400 border border-slate-100 text-[9px] font-black uppercase tracking-widest cursor-default">
            <span className="material-symbols-outlined text-[16px] fill-1">check_circle</span>
            Proposta Enviada
          </div>
        ) : (
          <Link
            to={`/demanda/${demand.id}`}
            className={`
              w-full h-10 px-6 flex items-center justify-center gap-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all transform active:scale-95 shadow-md
              ${demand.isPremium
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-amber-500/10'
                : 'bg-primary text-white shadow-primary/10'}
            `}
          >
            NEGOCIAR
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </Link>
        )}
      </div>
    </article>
  );
};

export default DemandListItem;
