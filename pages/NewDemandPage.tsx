import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { DemandItem, Demand, DemandStatus } from '../types';
import { useDemands } from '../context/DemandsContext';
import { useAuth } from '../context/AuthContext';
import { CATEGORIES, BR_STATES } from '../mockData';
import { GoogleGenAI } from "@google/genai";

const UNIT_OPTIONS = [
  { value: 'un', label: 'Unidade (un)' },
  { value: 'kg', label: 'Quilo (kg)' },
  { value: 'litro', label: 'Litro (l)' },
  { value: 'caixa', label: 'Caixa (cx)' },
  { value: 'pacote', label: 'Pacote (pct)' },
  { value: 'M', label: 'Metro (m)' },
  { value: 'M²', label: 'Metro Quadrado (m²)' },
  { value: 'M³', label: 'Metro Cúbico (m³)' },
  { value: 'Serv', label: 'Serviço' },
  { value: 'Diaria', label: 'Diária' },
  { value: 'Horas', label: 'Horas' },
  { value: 'Frete', label: 'Frete' },
  { value: 'outro', label: 'Outro' },
];

const NewDemandPage: React.FC = () => {
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const { addDemand, updateDemand, demands } = useDemands();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEditing = !!id;

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [description, setDescription] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [cities, setCities] = useState<string[]>([]);
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [shippingCost, setShippingCost] = useState<number>(0);
  const [items, setItems] = useState<DemandItem[]>([
    { id: crypto.randomUUID(), description: '', unit: 'un', quantity: 1, unitPrice: 0, totalPrice: 0 },
  ]);

  useEffect(() => {
    if (isEditing) {
      const existingDemand = demands.find(d => d.id === id);
      if (existingDemand) {
        setTitle(existingDemand.title);
        setCategory(existingDemand.category);
        setDescription(existingDemand.description);
        setShippingCost(existingDemand.shippingCost || 0);
        setUploadedImages(existingDemand.images || []);

        const locationParts = existingDemand.location.split(', ');
        if (locationParts.length === 2) {
          setSelectedCity(locationParts[0]);
          setSelectedState(locationParts[1]);
        }

        if (existingDemand.deadline && existingDemand.deadline.includes('/')) {
          const [d, m, y] = existingDemand.deadline.split('/');
          setDeliveryDate(`${y}-${m}-${d}`);
        }
        if (existingDemand.items) setItems(existingDemand.items);
      }
    }
  }, [isEditing, id, demands]);

  useEffect(() => {
    if (selectedState) {
      setIsLoadingCities(true);
      fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${selectedState}/municipios`)
        .then(response => response.json())
        .then(data => {
          const cityNames = data.map((city: any) => city.nome).sort();
          setCities(cityNames);
          setIsLoadingCities(false);
        })
        .catch(() => {
          setIsLoadingCities(false);
          setCities([]);
        });
    } else {
      setCities([]);
    }
  }, [selectedState]);

  const handleAIEnhance = async () => {
    if (!title || !category) {
      alert("Por favor, preencha o título e a categoria para que a IA possa ajudar.");
      return;
    }
    setIsGeneratingAI(true);
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        alert("Chave de API do Gemini não configurada.");
        return;
      }
      const client = new (GoogleGenAI as any)({ apiKey });
      const result = await client.models.generateContent({
        model: "gemini-2.0-flash",
        contents: `Melhore esta descrição de demanda comercial B2B de forma profissional e detalhada: Título: ${title}, Categoria: ${category}. Descrição atual: ${description || 'Sem descrição específica'}. Foque em clareza para fornecedores.`
      });

      if (result.text) {
        setDescription(result.text.trim());
      }
    } catch (err) {
      console.error('AI Error:', err);
      alert("Erro ao gerar descrição com IA. Verifique sua chave de API e conexão.");
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach((file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setUploadedImages(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const updateItem = (itemId: string, field: keyof DemandItem, value: any) => {
    setItems((prev) => prev.map((item) => {
      if (item.id === itemId) {
        const updatedItem = { ...item, [field]: value };
        if (field === 'quantity' || field === 'unitPrice') {
          const qty = field === 'quantity' ? Number(value) : item.quantity;
          const price = field === 'unitPrice' ? Number(value) : (item.unitPrice || 0);
          updatedItem.totalPrice = qty * price;
        }
        return updatedItem;
      }
      return item;
    }));
  };

  const addItem = () => {
    setItems([...items, { id: crypto.randomUUID(), description: '', unit: 'un', quantity: 1, unitPrice: 0, totalPrice: 0 }]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) setItems(items.filter(i => i.id !== id));
  };

  const subtotal = useMemo(() => items.reduce((acc, curr) => acc + curr.totalPrice, 0), [items]);
  const total = subtotal + shippingCost;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCity || !selectedState) {
      alert("Por favor, selecione Estado e Cidade.");
      return;
    }

    const demandData: Demand = {
      id: id || `DEM-${Date.now()}`,
      title,
      description,
      category,
      location: `${selectedCity}, ${selectedState}`,
      deadline: deliveryDate.split('-').reverse().join('/'),
      budget: `R$ ${total.toLocaleString('pt-BR')}`,
      shippingCost,
      status: DemandStatus.ABERTO,
      isPremium: false,
      ownerId: user?.id || 'anonymous',
      userName: user?.user_metadata?.full_name || 'Usuário',
      userAvatar: user?.user_metadata?.avatar_url || '',
      offersCount: isEditing ? (demands.find(d => d.id === id)?.offersCount || 0) : 0,
      createdAt: isEditing ? (demands.find(d => d.id === id)?.createdAt || new Date().toISOString()) : new Date().toISOString(),
      tags: [category],
      items,
      images: uploadedImages
    };

    if (isEditing) {
      updateDemand(demandData);
    } else {
      addDemand(demandData);
    }
    navigate('/minhas-demandas');
  };

  return (
    <Layout showSidebar={false}>
      <div className="max-w-[1100px] mx-auto pb-24">
        <header className="mb-10 flex flex-col gap-2">
          <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none">{isEditing ? 'Editar' : 'Criar'} Demanda</h1>
          <p className="text-slate-500 font-medium text-lg">Preencha os detalhes e receba as melhores propostas do mercado.</p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-10">
          {/* 1. Informações Essenciais */}
          <section className="bg-white p-8 md:p-10 rounded-[2rem] border border-slate-200 shadow-sm space-y-8">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <span className="material-symbols-outlined text-primary text-3xl">info</span>
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Informações Básicas</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <label className="flex flex-col gap-2 md:col-span-2">
                <span className="text-sm font-black text-slate-700 uppercase tracking-widest px-1">Título da Demanda</span>
                <input required value={title} onChange={(e) => setTitle(e.target.value)} className="form-input rounded-2xl border-slate-200 h-14 bg-slate-50 px-5 focus:bg-white focus:ring-primary transition-all text-lg font-bold" placeholder="Ex: Aquisição de 20 Monitores 4K para Design" />
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-sm font-black text-slate-700 uppercase tracking-widest px-1">Categoria Principal</span>
                <select required value={category} onChange={(e) => setCategory(e.target.value)} className="form-select rounded-2xl border-slate-200 h-14 bg-slate-50 px-5 font-bold text-slate-700">
                  <option value="">Selecione uma categoria...</option>
                  {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-sm font-black text-slate-700 uppercase tracking-widest px-1">Data de Necessidade</span>
                <div className="relative">
                  <input
                    required
                    type="date"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    className="form-input w-full rounded-2xl border-slate-200 h-14 bg-slate-50 px-5 font-bold focus:bg-white focus:ring-primary transition-all cursor-pointer"
                  />
                  <span className="absolute right-5 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 pointer-events-none">calendar_month</span>
                </div>
              </label>

              <div className="grid grid-cols-2 gap-4">
                <label className="flex flex-col gap-2">
                  <span className="text-sm font-black text-slate-700 uppercase tracking-widest px-1">Estado (UF)</span>
                  <select required value={selectedState} onChange={(e) => setSelectedState(e.target.value)} className="form-select rounded-2xl border-slate-200 h-14 bg-slate-50 px-5 font-bold">
                    <option value="">UF</option>
                    {BR_STATES.map(s => <option key={s.uf} value={s.uf}>{s.uf} - {s.name}</option>)}
                  </select>
                </label>
                <label className="flex flex-col gap-2">
                  <span className="text-sm font-black text-slate-700 uppercase tracking-widest px-1">Cidade</span>
                  <select required disabled={!selectedState || isLoadingCities} value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)} className="form-select rounded-2xl border-slate-200 h-14 bg-slate-50 px-5 font-bold disabled:opacity-50">
                    <option value="">{isLoadingCities ? 'Carregando...' : 'Selecione...'}</option>
                    {cities.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </label>
              </div>

              <div className="md:col-span-2 space-y-3">
                <div className="flex items-center justify-between px-1">
                  <span className="text-sm font-black text-slate-700 uppercase tracking-widest">Descrição Detalhada</span>
                  <button type="button" onClick={handleAIEnhance} disabled={isGeneratingAI} className="flex items-center gap-2 text-xs font-black text-primary hover:text-blue-700 transition-colors bg-blue-50 px-4 py-2 rounded-full border border-blue-100 disabled:opacity-50">
                    <span className="material-symbols-outlined text-[18px] animate-pulse">auto_awesome</span>
                    {isGeneratingAI ? 'MELHORANDO COM IA...' : 'MELHORAR COM IA'}
                  </button>
                </div>
                <textarea required value={description} onChange={(e) => setDescription(e.target.value)} className="form-textarea w-full rounded-2xl border-slate-200 bg-slate-50 p-5 focus:bg-white focus:ring-primary transition-all min-h-[160px] text-slate-600 leading-relaxed" placeholder="Explique detalhadamente o que você precisa." />
              </div>
            </div>
          </section>

          {/* 2. Itens da Demanda com Unidade de Medida */}
          <section className="space-y-6">
            <div className="flex items-center justify-between px-4">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary text-3xl">list_alt</span>
                <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Itens e Quantidades</h2>
              </div>
              <button type="button" onClick={addItem} className="h-10 px-5 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">add</span> Adicionar Item
              </button>
            </div>

            <div className="space-y-4">
              {items.map((item, idx) => (
                <div key={item.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm grid grid-cols-12 gap-4 items-end animate-in fade-in duration-300">
                  <div className="col-span-12 lg:col-span-5 flex flex-col gap-1.5">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Descrição do Item</span>
                    <input required value={item.description} onChange={(e) => updateItem(item.id, 'description', e.target.value)} className="form-input rounded-xl border-slate-200 h-12 px-4 text-sm bg-slate-50 focus:bg-white" placeholder="Ex: Monitor Dell 27'" />
                  </div>

                  <div className="col-span-4 lg:col-span-2 flex flex-col gap-1.5">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Qtd</span>
                    <input type="number" required value={item.quantity} onChange={(e) => updateItem(item.id, 'quantity', e.target.value)} className="form-input rounded-xl border-slate-200 h-12 px-3 text-sm text-center font-bold" />
                  </div>

                  <div className="col-span-8 lg:col-span-2 flex flex-col gap-1.5">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Unidade</span>
                    <select required value={item.unit} onChange={(e) => updateItem(item.id, 'unit', e.target.value)} className="form-select rounded-xl border-slate-200 h-12 px-3 text-xs font-bold bg-slate-50">
                      {UNIT_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-10 lg:col-span-2 flex flex-col gap-1.5">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Preço Est.</span>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">R$</span>
                      <input type="number" step="0.01" value={item.unitPrice || 0} onChange={(e) => updateItem(item.id, 'unitPrice', e.target.value)} className="form-input w-full rounded-xl border-slate-200 h-12 pl-8 pr-3 text-sm font-black text-slate-900" />
                    </div>
                  </div>

                  <div className="col-span-2 lg:col-span-1 flex justify-center pb-1">
                    <button type="button" onClick={() => removeItem(item.id)} className="size-10 rounded-xl text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all flex items-center justify-center">
                      <span className="material-symbols-outlined">delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 3. Fotos e Anexos */}
          <section className="bg-white p-8 md:p-10 rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-3xl">photo_library</span>
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Fotos de Referência</h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
              {uploadedImages.map((img, idx) => (
                <div key={idx} className="aspect-square rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden relative group">
                  <img src={img} alt={`Ref ${idx}`} className="w-full h-full object-cover" />
                  <button type="button" onClick={() => setUploadedImages(prev => prev.filter((_, i) => i !== idx))} className="absolute top-2 right-2 size-7 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                </div>
              ))}
              <button type="button" onClick={() => fileInputRef.current?.click()} className="aspect-square rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-primary hover:text-primary hover:bg-blue-50 transition-all">
                <span className="material-symbols-outlined text-3xl">add_a_photo</span>
                <span className="text-[10px] font-black uppercase tracking-widest">Adicionar</span>
              </button>
              <input type="file" ref={fileInputRef} onChange={handleImageUpload} multiple accept="image/*" className="hidden" />
            </div>
          </section>

          {/* 4. Resumo e Frete */}
          <section className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden group">
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-12">

              <div className="flex-1 w-full space-y-6">
                <div className="flex items-center gap-4">
                  <div className="size-14 rounded-2xl bg-white/10 flex items-center justify-center text-primary-green shadow-inner">
                    <span className="material-symbols-outlined text-3xl">local_shipping</span>
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Previsão de Logística (Opcional)</h4>
                    <p className="text-sm text-slate-500 font-medium">Insira o valor que você está disposto a pagar pelo frete.</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  <div className="relative w-48">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-black">R$</span>
                    <input type="number" step="0.01" value={shippingCost} onChange={(e) => setShippingCost(Number(e.target.value))} className="w-full h-14 bg-white/5 border-none rounded-2xl pl-11 pr-5 text-xl font-black text-white focus:ring-2 focus:ring-primary-green transition-all" />
                  </div>
                  <button type="button" onClick={() => setShippingCost(0)} className={`h-14 px-6 rounded-2xl text-xs font-black uppercase tracking-widest transition-all border ${shippingCost === 0 ? 'bg-primary-green text-slate-900 border-primary-green' : 'bg-transparent text-slate-400 border-white/10 hover:border-white/30'}`}>
                    Frete Grátis
                  </button>
                </div>
              </div>

              <div className="w-full md:w-auto flex flex-col items-center md:items-end gap-6 border-t md:border-t-0 md:border-l border-white/10 pt-10 md:pt-0 md:pl-12">
                <div className="text-center md:text-right space-y-1">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest opacity-60">Custo Total Previsto</span>
                  <h3 className="text-5xl font-black text-primary-green tracking-tighter">R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">({items.length} ITENS + R$ {shippingCost.toLocaleString('pt-BR')} FRETE)</p>
                </div>

                <button type="submit" className="w-full md:w-auto h-16 px-12 bg-primary text-white font-black rounded-2xl hover:bg-blue-600 shadow-2xl shadow-primary/40 transition-all transform active:scale-95 text-lg flex items-center justify-center gap-3 group">
                  {isEditing ? 'ATUALIZAR DEMANDA' : 'LANÇAR DEMANDA'}
                  <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">rocket_launch</span>
                </button>
              </div>

            </div>

            <div className="absolute top-0 right-0 size-64 bg-primary/10 rounded-full blur-[100px] -z-0"></div>
          </section>
        </form>
      </div>
    </Layout>
  );
};

export default NewDemandPage;
