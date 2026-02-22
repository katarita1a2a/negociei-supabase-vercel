
import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Offer } from '../types';
import { useDemands } from '../context/DemandsContext';

interface OfferCardProps {
  offer: Offer;
  isBest?: boolean;
  referenceBudget?: number;
  selectionMap?: Record<string, string>;
  onToggleItem?: (itemId: string, offerId: string) => void;
}

const OfferCard: React.FC<OfferCardProps> = ({ offer, isBest, referenceBudget, selectionMap = {}, onToggleItem }) => {
  const { acceptOffer, rejectOffer, orders } = useDemands();
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);
  const [successOrderId, setSuccessOrderId] = useState<string | null>(null);

  // Filtra itens desta oferta que estão selecionados no mapa global
  const selectedItemIds = useMemo(() => {
    return offer.items
      ?.filter(item => selectionMap[item.id] === offer.id)
      .map(item => item.id) || [];
  }, [offer.items, selectionMap, offer.id]);

  const handleAccept = async () => {
    if (selectedItemIds.length === 0) {
      alert("Por favor, selecione pelo menos um item para fechar o pedido.");
      return;
    }

    const confirmMsg = selectedItemIds.length === offer.items?.length
      ? 'Confirmar o fechamento deste negócio com este fornecedor?'
      : `Confirmar o fechamento de ${selectedItemIds.length} itens desta proposta?`;

    if (window.confirm(confirmMsg)) {
      try {
        const orderId = await acceptOffer(offer.id, selectedItemIds);
        if (orderId) {
          setSuccessOrderId(orderId as string);
        }
      } catch (err) {
        console.error('Error accepting offer:', err);
        alert("Erro ao aceitar a proposta. Por favor, tente novamente.");
      }
    }
  };

  const handleReject = async () => {
    if (window.confirm('Deseja realmente rejeitar esta proposta?')) {
      try {
        await rejectOffer(offer.id);
      } catch (err) {
        console.error('Error rejecting offer:', err);
        alert("Erro ao rejeitar a proposta.");
      }
    }
  };

  const purchasedItemIds = useMemo(() => {
    const demandOrders = orders.filter(o => o.demandId === offer.demandId);
    const itemIds = new Set<string>();
    demandOrders.forEach(o => o.items?.forEach(i => itemIds.add(i.id)));
    return itemIds;
  }, [orders, offer.demandId]);

  const selectedTotal = useMemo(() => {
    return offer.items
      ?.filter(i => selectedItemIds.includes(i.id))
      .reduce((acc, curr) => acc + curr.totalPrice, 0) || 0;
  }, [offer.items, selectedItemIds]);

  const savings = referenceBudget ? referenceBudget - offer.value : null;

  return (
    <div className={`
      flex flex-col bg-white rounded-[2.5rem] border-2 transition-all duration-300 overflow-hidden relative group
      ${isBest && offer.status === 'pending' ? 'border-primary shadow-elegant scale-[1.01] z-10' : 'border-slate-100 hover:border-slate-200 shadow-soft'}
      ${offer.status === 'accepted' ? 'border-emerald-500' : ''}
    `}>
      {/* Badge de Destaque */}
      {isBest && offer.status === 'pending' && (
        <div className="absolute top-0 right-0 bg-primary text-white text-[10px] font-black px-5 py-2 rounded-bl-[1.5rem] uppercase tracking-widest shadow-lg">
          MELHOR PREÇO
        </div>
      )}

      <div className="p-8 flex flex-col h-full gap-6">
        {/* Header do Fornecedor */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="size-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-2xl shadow-lg transform group-hover:rotate-3 transition-transform">
              {offer.sellerName[0]}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-black text-slate-900 text-lg leading-tight">{offer.sellerName}</h4>
                {offer.verified && (
                  <span className="material-symbols-outlined text-primary text-sm fill-1" title="Verificado">verified</span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-amber-500 text-[10px] font-black mt-1 uppercase tracking-widest">
                <span className="material-symbols-outlined text-[14px] fill-1">star</span>
                {offer.sellerRating.toFixed(1)}
                <span className="text-slate-400 font-medium ml-1">({offer.sellerReviews} avaliações)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bloco de Preço Principal */}
        <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 space-y-3">
          <div className="flex justify-between items-start">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
              {selectedItemIds.length === offer.items?.length ? 'Total da Proposta' : 'Total dos Itens Selecionados'}
            </p>
            {savings && savings > 0 && selectedItemIds.length === offer.items?.length && (
              <div className="bg-emerald-100 text-emerald-700 text-[9px] font-black px-2 py-0.5 rounded uppercase">
                Economia: R$ {savings.toLocaleString('pt-BR')}
              </div>
            )}
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-4xl md:text-5xl font-black tracking-tighter ${offer.status === 'accepted' ? 'text-emerald-600' : 'text-slate-900'}`}>
              R$ {(selectedItemIds.length === offer.items?.length ? offer.value : selectedTotal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-3 border-t border-slate-200/50 mt-2">
            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-slate-500 tracking-widest">
              <span className="material-symbols-outlined text-[18px] text-primary text-opacity-70">local_shipping</span>
              {offer.shippingCost === 0 ? <span className="text-emerald-600">Frete Grátis</span> : `R$ ${offer.shippingCost.toLocaleString('pt-BR')}`}
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-slate-500 tracking-widest">
              <span className="material-symbols-outlined text-[18px] text-primary text-opacity-70">schedule</span>
              {offer.deadlineDays} dias úteis
            </div>
            {offer.warrantyMonths > 0 && (
              <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-slate-500 tracking-widest">
                <span className="material-symbols-outlined text-[18px] text-primary text-opacity-70">verified_user</span>
                {offer.warrantyMonths} meses de garantia
              </div>
            )}
          </div>

          {(offer.paymentTerms || offer.validUntil) && (
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-3 mt-1 border-t border-slate-200/30">
              {offer.paymentTerms && (
                <div className="flex flex-col gap-0.5">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Pagamento</span>
                  <span className="text-[10px] font-bold text-slate-600 uppercase">{offer.paymentTerms}</span>
                </div>
              )}
              {offer.validUntil && (
                <div className="flex flex-col gap-0.5">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Válida até</span>
                  <span className="text-[10px] font-bold text-slate-600">{new Date(offer.validUntil).toLocaleDateString('pt-BR')}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Resumo da Mensagem */}
        <div className="relative">
          <p className="text-sm text-slate-500 italic leading-relaxed line-clamp-2 px-1">
            "{offer.message || 'Sem mensagem adicional.'}"
          </p>
        </div>

        {/* Itens e Valores Unitários (Sempre visível ou com controle) */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between px-1">
            <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">list_alt</span>
              Comparativo de Itens
            </h5>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-[9px] font-black text-primary uppercase tracking-widest hover:underline flex items-center gap-1"
            >
              {isExpanded ? 'Ocultar' : 'Ver Detalhes'}
              <span className="material-symbols-outlined text-[14px]">{isExpanded ? 'expand_less' : 'expand_more'}</span>
            </button>
          </div>

          <div className="flex flex-col gap-3">
            {offer.items?.slice(0, isExpanded ? 100 : 2).map((item) => {
              const isAlreadyOrdered = purchasedItemIds.has(item.id);
              const selectedByOfferId = selectionMap[item.id];
              const isSelected = selectedByOfferId === offer.id;
              const isSelectedByOther = selectedByOfferId && selectedByOfferId !== offer.id;

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    if (offer.status !== 'pending' || isAlreadyOrdered) return;
                    onToggleItem?.(item.id, offer.id);
                  }}
                  className={`
                  flex items-center justify-between p-3 rounded-xl border transition-all
                  ${offer.status === 'pending' && !isAlreadyOrdered ? 'cursor-pointer' : ''}
                  ${isAlreadyOrdered
                      ? 'bg-slate-100 border-slate-200 opacity-40 grayscale pointer-events-none'
                      : isSelected
                        ? 'bg-primary/5 border-primary/20 shadow-sm'
                        : isSelectedByOther
                          ? 'bg-slate-50 border-slate-100 opacity-60'
                          : 'bg-slate-50/50 border-slate-100/50'
                    }
                  hover:bg-slate-50 transition-colors relative
                `}
                >
                  <div className="flex items-center gap-3">
                    {offer.status === 'pending' && !isAlreadyOrdered && (
                      <div className={`
                      size-5 rounded-md border flex items-center justify-center transition-all
                      ${isSelected ? 'bg-primary border-primary text-white' : 'bg-white border-slate-200'}
                    `}>
                        {isSelected && <span className="material-symbols-outlined text-sm font-black">check</span>}
                      </div>
                    )}
                    <div className="flex flex-col">
                      <span className={`text-[11px] font-bold ${isSelected ? 'text-primary' : 'text-slate-900'} leading-tight`}>
                        {item.description}
                      </span>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                        {item.quantity} {item.unit}
                      </span>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <span className={`text-xs font-black ${isSelected ? 'text-primary' : 'text-slate-900'}`}>
                      R$ {item.unitPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">
                      TOTAL: R$ {item.totalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  {isSelectedByOther && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/40 backdrop-blur-[1px] rounded-xl pointer-events-none">
                      <span className="bg-slate-700 text-white text-[8px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest">
                        Em outro fornecedor
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {!isExpanded && (offer.items?.length || 0) > 2 && (
            <p className="text-[10px] text-center text-slate-400 font-bold uppercase py-1 bg-slate-50/30 rounded-lg">... e mais {offer.items!.length - 2} itens</p>
          )}
        </div>
      </div>

      {/* Rodapé de Ações */}
      <div className="mt-auto pt-4 relative">
        {successOrderId ? (
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex items-center gap-2 text-emerald-700 font-black text-[10px] uppercase tracking-widest">
              <span className="material-symbols-outlined text-lg">check_circle</span>
              Itens aceitos com sucesso!
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setSuccessOrderId(null)}
                className="h-10 rounded-xl bg-white border border-emerald-200 text-emerald-600 font-black text-[9px] uppercase tracking-widest hover:bg-emerald-100/50 transition-all"
              >
                Continuar
              </button>
              <Link
                to={`/demanda/${offer.demandId}/pedido?order=${successOrderId}`}
                className="h-10 rounded-xl bg-emerald-600 text-white font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200"
              >
                Ver Pedido
                <span className="material-symbols-outlined text-sm">description</span>
              </Link>
            </div>
          </div>
        ) : offer.status === 'pending' ? (
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={handleReject}
              className="h-12 rounded-xl border border-slate-200 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:bg-red-50 hover:text-red-500 hover:border-red-100 transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
              Rejeitar
            </button>
            <button
              onClick={handleAccept}
              className="h-12 rounded-xl bg-primary text-white font-black text-[10px] uppercase tracking-widest hover:bg-primary-dark shadow-lg shadow-primary/20 transition-all transform active:scale-95 flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">check</span>
              {selectedItemIds.length === offer.items?.length ? 'Aceitar Proposta' : `Aceitar ${selectedItemIds.length} itens`}
            </button>
          </div>
        ) : offer.status === 'accepted' ? (
          <Link to={`/demanda/${offer.demandId}/pedido`} className="h-14 rounded-xl bg-slate-900 text-white font-black flex items-center justify-center gap-3 uppercase tracking-widest shadow-xl hover:bg-slate-800 transition-all">
            <span className="material-symbols-outlined text-[20px]">description</span> VISUALIZAR PEDIDO
          </Link>
        ) : (
          <div className="h-12 rounded-xl bg-slate-100 text-slate-400 font-black text-[10px] flex items-center justify-center uppercase tracking-widest italic border border-slate-200 gap-2 opacity-60">
            <span className="material-symbols-outlined text-[18px]">cancel</span>
            Proposta Recusada
          </div>
        )}
      </div>
    </div>
  );
};

export default OfferCard;
