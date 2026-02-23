
import React, { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import { useDemands } from '../context/DemandsContext';
import Logo from '../components/Logo';
import { useAuth } from '../context/AuthContext';

const OrderPage: React.FC = () => {
  const { user } = useAuth();
  const { id, orderId } = useParams();
  const { demands, offers, orders, isLoading } = useDemands();

  const { demand, acceptedOffer, orderRecord, specificOffer } = useMemo(() => {
    // Se temos orderId direto na URL
    if (orderId) {
      const ord = orders.find(item => item.id === orderId);
      if (!ord) return { demand: null, acceptedOffer: null, orderRecord: null, specificOffer: null };

      const d = demands.find(item => item.id === ord.demandId);
      const off = offers.find(item => item.id === ord.offerId);
      return { demand: d, acceptedOffer: off, orderRecord: ord, specificOffer: off };
    }

    // Fallback para rota antiga baseada no id da demanda
    const d = demands.find(item => item.id === id);
    const ord = orders.find(item => item.demandId === id && item.status === 'ativo');
    const o = offers.find(item => item.demandId === id && item.status === 'accepted');

    // If no globally accepted offer, look for the offer linked to the active order
    const specOff = ord ? offers.find(off => off.id === ord.offerId) : null;

    return { demand: d, acceptedOffer: o, orderRecord: ord, specificOffer: specOff };
  }, [demands, offers, orders, id, orderId]);

  const handlePrint = () => window.print();

  const currentOffer = specificOffer || acceptedOffer;

  if (isLoading) {
    return (
      <Layout showSidebar={false}>
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
          <div className="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-bold animate-pulse text-xs uppercase tracking-widest">Carregando pedido...</p>
        </div>
      </Layout>
    );
  }

  if (!demand || !currentOffer || !orderRecord) {
    return (
      <Layout showSidebar={false}>
        <div className="py-24 text-center space-y-4">
          <div className="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xl font-black text-slate-900">Processando Pedido...</p>
          <p className="text-slate-500 text-sm">Se esta mensagem persistir, verifique se a oferta foi aceita corretamente.</p>
        </div>
      </Layout>
    );
  }

  // Use real orderNumber if available, fallback to ORD-hash
  const displayOrderNumber = orderRecord?.orderNumber
    ? orderRecord.orderNumber.toString().padStart(4, '0')
    : (id || orderId || '0000').substring(0, 6);

  const displayFullOrderId = `ORD-${displayOrderNumber}`;

  const itemsSubtotal = useMemo(() => {
    const items = orderRecord?.items || currentOffer.items || [];
    return items.reduce((acc, item) => acc + (item.totalPrice || 0), 0);
  }, [orderRecord, currentOffer]);

  const finalOrderPrice = orderRecord?.finalPrice || currentOffer.value;

  return (
    <Layout showSidebar={false}>
      <div className="max-w-[1000px] mx-auto flex flex-col gap-8 pb-20">
        <div className="flex justify-between items-center print:hidden">
          <h1 className="text-3xl font-black text-slate-900">Pedido #{displayFullOrderId}</h1>
          <button onClick={handlePrint} className="flex items-center gap-2 px-8 py-4 bg-slate-900 text-white font-black rounded-2xl shadow-xl hover:bg-slate-800 transition-all">
            <span className="material-symbols-outlined">print</span> IMPRIMIR PEDIDO
          </button>
        </div>

        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl overflow-hidden print:border-none print:shadow-none">
          <div className="p-12 border-b border-slate-100 bg-slate-50/50 flex justify-between items-end">
            <div className="space-y-4">
              <Logo size="md" />
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Referência do Pedido</p>
                <h2 className="text-3xl font-black text-slate-900 tracking-tighter">{displayFullOrderId}</h2>
              </div>
            </div>
            <div className="text-right space-y-2">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</p>
                <h2 className="text-2xl font-black text-primary tracking-tighter uppercase">PEDIDO DE COMPRA</h2>
              </div>
              <p className="text-slate-400 font-bold uppercase text-[9px] tracking-widest">Negociação Confirmada via Negociei.app</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-16 p-12 border-b border-slate-100">
            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">COMPRADOR (EMISSOR)</h4>
              <p className="font-black text-slate-900 text-xl">{demand.ownerCompany || demand.userName || 'Comprador'}</p>
              {demand.ownerCnpj && (
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">CNPJ: {demand.ownerCnpj}</p>
              )}
              <p className="text-slate-500 text-sm font-medium">{demand.location}</p>
            </div>
            <div className="space-y-4 text-right flex flex-col items-end">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">VENDEDOR (DESTINATÁRIO)</h4>
              <p className="font-black text-slate-900 text-xl">{currentOffer.sellerCompany || currentOffer.sellerName}</p>
              {currentOffer.sellerCnpj && (
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">CNPJ: {currentOffer.sellerCnpj}</p>
              )}
              <div className="flex items-center gap-1.5 text-primary text-[10px] font-black bg-blue-50 px-3 py-1 rounded-lg border border-blue-100 uppercase mt-2">
                <span className="material-symbols-outlined text-[14px]">verified</span> PARCEIRO VERIFICADO
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-8 px-12 py-8 bg-slate-50/30 border-b border-slate-100">
            <div className="space-y-1">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Condições de Pagamento</p>
              <p className="font-bold text-slate-700 text-sm whitespace-pre-line">{currentOffer.paymentTerms || 'A combinar'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Prazo de Entrega Estimado</p>
              <p className="font-bold text-slate-700 text-sm">{currentOffer.deadlineDays} dias úteis</p>
            </div>
            <div className="space-y-1 text-right">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Data de Emissão</p>
              <p className="font-bold text-slate-700 text-sm">{new Date(orderRecord.createdAt).toLocaleDateString('pt-BR')} às {new Date(orderRecord.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
          </div>

          <div className="p-12 space-y-8">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b-2 border-slate-100">
                  <th className="py-5 px-6 text-[10px] font-black uppercase text-slate-400 text-left">DESCRIÇÃO DOS ITENS</th>
                  <th className="py-5 px-6 text-[10px] font-black uppercase text-slate-400 text-center">QTD</th>
                  <th className="py-5 px-6 text-[10px] font-black uppercase text-slate-400 text-right">UNITÁRIO</th>
                  <th className="py-5 px-6 text-[10px] font-black uppercase text-slate-400 text-right">TOTAL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(orderRecord?.items || currentOffer.items || []).map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-5 px-6 font-bold text-slate-800 text-sm">{item.description}</td>
                    <td className="py-5 px-6 text-center font-black text-slate-900 text-sm">{item.quantity}</td>
                    <td className="py-5 px-6 text-right text-slate-500 text-sm">R$ {(item.unitPrice || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    <td className="py-5 px-6 text-right font-black text-slate-900 text-sm">R$ {((item.unitPrice || 0) * item.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex flex-col items-end gap-3 pt-8 border-t-2 border-slate-100">
              <div className="flex justify-between w-full md:w-1/3 text-xs font-bold text-slate-400 uppercase">
                <span>SUBTOTAL ITENS:</span>
                <span className="text-slate-900">R$ {itemsSubtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between w-full md:w-1/3 text-xs font-bold text-slate-400 uppercase">
                <span>FRETE / ENTREGA:</span>
                <span className="text-slate-900">R$ {currentOffer.shippingCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center w-full md:w-1/2 mt-6 p-6 bg-slate-900 rounded-3xl text-white shadow-xl shadow-slate-200">
                <span className="text-xs font-black uppercase tracking-widest opacity-60">TOTAL LÍQUIDO DO PEDIDO</span>
                <span className="text-4xl font-black text-primary-green tracking-tighter text-emerald-400">R$ {finalOrderPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 p-12 text-center text-[10px] text-slate-400 font-bold border-t border-slate-100 leading-relaxed">
            Documento eletrônico assinado e validado pela plataforma Negociei.app. <br />
            ID Único da Transação: {currentOffer.id} • Emitido em: {new Date(orderRecord.createdAt).toLocaleDateString('pt-BR')} às {new Date(orderRecord.createdAt).toLocaleTimeString('pt-BR')}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default OrderPage;
