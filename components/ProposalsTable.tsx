import React from 'react';
import { Link } from 'react-router-dom';
import { Offer, Order } from '../types';

interface ProposalsTableProps {
    demandItems: any[];
    offers: Offer[];
    orders: Order[];
    selectionMap: Record<string, string>;
    onToggleItem: (itemId: string, offerId: string) => void;
    onAccept: (offerId: string, selectedItemIds: string[]) => void;
    onReject: (offerId: string) => void;
}

const ProposalsTable: React.FC<ProposalsTableProps> = ({
    demandItems,
    offers,
    orders,
    selectionMap,
    onToggleItem,
    onAccept,
    onReject
}) => {
    // Encontrar o menor preço para cada item da demanda entre todas as ofertas
    const bestPrices = demandItems.reduce((acc, item) => {
        const prices = offers.map(o => {
            const offerItem = o.items?.find(oi => oi.description === item.description);
            return offerItem ? offerItem.unitPrice : Infinity;
        });
        acc[item.description] = Math.min(...prices);
        return acc;
    }, {} as Record<string, number>);

    // Total Geral do Investimento (Soma de tudo selecionado em todos os fornecedores)
    const globalInvestment = Object.entries(selectionMap).reduce((acc, [itemId, offerId]) => {
        const offer = offers.find(o => o.id === offerId);
        const demandItem = demandItems.find(di => di.id === itemId);
        const item = offer?.items?.find(i => i.description === demandItem?.description);
        return acc + (item?.totalPrice || 0);
    }, 0);

    return (
        <div className="space-y-6">
            <div className="matrix-container no-scrollbar">
                <table className="matrix-table">
                    <thead>
                        <tr>
                            <th className="matrix-col-item bg-slate-50/80">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Produtos da Demanda</span>
                            </th>
                            {offers.map(offer => (
                                <th key={offer.id} className="matrix-header-supplier">
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2">
                                            <div className="size-6 rounded bg-slate-900 text-white flex items-center justify-center text-[10px] font-black">
                                                {offer.sellerName[0]}
                                            </div>
                                            <span className="text-sm font-black text-slate-900 truncate max-w-[150px]">
                                                {offer.sellerName}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1 text-[9px] font-black text-amber-500 uppercase tracking-tighter">
                                            <span className="material-symbols-outlined text-[12px] fill-1">star</span>
                                            {offer.sellerRating.toFixed(1)}
                                        </div>
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {demandItems.map((demandItem) => (
                            <tr key={demandItem.id} className="matrix-row group">
                                <td className="matrix-col-item">
                                    <div className="flex flex-col">
                                        <span className="text-[11px] font-bold text-slate-900 leading-tight">
                                            {demandItem.description}
                                        </span>
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">
                                            {demandItem.quantity} {demandItem.unit}
                                        </span>
                                    </div>
                                </td>
                                {offers.map(offer => {
                                    const offerItem = offer.items?.find(oi => oi.description === demandItem.description);
                                    const isSelected = selectionMap[demandItem.id] === offer.id;
                                    const isBestPrice = offerItem && offerItem.unitPrice === bestPrices[demandItem.description] && offerItem.unitPrice !== Infinity;
                                    const isAccepted = offer.status === 'accepted';
                                    const isRejected = offer.status === 'rejected';

                                    return (
                                        <td
                                            key={`${offer.id}-${demandItem.id}`}
                                            className={`matrix-cell-price cursor-pointer transition-all ${isSelected ? 'bg-primary/[0.03]' : (isAccepted || isRejected) ? 'opacity-50 pointer-events-none' : 'hover:bg-slate-50'}`}
                                            onClick={() => !isAccepted && !isRejected && onToggleItem(demandItem.id, offer.id)}
                                        >
                                            <div className={`p-3 rounded-xl border-2 transition-all flex items-start gap-3 ${isSelected ? 'border-primary bg-white shadow-md' : 'border-transparent'} ${isBestPrice && !isSelected ? 'bg-emerald-50/30' : ''}`}>
                                                {/* Checkbox customizado */}
                                                <div className={`mt-0.5 size-4 rounded border flex items-center justify-center transition-all shrink-0 ${isSelected ? 'bg-primary border-primary' : 'border-slate-300 bg-white group-hover:border-primary/50'}`}>
                                                    {isSelected && <span className="material-symbols-outlined text-white text-[12px] font-black">check</span>}
                                                </div>

                                                {offerItem ? (
                                                    <div className="flex flex-col min-w-0">
                                                        <span className={`text-xs font-black whitespace-nowrap ${isBestPrice ? 'text-emerald-600' : 'text-slate-900'}`}>
                                                            R$ {offerItem.unitPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                        </span>
                                                        <span className="text-[8px] font-bold text-slate-400 uppercase whitespace-nowrap">
                                                            Total: R$ {offerItem.totalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                        </span>
                                                        {isBestPrice && (
                                                            <span className="text-[7px] font-black text-emerald-500 uppercase tracking-tighter mt-1 flex items-center gap-0.5">
                                                                <span className="material-symbols-outlined text-[10px] fill-1">trending_down</span>
                                                                Melhor Preço
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-[9px] font-black text-slate-300 uppercase italic">Não Ofertado</span>
                                                )}
                                            </div>
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}

                        {/* Linha de Condições Logísticas e Pagamento */}
                        <tr className="bg-slate-50 border-t border-slate-200">
                            <td className="matrix-col-item">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Logística e Pagamento</span>
                                    <span className="text-[8px] font-bold text-slate-400 uppercase">Prazos e Condições</span>
                                </div>
                            </td>
                            {offers.map(offer => (
                                <td key={`logistics-${offer.id}`} className="px-6 py-4">
                                    <div className="flex flex-col gap-2">
                                        {/* Pagamento */}
                                        <div className="flex items-center gap-1.5 text-[9px] font-black uppercase text-primary tracking-widest whitespace-nowrap bg-primary/5 px-2 py-0.5 rounded-md self-start">
                                            <span className="material-symbols-outlined text-[14px]">payments</span>
                                            {offer.paymentTerms || 'Consulte'}
                                        </div>
                                        {/* Frete e Prazo */}
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-1 text-[9px] font-black uppercase text-slate-500 tracking-widest whitespace-nowrap">
                                                <span className="material-symbols-outlined text-[14px] text-primary/70">local_shipping</span>
                                                {offer.shippingCost === 0 ? <span className="text-emerald-600">Grátis</span> : `R$ ${offer.shippingCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                                            </div>
                                            <div className="flex items-center gap-1 text-[9px] font-black uppercase text-slate-500 tracking-widest whitespace-nowrap">
                                                <span className="material-symbols-outlined text-[14px] text-primary/70">schedule</span>
                                                {offer.deadlineDays} {offer.deadlineDays === 1 ? 'dia' : 'dias'}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                            ))}
                        </tr>

                        {/* Linha de Subtotais Selecionados */}
                        <tr className="bg-primary/[0.02] border-t-2 border-primary/10">
                            <td className="matrix-col-item">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-primary">Subtotal Selecionado</span>
                                    <span className="text-[8px] font-bold text-slate-400 uppercase">Itens marcados</span>
                                </div>
                            </td>
                            {offers.map(offer => {
                                const selectedFromThisOffer = demandItems.reduce((sum, item) => {
                                    const isSelectedInMap = selectionMap[item.id] === offer.id;
                                    if (isSelectedInMap) {
                                        const offerItem = offer.items?.find(oi => oi.description === item.description);
                                        return sum + (offerItem?.totalPrice || 0);
                                    }
                                    return sum;
                                }, 0);

                                return (
                                    <td key={`selected-total-${offer.id}`} className="px-6 py-4">
                                        <div className={`flex flex-col ${selectedFromThisOffer > 0 ? 'animate-in fade-in zoom-in duration-300' : 'opacity-30'}`}>
                                            <span className={`text-lg font-black tracking-tight ${selectedFromThisOffer > 0 ? 'text-primary' : 'text-slate-400'}`}>
                                                R$ {selectedFromThisOffer.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </span>
                                            {selectedFromThisOffer > 0 && (
                                                <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">Pronto para aceitar</span>
                                            )}
                                        </div>
                                    </td>
                                );
                            })}
                        </tr>

                        {/* Linha de Totais Completos da Tabela */}
                        <tr className="bg-slate-50/80">
                            <td className="matrix-col-item">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Total da Proposta</span>
                                    <span className="text-[8px] font-bold text-slate-400 uppercase">Valor total + Frete</span>
                                </div>
                            </td>
                            {offers.map(offer => (
                                <td key={`total-${offer.id}`} className="px-6 py-5">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-sm font-black text-slate-900">
                                            R$ {offer.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </span>
                                        <div className="flex items-center gap-2 mt-2">
                                            <div className="flex items-center gap-0.5 text-[8px] font-black text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                                                <span className="material-symbols-outlined text-[12px]">schedule</span>
                                                {offer.deadlineDays}d
                                            </div>
                                            {offer.shippingCost === 0 && (
                                                <div className="text-[8px] font-black text-emerald-600 bg-white px-1.5 py-0.5 rounded border border-emerald-100 uppercase">
                                                    Grátis
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </td>
                            ))}
                        </tr>

                        {/* Linha de Ações (Aceitar/Recusar) */}
                        <tr className="bg-white">
                            <td className="matrix-col-item border-r-0"></td>
                            {offers.map(offer => {
                                const selectedItemIds = demandItems
                                    .filter(item => selectionMap[item.id] === offer.id)
                                    .map(item => {
                                        const offerItem = offer.items?.find(oi => oi.description === item.description);
                                        return offerItem?.id;
                                    })
                                    .filter(Boolean) as string[];

                                const hasExistingOrder = orders.some(o => o.offerId === offer.id);

                                return (
                                    <td key={`actions-${offer.id}`} className="px-6 py-6 border-b border-slate-100">
                                        {hasExistingOrder || offer.status === 'accepted' ? (
                                            <Link
                                                to={(() => {
                                                    const ord = orders.find(o => o.offerId === offer.id);
                                                    return ord ? `/pedido/${ord.id}` : `/minhas-demandas`;
                                                })()}
                                                className="h-10 w-full rounded-lg bg-slate-900 text-white font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg"
                                            >
                                                VER PEDIDO
                                            </Link>
                                        ) : offer.status === 'rejected' ? (
                                            <div className="h-10 w-full rounded-lg bg-slate-50 text-slate-300 font-black text-[9px] uppercase tracking-widest flex items-center justify-center border border-slate-100 italic">
                                                REJEITADA
                                            </div>
                                        ) : (
                                            <div className="flex flex-col gap-2">
                                                <button
                                                    onClick={() => onAccept(offer.id, selectedItemIds)}
                                                    disabled={selectedItemIds.length === 0}
                                                    className={`h-10 w-full rounded-lg font-black text-[9px] uppercase tracking-widest transition-all ${selectedItemIds.length > 0 ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
                                                >
                                                    ACEITAR {selectedItemIds.length > 0 ? `(${selectedItemIds.length} ITENS)` : ''}
                                                </button>
                                                <button
                                                    onClick={() => onReject(offer.id)}
                                                    className="h-9 w-full rounded-lg border border-slate-200 text-slate-400 font-black text-[9px] uppercase tracking-widest hover:bg-red-50 hover:text-red-500 transition-all"
                                                >
                                                    REJEITAR
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                );
                            })}
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Sumário Global de Investimento */}
            <div className="flex justify-end pr-6">
                <div className="bg-slate-900 text-white rounded-[2rem] p-8 shadow-2xl flex flex-col gap-1 border border-slate-800 min-w-[300px] animate-in slide-in-from-right-8 duration-500">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Total Geral do Investimento</span>
                    <span className="text-4xl font-black text-primary-green tracking-tighter">
                        R$ {globalInvestment.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-[9px] font-bold text-slate-500 uppercase mt-2">
                        Soma selecionada de todos os fornecedores
                    </span>
                </div>
            </div>
        </div>
    );
};

export default ProposalsTable;
