
import React, { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import { useDemands } from '../context/DemandsContext';
import Logo from '../components/Logo';
import { useAuth } from '../context/AuthContext';

const OrderPage: React.FC = () => {
  const { user } = useAuth();
  const { id } = useParams();
  const { demands, offers, orders } = useDemands();

  const { demand, acceptedOffer, orderRecord } = useMemo(() => {
    const d = demands.find(item => item.id === id);
    const o = offers.find(item => item.demandId === id && item.status === 'accepted');
    const ord = orders.find(item => item.demandId === id && item.status === 'ativo');
    return { demand: d, acceptedOffer: o, orderRecord: ord };
  }, [demands, offers, orders, id]);

  const handlePrint = () => window.print();

  if (!demand || !acceptedOffer) return <Layout showSidebar={false}><div className="py-20 text-center">Processando Pedido...</div></Layout>;

  // Use real orderNumber if available, fallback to ORD-hash
  const displayOrderNumber = orderRecord?.orderNumber
    ? orderRecord.orderNumber.toString().padStart(4, '0')
    : acceptedOffer.id.substring(acceptedOffer.id.length - 6);

  const orderId = `ORD-${displayOrderNumber}`;
  const itemsSubtotal = (acceptedOffer.items || []).reduce((acc, item) => acc + ((item.unitPrice || 0) * item.quantity), 0);

  return (
    <Layout showSidebar={false}>
      <div className="max-w-[1000px] mx-auto flex flex-col gap-8 pb-20">
        <div className="flex justify-between items-center print:hidden">
          <h1 className="text-3xl font-black text-slate-900">Pedido #{orderId}</h1>
          <button onClick={handlePrint} className="flex items-center gap-2 px-8 py-4 bg-slate-900 text-white font-black rounded-2xl shadow-xl hover:bg-slate-800 transition-all">
            <span className="material-symbols-outlined">print</span> IMPRIMIR PEDIDO
          </button>
        </div>

        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl overflow-hidden print:border-none print:shadow-none">
          <div className="p-12 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <Logo size="md" />
            <div className="text-right">
              <h2 className="text-2xl font-black text-slate-900 tracking-tighter">PEDIDO DE COMPRA</h2>
              <p className="text-primary font-black uppercase text-[10px] tracking-[0.2em] mt-1">Negociação Confirmada</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-16 p-12">
            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">COMPRADOR (EMISSOR)</h4>
              <p className="font-black text-slate-900 text-xl">{user?.user_metadata?.company || user?.user_metadata?.full_name || 'Empresa Compradora'}</p>
              <p className="text-slate-500 text-sm font-medium">{demand.location}</p>
            </div>
            <div className="space-y-4 text-right flex flex-col items-end">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">VENDEDOR (DESTINATÁRIO)</h4>
              <p className="font-black text-slate-900 text-xl">{acceptedOffer.sellerName}</p>
              <div className="flex items-center gap-1.5 text-primary text-[10px] font-black bg-blue-50 px-3 py-1 rounded-lg border border-blue-100 uppercase">
                <span className="material-symbols-outlined text-[14px]">verified</span> PARCEIRO VERIFICADO
              </div>
            </div>
          </div>

          <div className="p-12 space-y-8">
            <table className="w-full border-collapse">
              <thead><tr className="bg-slate-50 border-b-2 border-slate-100"><th className="py-5 px-6 text-[10px] font-black uppercase text-slate-400 text-left">DESCRIÇÃO DOS ITENS</th><th className="py-5 px-6 text-[10px] font-black uppercase text-slate-400 text-center">QTD</th><th className="py-5 px-6 text-[10px] font-black uppercase text-slate-400 text-right">UNITÁRIO</th><th className="py-5 px-6 text-[10px] font-black uppercase text-slate-400 text-right">TOTAL</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {acceptedOffer.items?.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors"><td className="py-5 px-6 font-bold text-slate-800 text-sm">{item.description}</td><td className="py-5 px-6 text-center font-black text-slate-900 text-sm">{item.quantity}</td><td className="py-5 px-6 text-right text-slate-500 text-sm">R$ {(item.unitPrice || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td><td className="py-5 px-6 text-right font-black text-slate-900 text-sm">R$ {((item.unitPrice || 0) * item.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td></tr>
                ))}
              </tbody>
            </table>

            <div className="flex flex-col items-end gap-3 pt-8 border-t-2 border-slate-100">
              <div className="flex justify-between w-full md:w-1/3 text-xs font-bold text-slate-400 uppercase"><span>SUBTOTAL ITENS:</span><span className="text-slate-900">R$ {itemsSubtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></div>
              <div className="flex justify-between w-full md:w-1/3 text-xs font-bold text-slate-400 uppercase"><span>FRETE / ENTREGA:</span><span className="text-slate-900">R$ {acceptedOffer.shippingCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></div>
              <div className="flex justify-between items-center w-full md:w-1/2 mt-6 p-6 bg-slate-900 rounded-3xl text-white shadow-xl shadow-slate-200">
                <span className="text-xs font-black uppercase tracking-widest opacity-60">TOTAL LÍQUIDO DO PEDIDO</span>
                <span className="text-4xl font-black text-primary-green tracking-tighter">R$ {acceptedOffer.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 p-12 text-center text-[10px] text-slate-400 font-bold border-t border-slate-100 leading-relaxed">
            Documento eletrônico assinado e validado pela plataforma Negociei.app. <br />
            ID Único da Transação: {acceptedOffer.id} • Data: {new Date().toLocaleDateString('pt-BR')}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default OrderPage;
