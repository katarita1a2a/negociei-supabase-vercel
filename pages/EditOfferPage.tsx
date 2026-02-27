
import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { useDemands } from '../context/DemandsContext';
import { useAuth } from '../context/AuthContext';
import { Offer } from '../types';
import { formatCurrencyBRL, parseCurrencyBRL, maskCurrencyBRL } from '../utils/currencyUtils';

const EditOfferPage: React.FC = () => {
    const { user } = useAuth();
    const { offerId } = useParams();
    const navigate = useNavigate();
    const { offers, demands, updateOffer, isLoading } = useDemands();

    const offer = offers.find(o => o.id === offerId);
    const demand = demands.find(d => d.id === offer?.demandId);

    const [offerMessage, setOfferMessage] = useState('');
    const [shippingCost, setShippingCost] = useState<number>(0);
    const [deadlineDays, setDeadlineDays] = useState<number>(5);
    const [warrantyMonths, setWarrantyMonths] = useState<number>(0);
    const [paymentTerms, setPaymentTerms] = useState<string>('À vista');
    const [validUntil, setValidUntil] = useState<string>('');
    const [itemPrices, setItemPrices] = useState<Record<string, number>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [pdfBase64, setPdfBase64] = useState<string | null>(null);
    const [pdfName, setPdfName] = useState<string | null>(null);
    const pdfInputRef = React.useRef<HTMLInputElement>(null);

    const [itemPriceInputs, setItemPriceInputs] = useState<Record<string, string>>({});
    const [shippingInput, setShippingInput] = useState<string>("");

    useEffect(() => {
        if (offer) {
            setOfferMessage(offer.message || '');
            setShippingCost(offer.shippingCost || 0);
            setDeadlineDays(offer.deadlineDays || 0);
            setWarrantyMonths(offer.warrantyMonths || 0);
            setPaymentTerms(offer.paymentTerms || 'À vista');
            setValidUntil(offer.validUntil || '');

            const prices: Record<string, number> = {};
            const inputs: Record<string, string> = {};
            offer.items?.forEach(item => {
                prices[item.id] = item.unitPrice || 0;
                inputs[item.id] = item.unitPrice ? maskCurrencyBRL(item.unitPrice.toString().replace('.', ',')) : "";
            });
            setItemPrices(prices);
            setItemPriceInputs(inputs);
            setShippingInput(offer.shippingCost ? maskCurrencyBRL(offer.shippingCost.toString().replace('.', ',')) : "");

            if (offer.pdfUrl && offer.pdfUrl.startsWith('data:application/pdf;base64,')) {
                setPdfName('Arquivo atual anexado');
            } else if (offer.pdfUrl) {
                setPdfName('PDF da Proposta');
            }
        }
    }, [offer]);

    const offerTotal = useMemo(() => {
        if (!offer?.items) return 0;
        const itemsSum = offer.items.reduce((acc, item) => {
            const price = itemPrices[item.id] || 0;
            return acc + (price * item.quantity);
        }, 0);
        return itemsSum + shippingCost;
    }, [offer, itemPrices, shippingCost]);

    if (isLoading) {
        return (
            <Layout showSidebar={false}>
                <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
                    <div className="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-500 font-bold animate-pulse text-xs uppercase tracking-widest">Carregando proposta...</p>
                </div>
            </Layout>
        );
    }

    if (!offer || !demand) {
        return (
            <Layout showSidebar={false}>
                <div className="py-20 text-center font-bold text-slate-900 text-xl">Proposta não encontrada</div>
            </Layout>
        );
    }

    const handleUpdateOffer = async () => {
        const updatedOffer: Offer = {
            ...offer,
            value: offerTotal,
            shippingCost,
            deadlineDays,
            warrantyMonths,
            paymentTerms,
            validUntil,
            message: offerMessage,
            pdfUrl: pdfBase64 || offer.pdfUrl,
            items: offer.items?.map(item => ({
                ...item,
                unitPrice: itemPrices[item.id],
                totalPrice: itemPrices[item.id] * item.quantity
            }))
        };

        setIsSubmitting(true);
        try {
            await updateOffer(updatedOffer);
            navigate('/ofertas');
        } catch (err) {
            console.error('Error updating offer:', err);
            alert("Erro ao atualizar a proposta.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Layout showSidebar={false}>
            <div className="max-w-[1100px] mx-auto flex flex-col gap-6 pb-20">
                <nav className="flex items-center justify-between py-2">
                    <Link to="/ofertas" className="flex items-center gap-2 text-slate-500 hover:text-primary font-bold text-xs uppercase tracking-widest transition-colors group">
                        <span className="material-symbols-outlined text-lg group-hover:-translate-x-1 transition-transform">arrow_back</span>
                        Minhas Propostas
                    </Link>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded">Editando Proposta: #{offerId}</span>
                </nav>

                <header className="p-8 rounded-[2rem] bg-white border-2 border-slate-100 shadow-soft">
                    <div className="space-y-2">
                        <span className="bg-slate-50 text-slate-500 border border-slate-100 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">
                            {demand.category}
                        </span>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tighter">
                            Ajustar Proposta para: {demand.title}
                        </h1>
                        <p className="text-slate-500 font-medium">Você está editando sua proposta comercial. O comprador verá os valores atualizados na matriz de comparação.</p>
                    </div>
                </header>

                <section className="bg-white rounded-[2.5rem] border border-slate-100 shadow-elegant overflow-hidden">
                    <div className="p-10 border-b border-slate-50 bg-slate-50/50 flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="space-y-2 text-center md:text-left">
                            <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3 justify-center md:justify-start">
                                <span className="material-symbols-outlined text-primary-green text-3xl fill-1">edit_square</span>
                                Valores da Proposta
                            </h3>
                        </div>

                        <div className="flex flex-col items-center md:items-end">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Novo Total Calculado</span>
                            <h4 className="text-4xl font-black text-primary-green tracking-tighter leading-none">
                                R$ {offerTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </h4>
                        </div>
                    </div>

                    <div className="p-10 grid grid-cols-1 lg:grid-cols-12 gap-10">
                        <div className="lg:col-span-7 space-y-4">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Preços Unitários por Item</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {offer.items?.map(item => (
                                    <div key={item.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between gap-4 group hover:border-primary/40 transition-all">
                                        <div className="flex-1">
                                            <p className="text-xs font-black text-slate-700 leading-tight">{item.description}</p>
                                            <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">{item.quantity} {item.unit}</p>
                                        </div>
                                        <div className="relative w-28">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[10px] font-black">R$</span>
                                            <input
                                                type="text"
                                                inputMode="decimal"
                                                value={itemPriceInputs[item.id] ?? ""}
                                                onChange={(e) => {
                                                    const masked = maskCurrencyBRL(e.target.value);
                                                    const numeric = parseCurrencyBRL(masked);
                                                    setItemPriceInputs(prev => ({ ...prev, [item.id]: masked }));
                                                    setItemPrices(prev => ({ ...prev, [item.id]: numeric }));
                                                }}
                                                className="w-full h-10 pl-8 pr-3 rounded-xl border-slate-200 bg-white focus:ring-primary font-black text-slate-900 text-sm transition-all text-right"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

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
                                            type="text"
                                            inputMode="decimal"
                                            value={shippingInput}
                                            onChange={(e) => {
                                                const masked = maskCurrencyBRL(e.target.value);
                                                const numeric = parseCurrencyBRL(masked);
                                                setShippingInput(masked);
                                                setShippingCost(numeric);
                                            }}
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
                                <div className="grid grid-cols-1 gap-4">
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Validade até</label>
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
                                disabled={isSubmitting || offerTotal === 0}
                                onClick={handleUpdateOffer}
                                className="w-full h-16 bg-primary text-white font-black rounded-2xl hover:bg-primary-dark transition-all flex items-center justify-center gap-3 shadow-xl shadow-primary/20 disabled:opacity-40 disabled:cursor-not-allowed text-sm uppercase tracking-widest"
                            >
                                {isSubmitting ? 'SALVANDO ALTERAÇÕES...' : 'SALVAR ALTERAÇÕES AGORA'}
                                {!isSubmitting && <span className="material-symbols-outlined text-2xl">save</span>}
                            </button>
                        </div>
                    </div>
                </section>
            </div>
        </Layout>
    );
};

export default EditOfferPage;
