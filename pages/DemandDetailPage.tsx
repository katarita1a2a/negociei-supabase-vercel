
import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { useDemands } from '../context/DemandsContext';
import { useAuth } from '../context/AuthContext';
import { DemandStatus, UserRole, Offer } from '../types';
import StatusBadge from '../components/StatusBadge';
import PremiumBadge from '../components/PremiumBadge';

const DemandDetailPage: React.FC = () => {
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const { demands, addOffer, offers, isLoading } = useDemands();

  const demand = demands.find(d => d.id?.toString() === id);
  const [offerMessage, setOfferMessage] = useState('');
  const [shippingCost, setShippingCost] = useState<number>(0);
  const [deadlineDays, setDeadlineDays] = useState<number>(5);
  const [warrantyMonths, setWarrantyMonths] = useState<number>(0);
  const [paymentTerms, setPaymentTerms] = useState<string>('À vista');
  const [validUntil, setValidUntil] = useState<string>(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [itemPrices, setItemPrices] = useState<Record<string, number>>({});
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pdfBase64, setPdfBase64] = useState<string | null>(null);
  const [pdfName, setPdfName] = useState<string | null>(null);
  const pdfInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (demand?.items) {
      const initialPrices: Record<string, number> = {};
      demand.items.forEach(item => initialPrices[item.id] = item.unitPrice || 0);
      setItemPrices(initialPrices);
      setShippingCost(demand.shippingCost || 0);
    }
    if (demand?.images && demand.images.length > 0) {
      setActiveImage(demand.images[0]);
    }
  }, [demand]);

  const offerTotal = useMemo(() => {
    if (!demand) return 0;
    const itemsSum = (demand.items || []).reduce((acc, item) => {
      const price = itemPrices[item.id] || 0;
      return acc + (price * item.quantity);
    }, 0);
    return itemsSum + shippingCost;
  }, [demand, itemPrices, shippingCost]);

  if (isLoading) {
    return (
      <Layout showSidebar={false}>
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
          <div className="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-bold animate-pulse text-xs uppercase tracking-widest">Carregando detalhes...</p>
        </div>
      </Layout>
    );
  }

  if (!demand) return <Layout showSidebar={false}><div className="py-20 text-center font-bold text-slate-900 text-xl">Demanda não encontrada</div></Layout>;

  const isOwner = demand.ownerId === user?.id;
  const isSeller = user?.user_metadata?.role === UserRole.SELLER || user?.user_metadata?.role === UserRole.BOTH;
  const alreadyHasOffer = offers.some(o => o.demandId === demand.id && o.sellerId === user?.id);

  const handleSendOffer = async () => {
    const newOffer: Offer = {
      id: `OFF-${Date.now()}`,
      demandId: demand.id,
      sellerId: user?.id || 'anonymous',
      sellerName: user?.user_metadata?.company || user?.user_metadata?.full_name || 'Fornecedor',
      sellerRating: 5.0,
      sellerReviews: 0,
      value: offerTotal,
      shippingCost,
      deadlineDays,
      warrantyMonths,
      paymentTerms,
      validUntil,
      message: offerMessage,
      verified: !!user?.user_metadata?.verified,
      status: 'pending',
      createdAt: new Date().toISOString(),
      items: demand.items?.map(i => ({ ...i, unitPrice: itemPrices[i.id], totalPrice: itemPrices[i.id] * i.quantity }))
    };

    setIsSubmitting(true);
    try {
      await addOffer({
        ...newOffer,
        pdfUrl: pdfBase64 || undefined
      });
      navigate('/ofertas');
    } catch (err) {
      console.error('Error sending offer:', err);
      alert("Erro ao enviar a proposta. Por favor, tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout showSidebar={false}>
      <div className="max-w-[1100px] mx-auto flex flex-col gap-6 pb-20">

        {/* Navigation Top */}
        <nav className="flex items-center justify-between py-2">
          <Link to="/" className="flex items-center gap-2 text-slate-500 hover:text-primary font-bold text-xs uppercase tracking-widest transition-colors group">
            <span className="material-symbols-outlined text-lg group-hover:-translate-x-1 transition-transform">arrow_back</span>
            Feed de Demandas
          </Link>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                const url = `${window.location.origin}/#/demanda/${demand.id}`;
                const text = `Confira esta demanda no Negociei.app: ${demand.title}\n\n${url}`;
                window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
              }}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"
            >
              <span className="material-symbols-outlined text-[18px]">share</span>
              WhatsApp
            </button>
            <button
              onClick={() => {
                const url = `${window.location.origin}/#/demanda/${demand.id}`;
                navigator.clipboard.writeText(url);
                alert("Link direto da demanda copiado!");
              }}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all border border-slate-200"
            >
              <span className="material-symbols-outlined text-[18px]">content_copy</span>
              Copiar Link
            </button>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded">ID: #{demand.id}</span>
            <StatusBadge status={demand.status} />
          </div>
        </nav>

        {/* Content Header Compacto */}
        <header className={`p-8 rounded-[2rem] border-2 transition-all duration-500 relative overflow-hidden ${demand.isPremium
          ? 'bg-white border-amber-200 shadow-xl shadow-amber-500/5'
          : 'bg-white border-slate-100 shadow-soft'
          }`}>
          {demand.isPremium && (
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-50 rounded-full blur-[100px] -z-0"></div>
          )}

          <div className="relative z-10 space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${demand.isPremium
                ? 'bg-amber-100/50 text-amber-700 border-amber-200'
                : 'bg-slate-50 text-slate-500 border-slate-100'
                }`}>
                {demand.category}
              </span>
              {demand.isPremium && <PremiumBadge />}
            </div>

            <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter leading-tight max-w-4xl">
              {String(demand.title || 'Sem título')}
            </h1>

            <div className="flex flex-wrap items-center gap-x-8 gap-y-3 pt-2">
              <div className="flex items-center gap-2 text-slate-600">
                <span className="material-symbols-outlined text-primary text-[20px]">location_on</span>
                <span className="text-sm font-bold">{demand.location}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <span className="material-symbols-outlined text-primary text-[20px]">calendar_today</span>
                <span className="text-sm font-medium">Prazo: <strong className="text-slate-900 font-black">{demand.deadline}</strong></span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <span className="material-symbols-outlined text-primary text-[20px]">payments</span>
                <span className="text-sm font-medium">Budget: <strong className="text-slate-900 font-black">{demand.budget}</strong></span>
              </div>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Main Info Area */}
          <div className="lg:col-span-8 flex flex-col gap-6">

            {/* Galeria Compacta */}
            {demand.images && demand.images.length > 0 && (
              <section className="bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm space-y-4">
                <div className="aspect-[21/9] w-full rounded-2xl bg-slate-50 overflow-hidden border border-slate-100">
                  <img src={activeImage || ''} alt="Preview" className="w-full h-full object-cover" />
                </div>
                {demand.images.length > 1 && (
                  <div className="flex gap-3 overflow-x-auto pb-1 px-1">
                    {demand.images.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveImage(img)}
                        className={`size-16 rounded-xl border-2 overflow-hidden flex-shrink-0 transition-all ${activeImage === img ? 'border-primary' : 'border-transparent grayscale hover:grayscale-0'}`}
                      >
                        <img src={img} alt={`Thumb ${idx}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* Descrição e Itens */}
            <section className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[20px]">description</span>
                  Especificações da Demanda
                </h3>
              </div>
              <div className="p-8 space-y-8">
                <p className="text-lg font-medium text-slate-600 leading-relaxed italic">
                  {demand.description}
                </p>

                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Lista de Requisitos</h4>
                  <div className="border border-slate-100 rounded-2xl overflow-hidden">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                          <th className="py-4 px-6 text-[9px] font-black text-slate-400 uppercase tracking-widest">Item</th>
                          <th className="py-4 px-6 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Qtd</th>
                          <th className="py-4 px-6 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Referência</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {demand.items?.map(item => (
                          <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="py-4 px-6 font-bold text-slate-800 text-sm">{item.description}</td>
                            <td className="py-4 px-6 text-center">
                              <span className="bg-blue-50 text-primary font-black px-3 py-1 rounded-lg text-xs">
                                {item.quantity} {item.unit}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-right font-bold text-slate-400 text-sm">
                              R$ {item.unitPrice?.toLocaleString('pt-BR')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Sidebar Area Compacta */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <aside className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
              <div className="flex items-center gap-4 pb-4 border-b border-slate-50">
                <div className="size-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-xl">
                  {(demand.ownerId?.[0] || 'U').toUpperCase()}
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Solicitante</p>
                  <h4 className="font-bold text-slate-900 text-sm">Empresa Verificada</h4>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Localidade</span>
                  <p className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-primary">distance</span>
                    {demand.location}
                  </p>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Publicado em</span>
                  <p className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-primary">schedule</span>
                    {new Date(demand.createdAt).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>

              {isOwner && (
                <Link to={`/demanda/editar/${demand.id}`} className="w-full flex items-center justify-center gap-2 bg-slate-100 text-slate-900 font-black py-4 rounded-xl hover:bg-slate-200 transition-all text-[10px] uppercase tracking-widest">
                  <span className="material-symbols-outlined text-[18px]">edit_square</span>
                  Editar Minha Demanda
                </Link>
              )}
            </aside>

            {/* Ofertas Enviadas Stats */}
            <div className="bg-slate-900 p-6 rounded-[2rem] text-white shadow-xl relative overflow-hidden">
              <div className="relative z-10 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Competitividade</p>
                  <span className="bg-primary/20 text-primary-green text-[10px] px-2 py-0.5 rounded font-black">Live</span>
                </div>
                <div className="flex items-end gap-3">
                  <span className="text-4xl font-black text-white leading-none">{demand.offersCount}</span>
                  <span className="text-xs font-bold text-slate-400 mb-1 uppercase tracking-tight">Propostas Ativas</span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-primary-green w-1/3"></div>
                </div>
              </div>
              <span className="material-symbols-outlined absolute -bottom-4 -right-4 text-7xl text-white/5 rotate-12 pointer-events-none">analytics</span>
            </div>

            {isOwner && !demand.isPremium && (
              <Link to="/premium" className="group bg-gradient-to-br from-amber-400 to-orange-500 p-6 rounded-[2rem] text-white shadow-lg flex flex-col gap-4 hover:scale-[1.02] transition-transform">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-3xl fill-1 animate-pulse">workspace_premium</span>
                  <h4 className="font-black text-lg leading-tight">Impulsionar Visibilidade</h4>
                </div>
                <p className="text-xs font-bold text-amber-50">Sua demanda no topo do feed para todos os fornecedores premium.</p>
                <div className="bg-white/20 px-4 py-2 rounded-xl text-center text-[10px] font-black uppercase tracking-widest group-hover:bg-white/30 transition-colors">
                  Turbinar Agora
                </div>
              </Link>
            )}
          </div>
        </div>

        {/* ÁREA DE OFERTA COMPACTA */}
        {user ? (
          isSeller && !isOwner && (
            <section className="bg-white rounded-[2.5rem] border border-slate-100 shadow-elegant overflow-hidden animate-in slide-in-from-bottom-4 duration-500 mt-4">
              <div className="p-10 border-b border-slate-50 bg-slate-50/50 flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="space-y-2 text-center md:text-left">
                  <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3 justify-center md:justify-start">
                    <span className="material-symbols-outlined text-primary-green text-3xl fill-1">handshake</span>
                    Sua Proposta Comercial Privada
                  </h3>
                  <p className="text-sm font-medium text-slate-500">O comprador receberá sua oferta em um canal exclusivo e seguro.</p>
                </div>

                <div className="flex flex-col items-center md:items-end">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Calculado</span>
                  <h4 className="text-4xl font-black text-primary-green tracking-tighter leading-none">
                    R$ {offerTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </h4>
                </div>
              </div>

              <div className="p-10 grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Lado Esquerdo: Itens */}
                <div className="lg:col-span-7 space-y-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Preços Unitários por Item</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {demand.items?.map(item => (
                      <div key={item.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between gap-4 group hover:border-primary/40 transition-all">
                        <div className="flex-1">
                          <p className="text-xs font-black text-slate-700 leading-tight">{item.description}</p>
                          <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">{item.quantity} {item.unit}</p>
                        </div>
                        <div className="relative w-28">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[10px] font-black">R$</span>
                          <input
                            type="number"
                            step="0.01"
                            value={itemPrices[item.id] || ''}
                            onChange={(e) => setItemPrices(prev => ({ ...prev, [item.id]: Number(e.target.value) }))}
                            className="w-full h-10 pl-8 pr-3 rounded-xl border-slate-200 bg-white focus:ring-primary font-black text-slate-900 text-sm transition-all text-right"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Lado Direito: Mensagem e Frete */}
                <div className="lg:col-span-5 flex flex-col gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Mensagem e Condições</label>
                    <textarea
                      value={offerMessage}
                      onChange={(e) => setOfferMessage(e.target.value)}
                      placeholder="Marcas, garantia, prazo de entrega..."
                      className="w-full h-32 rounded-2xl border-slate-200 bg-slate-50 focus:ring-primary focus:bg-white p-4 text-sm text-slate-600 transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Logística (Frete)</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[10px] font-black">R$</span>
                        <input
                          type="number"
                          step="0.01"
                          value={shippingCost}
                          onChange={(e) => setShippingCost(Number(e.target.value))}
                          className="w-full h-12 pl-8 pr-4 rounded-xl border-slate-200 bg-slate-50 focus:ring-primary font-black text-slate-900 text-lg"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col justify-end">
                      <button onClick={() => setShippingCost(0)} className={`h-12 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${shippingCost === 0 ? 'bg-primary-green text-slate-900 border-primary-green shadow-lg shadow-emerald-100' : 'bg-transparent text-slate-400 border-slate-100 hover:border-slate-200'}`}>
                        Frete Grátis
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Prazo (Dias)</label>
                      <input
                        type="number"
                        value={deadlineDays}
                        onChange={(e) => setDeadlineDays(Number(e.target.value))}
                        className="w-full h-12 px-4 rounded-xl border-slate-200 bg-slate-50 focus:ring-primary font-black text-slate-900"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Garantia (Meses)</label>
                      <input
                        type="number"
                        value={warrantyMonths}
                        onChange={(e) => setWarrantyMonths(Number(e.target.value))}
                        className="w-full h-12 px-4 rounded-xl border-slate-200 bg-slate-50 focus:ring-primary font-black text-slate-900"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Pagamento</label>
                      <select
                        value={paymentTerms}
                        onChange={(e) => setPaymentTerms(e.target.value)}
                        className="w-full h-12 px-4 rounded-xl border-slate-200 bg-slate-50 focus:ring-primary font-black text-slate-900 text-sm"
                      >
                        <option value="À vista">À vista</option>
                        <option value="50% antecipado / 50% entrega">50/50</option>
                        <option value="30 dias">30 dias</option>
                        <option value="Cartão de Crédito">Cartão de Crédito</option>
                        <option value="Boleto Bancário">Boleto Bancário</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Anexo PDF (Opcional)</label>
                        <input
                          type="file"
                          accept="application/pdf"
                          ref={pdfInputRef}
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              if (file.size > 5 * 1024 * 1024) {
                                alert("O arquivo PDF deve ter no máximo 5MB.");
                                return;
                              }
                              setPdfName(file.name);
                              const reader = new FileReader();
                              reader.onloadend = () => setPdfBase64(reader.result as string);
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => pdfInputRef.current?.click()}
                          className={`w-full h-12 rounded-xl border-2 border-dashed flex items-center justify-center gap-2 transition-all ${pdfName ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-50 text-slate-400 hover:border-primary hover:text-primary'}`}
                        >
                          <span className="material-symbols-outlined text-[20px]">{pdfName ? 'check_circle' : 'picture_as_pdf'}</span>
                          <span className="text-xs font-bold truncate max-w-[120px]">{pdfName || 'Anexar PDF da Proposta'}</span>
                        </button>
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Proposta Válida até</label>
                        <input
                          type="date"
                          value={validUntil}
                          onChange={(e) => setValidUntil(e.target.value)}
                          className="w-full h-12 px-4 rounded-xl border-slate-200 bg-slate-50 focus:ring-primary font-black text-slate-900 text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    disabled={alreadyHasOffer || offerTotal === 0 || isSubmitting}
                    onClick={handleSendOffer}
                    className="w-full h-16 bg-primary text-white font-black rounded-2xl hover:bg-primary-dark transition-all flex items-center justify-center gap-3 shadow-xl shadow-primary/20 disabled:opacity-40 disabled:cursor-not-allowed text-sm uppercase tracking-widest"
                  >
                    {isSubmitting ? (
                      <>
                        ENVIANDO...
                        <div className="size-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      </>
                    ) : alreadyHasOffer ? (
                      'OFERTA JÁ ENVIADA'
                    ) : (
                      <>
                        ENVIAR PROPOSTA AGORA
                        <span className="material-symbols-outlined text-2xl">send</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </section>
          )
        ) : (
          <section className="bg-slate-900 rounded-[2.5rem] p-10 mt-4 overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[100px] group-hover:bg-primary/20 transition-all duration-700"></div>
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="space-y-4 text-center md:text-left">
                <div className="flex items-center gap-3 justify-center md:justify-start">
                  <div className="size-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-3xl fill-1">lock</span>
                  </div>
                  <h3 className="text-2xl font-black text-white tracking-tight">Interessado nesta demanda?</h3>
                </div>
                <p className="text-slate-400 font-medium max-w-lg">Faça login ou crie sua conta agora mesmo para enviar uma proposta comercial e fechar negócio.</p>
              </div>
              <Link
                to="/login"
                className="w-full md:w-auto px-10 py-5 bg-primary text-white font-black rounded-2xl hover:bg-primary-dark transition-all flex items-center justify-center gap-3 shadow-2xl shadow-primary/40 text-sm uppercase tracking-widest transform hover:scale-[1.05]"
              >
                Entrar e Enviar Proposta
                <span className="material-symbols-outlined">arrow_forward</span>
              </Link>
            </div>
          </section>
        )}

      </div>
    </Layout>
  );
};

export default DemandDetailPage;
