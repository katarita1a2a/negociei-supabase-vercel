import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';

const PremiumPage: React.FC = () => {
  const { user } = useAuth();
  const [activePlan, setActivePlan] = useState<'monthly' | 'yearly'>('monthly');
  return (
    <Layout showSidebar={false}>
      <div className="max-w-[1000px] mx-auto flex flex-col gap-12 pb-20 pt-4">

        {/* Hero Section */}
        <section className="text-center space-y-6">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border border-primary/20">
            <span className="material-symbols-outlined text-[18px] fill-1">verified</span>
            Vantagem Competitiva
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Eleve seu patamar, {user?.user_metadata?.full_name?.split(' ')[0] || 'Usuário'}</h1>
          <p className="text-slate-500 mt-1">Escolha o plano ideal para escalar suas negociações.</p>
        </section>

        {/* Pricing Card Section */}
        <section className="relative">
          <div className="absolute inset-0 bg-primary/5 rounded-3xl -rotate-1 scale-[1.02]"></div>
          <div className="relative bg-white border-2 border-primary rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2">

            {/* Left side: Benefits */}
            <div className="p-8 md:p-12 space-y-8">
              <h3 className="text-xl font-bold text-slate-900">O que você ganha sendo Premium?</h3>
              <ul className="space-y-6">
                <li className="flex items-start gap-4">
                  <div className="size-10 rounded-xl bg-blue-50 text-primary flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-[24px]">vertical_align_top</span>
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 leading-tight">Topo do Feed</p>
                    <p className="text-sm text-slate-500 mt-1">Suas demandas aparecem em primeiro lugar para todos os fornecedores.</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="size-10 rounded-xl bg-green-50 text-primary-green flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-[24px]">stars</span>
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 leading-tight">Selo de Credibilidade</p>
                    <p className="text-sm text-slate-500 mt-1">Um distintivo exclusivo de "Empresa Premium" no seu perfil e anúncios.</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="size-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-[24px]">bolt</span>
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 leading-tight">Acesso Antecipado</p>
                    <p className="text-sm text-slate-500 mt-1">Veja novas demandas 2 horas antes dos usuários gratuitos.</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="size-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-[24px]">support_agent</span>
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 leading-tight">Suporte Prioritário</p>
                    <p className="text-sm text-slate-500 mt-1">Time dedicado para te ajudar em suas negociações em menos de 1 hora.</p>
                  </div>
                </li>
              </ul>
            </div>

            {/* Right side: Pricing and CTA */}
            <div className="bg-slate-900 p-8 md:p-12 text-white flex flex-col justify-center items-center text-center">
              <Logo theme="dark" size="md" className="mb-8" />
              <div className="space-y-2 mb-8">
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Plano Mensal Único</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold opacity-50">R$</span>
                  <span className="text-6xl font-black text-primary-green tracking-tighter">29,90</span>
                  <span className="text-xl font-bold opacity-50">/mês</span>
                </div>
                <p className="text-slate-400 text-sm">Cancele quando quiser, sem letras miúdas.</p>
              </div>

              <button className="w-full bg-primary-green hover:bg-green-500 text-slate-900 font-black py-5 rounded-2xl shadow-xl shadow-green-900/40 transition-all transform active:scale-95 text-lg mb-6">
                ASSINAR PREMIUM AGORA
              </button>

              <div className="flex items-center gap-6 text-slate-400">
                <div className="flex items-center gap-1.5 text-xs font-bold">
                  <span className="material-symbols-outlined text-[16px]">lock</span>
                  Pagamento Seguro
                </div>
                <div className="flex items-center gap-1.5 text-xs font-bold">
                  <span className="material-symbols-outlined text-[16px]">credit_score</span>
                  Liberação Imediata
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials or Trust Section */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm italic text-slate-600 text-sm leading-relaxed">
            "Desde que mudei para o Premium, minhas demandas recebem o dobro de ofertas nas primeiras 12 horas. Vale cada centavo."
            <p className="mt-4 font-bold text-slate-900 not-italic">— Ricardo M., Comprador Industrial</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm italic text-slate-600 text-sm leading-relaxed">
            "O selo de verificação premium passou muito mais confiança para os novos clientes. Fechei 3 grandes contratos este mês."
            <p className="mt-4 font-bold text-slate-900 not-italic">— Eliana S., Fornecedora de Logística</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm italic text-slate-600 text-sm leading-relaxed">
            "O suporte prioritário é realmente rápido. Tive uma dúvida sobre uma entrega e resolveram pelo WhatsApp em minutos."
            <p className="mt-4 font-bold text-slate-900 not-italic">— Marcos P., Pequeno Empreendedor</p>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="space-y-8 max-w-2xl mx-auto w-full">
          <h3 className="text-2xl font-black text-slate-900 text-center tracking-tight">Perguntas Frequentes</h3>
          <div className="space-y-4">
            <details className="group bg-white rounded-xl border border-slate-200 overflow-hidden">
              <summary className="flex items-center justify-between p-4 font-bold text-slate-900 cursor-pointer hover:bg-slate-50 transition-colors">
                Posso cancelar a qualquer momento?
                <span className="material-symbols-outlined group-open:rotate-180 transition-transform">expand_more</span>
              </summary>
              <div className="p-4 pt-0 text-sm text-slate-500 leading-relaxed border-t border-slate-50">
                Sim! Você pode cancelar sua assinatura premium diretamente pelo seu perfil a qualquer momento, sem taxas de cancelamento ou fidelidade.
              </div>
            </details>
            <details className="group bg-white rounded-xl border border-slate-200 overflow-hidden">
              <summary className="flex items-center justify-between p-4 font-bold text-slate-900 cursor-pointer hover:bg-slate-50 transition-colors">
                Como funciona o destaque no feed?
                <span className="material-symbols-outlined group-open:rotate-180 transition-transform">expand_more</span>
              </summary>
              <div className="p-4 pt-0 text-sm text-slate-500 leading-relaxed border-t border-slate-50">
                Suas demandas são marcadas com um selo especial e fixadas nas primeiras posições para fornecedores que buscam na sua categoria e região.
              </div>
            </details>
            <details className="group bg-white rounded-xl border border-slate-200 overflow-hidden">
              <summary className="flex items-center justify-between p-4 font-bold text-slate-900 cursor-pointer hover:bg-slate-50 transition-colors">
                Quais formas de pagamento são aceitas?
                <span className="material-symbols-outlined group-open:rotate-180 transition-transform">expand_more</span>
              </summary>
              <div className="p-4 pt-0 text-sm text-slate-500 leading-relaxed border-t border-slate-50">
                Aceitamos cartões de crédito, PIX e boleto bancário (para planos anuais). A liberação dos benefícios no PIX e Cartão é instantânea.
              </div>
            </details>
          </div>
        </section>

        <div className="flex justify-center">
          <Link to="/" className="text-sm font-bold text-slate-400 hover:text-primary transition-colors flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Voltar para o início
          </Link>
        </div>
      </div>
    </Layout>
  );
};

export default PremiumPage;
