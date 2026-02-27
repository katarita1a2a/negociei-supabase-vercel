
import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Offer } from '../types';
import { useDemands } from '../context/DemandsContext';

interface OfferCardProps {
  offer: Offer;
  isBest?: boolean;
  referenceBudget?: number;
  demandItems?: any[];
  selectionMap?: Record<string, string>;
  onToggleItem?: (itemId: string, offerId: string) => void;
}

const OfferCard: React.FC<OfferCardProps> = ({ offer, isBest, referenceBudget, demandItems = [], selectionMap = {}, onToggleItem }) => {
  const { acceptOffer, rejectOffer, orders } = useDemands();
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);
  const [successOrderId, setSuccessOrderId] = useState<string | null>(null);

  // Mapeamento extra para facilitar busca de DemandItemID por descrição
  const demandItemByDescription = useMemo(() => {
    const map: Record<string, string> = {};
    demandItems.forEach(di => {
      map[di.description.trim().toLowerCase()] = di.id;
    });
    return map;
  }, [demandItems]);

  // Verifica se esta oferta específica já possui algum item em algum pedido
  const hasExistingOrder = useMemo(() => {
    return orders.some(ord => ord.offerId === offer.id);
  }, [orders, offer.id]);

  // IDs desta oferta (OFFER_ITEM_ID) que estão selecionados NO MAPA GLOBAL (que usa DEMAND_ITEM_ID)
  const selectedOfferItemIds = useMemo(() => {
    return offer.items
      ?.filter(item => {
        const dId = demandItemByDescription[item.description.trim().toLowerCase()];
        return dId && selectionMap[dId] === offer.id;
      })
      .map(item => item.id) || [];
  }, [offer.items, selectionMap, offer.id, demandItemByDescription]);

  const handleAccept = async () => {
    if (selectedOfferItemIds.length === 0) {
      alert("Por favor, selecione pelo menos um item para fechar o pedido.");
      return;
    }

    const confirmMsg = selectedOfferItemIds.length === offer.items?.length
      ? 'Confirmar o fechamento deste negócio com este fornecedor?'
      : `Confirmar o fechamento de ${selectedOfferItemIds.length} itens desta proposta?`;

    if (window.confirm(confirmMsg)) {
      try {
        const orderId = await acceptOffer(offer.id, selectedOfferItemIds);
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
    if (hasExistingOrder) {
      alert("Não é possível rejeitar uma proposta que já possui itens comprados.");
      return;
    }
    if (window.confirm('Deseja realmente rejeitar esta proposta?')) {
      try {
        await rejectOffer(offer.id);
      } catch (err) {
        console.error('Error rejecting offer:', err);
        alert("Erro ao rejeitar a proposta.");
      }
    }
  };

  const handleViewPdf = () => {
    if (!offer.pdfUrl) return;

    try {
      // Se for um link direto (http/https), abre direto
      if (offer.pdfUrl.startsWith('http')) {
        window.open(offer.pdfUrl, '_blank');
        return;
      }

      // Se for base64 (data:application/pdf;base64,...), precisamos converter para Blob
      // para evitar bloqueios de segurança do navegador em links base64 gigantes
      const base64Data = offer.pdfUrl.split(',')[1];
      if (!base64Data) {
        window.open(offer.pdfUrl, '_blank');
        return;
      }

      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      const blobUrl = URL.createObjectURL(blob);

      window.open(blobUrl, '_blank');

      // Limpeza opcional após um tempo
      setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
    } catch (err) {
      console.error('Error opening PDF:', err);
      // Fallback
      window.open(offer.pdfUrl, '_blank');
    }
  };

  // Conjunto de IDs de itens já comprados (usado para desabilitar itens nesta oferta)
  const purchasedItemIds = useMemo(() => {
    const demandOrders = orders.filter(o => o.demandId === offer.demandId);
    const itemIds = new Set<string>();
    demandOrders.forEach(o => o.items?.forEach(i => itemIds.add(i.id)));
    return itemIds;
  }, [orders, offer.demandId]);

  // Conjunto de Descrições de itens já comprados em QUALQUER fornecedor
  const purchasedItemDescriptions = useMemo(() => {
    const demandOrders = orders.filter(o => o.demandId === offer.demandId);
    const itemNames = new Set<string>();
    demandOrders.forEach(o => o.items?.forEach(i => itemNames.add(i.description.trim().toLowerCase())));
    return itemNames;
  }, [orders, offer.demandId]);

  const selectedTotal = useMemo(() => {
    const itemsTotal = offer.items
      ?.filter(i => selectedOfferItemIds.includes(i.id))
      .reduce((acc, curr) => acc + curr.totalPrice, 0) || 0;

    return itemsTotal > 0 ? itemsTotal + offer.shippingCost : 0;
  }, [offer.items, selectedOfferItemIds, offer.shippingCost]);

  const savings = referenceBudget ? referenceBudget - offer.value : null;

  return (
    <div className={`
      OfferCard flex flex-col bg-white rounded-[2.5rem] border-2 transition-all duration-300 overflow-hidden relative group
      ${isBest && offer.status === 'pending' ? 'border-primary shadow-elegant z-10' : 'border-slate-100 hover:border-slate-200 shadow-soft'}
      ${offer.status === 'accepted' ? 'border-emerald-500' : ''}
    `}>
      {/* Badge de Destaque */}
      {isBest && offer.status === 'pending' && (
        <div className="absolute top-0 right-0 bg-primary text-white text-[10px] font-black px-5 py-2 rounded-bl-[1.5rem] uppercase tracking-widest shadow-lg">
          MELHOR PREÇO
        </div>
      )}

      <div className="p-5 flex flex-col h-full gap-4">
        {/* Header do Fornecedor */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="size-9 rounded-lg bg-slate-900 text-white flex items-center justify-center font-black text-lg shadow-lg transition-transform group-hover:scale-105">
              {offer.sellerName[0]}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-black text-slate-900 text-lg leading-tight">{offer.sellerName}</h4>
                {offer.verified && (
                  <span className="material-symbols-outlined text-primary text-sm fill-1" title="Verificado">verified</span>
                )}
              </div>

              {/* Dados da Empresa e CNPJ */}
              {(offer.sellerCompany || offer.sellerCnpj) && (
                <div className="flex flex-col mt-0.5">
                  {offer.sellerCompany && <p className="text-[10px] font-bold text-slate-500">{offer.sellerCompany}</p>}
                  {offer.sellerCnpj && <p className="text-[9px] font-medium text-slate-400">CNPJ: {offer.sellerCnpj}</p>}
                </div>
              )}

              <div className="flex items-center gap-1.5 text-amber-500 text-[10px] font-black mt-1 uppercase tracking-widest">
                <span className="material-symbols-outlined text-[14px] fill-1">star</span>
                {offer.sellerRating.toFixed(1)}
                <span className="text-slate-400 font-medium ml-1">({offer.sellerReviews} avaliações)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bloco de Preço Principal - Stacked Rows para não cortar números grandes */}
        <div className="bg-slate-50 p-4 rounded-[1.2rem] border border-slate-100 space-y-3">
          <div className="flex flex-col gap-3">
            {/* Valor Selecionado */}
            <div className="flex items-center justify-between gap-4 border-b border-slate-200/50 pb-2">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-tight shrink-0">Itens marcados</p>
              <span className={`text-xl font-black tracking-tighter leading-tight text-right ${offer.status === 'accepted' ? 'text-emerald-600' : 'text-slate-900'}`}>
                R$ {selectedTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>

            {/* Valor Total da Oferta */}
            <div className="flex items-center justify-between gap-4">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-tight shrink-0">Total Proposta</span>
              <span className="text-sm font-black text-slate-700 leading-tight text-right">
                R$ {offer.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <div className="h-px bg-slate-200/50"></div>

          <div className="flex flex-wrap items-center justify-between gap-y-2 pt-0.5">
            <div className="flex items-center gap-1 text-[9px] font-black uppercase text-slate-500 tracking-widest whitespace-nowrap shrink-0">
              <span className="material-symbols-outlined text-[16px] text-primary/70 shrink-0">local_shipping</span>
              {offer.shippingCost === 0 ? <span className="text-emerald-600">Grátis</span> : `R$ ${offer.shippingCost}`}
            </div>
            <div className="flex items-center gap-1 text-[9px] font-black uppercase text-slate-500 tracking-widest whitespace-nowrap shrink-0">
              <span className="material-symbols-outlined text-[16px] text-primary/70 shrink-0">schedule</span>
              {offer.deadlineDays} {offer.deadlineDays === 1 ? 'dia' : 'dias'}
            </div>
            {offer.paymentTerms && (
              <div className="flex items-center gap-1 text-[9px] font-black uppercase text-primary tracking-widest whitespace-nowrap shrink-0 bg-primary/5 px-2 py-0.5 rounded-md">
                <span className="material-symbols-outlined text-[14px] shrink-0">payments</span>
                {offer.paymentTerms.split(' ')[0]}
              </div>
            )}
          </div>
        </div>

        {/* Resumo da Mensagem */}
        <div className="relative">
          <p className="text-[11px] text-slate-500 italic leading-tight line-clamp-1 px-1">
            "{offer.message || 'Sem mensagem adicional.'}"
          </p>
        </div>

        {/* Itens e Valores Unitários */}
        <div className="space-y-3 pt-3 border-t border-slate-100">
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

          <div className={`flex flex-col gap-3 ${isExpanded ? '' : 'print:flex'}`}>
            {offer.items?.map((item, idx) => {
              // Only slice if not printing
              if (!isExpanded && idx >= 2) {
                return (
                  <div key={item.id} className="hidden print:flex items-center justify-between p-3 rounded-xl border border-slate-50/50 bg-slate-50/50">
                    <div className="flex flex-col">
                      <span className="text-[11px] font-bold text-slate-900 leading-tight">{item.description}</span>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{item.quantity} {item.unit}</span>
                    </div>
                    <div className="text-right flex flex-col items-end">
                      <span className="text-xs font-black text-slate-900">R$ {item.unitPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">TOTAL: R$ {item.totalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                );
              }
              const isAlreadyOrdered = purchasedItemIds.has(item.id) || purchasedItemDescriptions.has(item.description.trim().toLowerCase());
              const dId = demandItemByDescription[item.description.trim().toLowerCase()];
              const selectedByOfferId = dId ? selectionMap[dId] : undefined;
              const isSelected = selectedByOfferId === offer.id;
              const isSelectedByOther = selectedByOfferId && selectedByOfferId !== offer.id;

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    if (offer.status !== 'pending' || isAlreadyOrdered || !dId) return;
                    onToggleItem?.(dId, offer.id);
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
                  hover:bg-slate-50 relative
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

      {/* Ações e Status */}
      <div className="p-5 pt-0">
        {successOrderId ? (
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex flex-col gap-3">
            <div className="flex items-center gap-2 text-emerald-700 font-black text-[10px] uppercase tracking-widest">
              <span className="material-symbols-outlined text-base">check_circle</span> Itens aceitos!
            </div>
            <Link to={`/pedido/${successOrderId}`} className="h-11 rounded-lg bg-emerald-600 text-white font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-sm">
              VER PEDIDO
            </Link>
          </div>
        ) : (offer.status === 'accepted' || hasExistingOrder) ? (
          <div className="flex flex-col gap-3">
            <Link to={(() => {
              const ord = orders.find(o => o.offerId === offer.id);
              return ord ? `/pedido/${ord.id}` : `/demanda/${offer.demandId}/pedido`;
            })()}
              className="h-14 px-6 rounded-xl bg-slate-900 text-white font-black flex items-center justify-center gap-3 text-[11px] uppercase tracking-widest shadow-lg"
            >
              VER PEDIDO
            </Link>
            {offer.pdfUrl && (
              <button onClick={handleViewPdf} className="text-[10px] font-black text-primary uppercase hover:underline flex items-center justify-center gap-1">
                <span className="material-symbols-outlined text-sm">picture_as_pdf</span> PDF ANEXO
              </button>
            )}
          </div>
        ) : offer.status === 'rejected' ? (
          <div className="h-14 px-6 rounded-xl bg-slate-50 text-slate-300 font-black text-[11px] flex items-center justify-center uppercase tracking-widest italic border border-slate-100 gap-2">
            REJEITADA
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-2">
              <button onClick={handleReject} className="h-10 rounded-lg border border-slate-200 text-slate-400 font-black text-[9px] uppercase tracking-widest hover:bg-red-50 hover:text-red-500 transition-all">
                REJEITAR
              </button>
              <button onClick={handleAccept} className="h-10 rounded-lg bg-primary text-white font-black text-[9px] uppercase tracking-widest shadow-lg shadow-primary/20">
                ACEITAR
              </button>
            </div>
            {offer.pdfUrl && (
              <button onClick={handleViewPdf} className="text-[10px] font-black text-primary uppercase hover:underline flex items-center justify-center gap-1">
                <span className="material-symbols-outlined text-sm">picture_as_pdf</span> VER PDF DA PROPOSTA
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default OfferCard;
