
import { Demand, DemandStatus, User, UserRole, Offer } from './types';

export const BR_STATES = [
  { uf: 'AC', name: 'Acre' }, { uf: 'AL', name: 'Alagoas' }, { uf: 'AP', name: 'Amapá' },
  { uf: 'AM', name: 'Amazonas' }, { uf: 'BA', name: 'Bahia' }, { uf: 'CE', name: 'Ceará' },
  { uf: 'DF', name: 'Distrito Federal' }, { uf: 'ES', name: 'Espírito Santo' },
  { uf: 'GO', name: 'Goiás' }, { uf: 'MA', name: 'Maranhão' }, { uf: 'MT', name: 'Mato Grosso' },
  { uf: 'MS', name: 'Mato Grosso do Sul' }, { uf: 'MG', name: 'Minas Gerais' },
  { uf: 'PA', name: 'Pará' }, { uf: 'PB', name: 'Paraíba' }, { uf: 'PR', name: 'Paraná' },
  { uf: 'PE', name: 'Pernambuco' }, { uf: 'PI', name: 'Piauí' }, { uf: 'RJ', name: 'Rio de Janeiro' },
  { uf: 'RN', name: 'Rio Grande do Norte' }, { uf: 'RS', name: 'Rio Grande do Sul' },
  { uf: 'RO', name: 'Rondônia' }, { uf: 'RR', name: 'Roraima' }, { uf: 'SC', name: 'Santa Catarina' },
  { uf: 'SP', name: 'São Paulo' }, { uf: 'SE', name: 'Sergipe' }, { uf: 'TO', name: 'Tocantins' }
].sort((a, b) => a.name.localeCompare(b.name));

export const CATEGORIES = [
  "Produtos", "Serviços", "Veículos & Peças", "Imóveis & Terrenos",
  "Casa, Obras & Construção", "Indústria, Máquinas & Insumos",
  "Moda, Beleza & Cuidados Pessoais", "Tecnologia & Eletrônicos",
  "Agro, Rural & Campo", "Saúde, Bem-estar & Fitness",
  "Educação, Cursos & Treinamentos", "Empregos & Oportunidades",
  "Eventos, Lazer & Entertainment", "Pets & Animais",
  "Alimentos & Bebidas", "Negócios & Atacado", "Outros"
];

export const currentUser: User = {
  id: 'user-1',
  name: 'João Silva',
  email: 'joao.silva@exemplo.com',
  role: UserRole.BOTH,
  avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=200&auto=format&fit=crop',
  company: 'JS Soluções Comerciais LTDA',
  verified: true
};

const now = new Date();
const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

export const demands: Demand[] = [
  // --- SITUAÇÃO 1: MINHAS DEMANDAS COM OFERTAS RECEBIDAS ---
  {
    id: 'DEM-001',
    title: 'Lote de Monitores 27 polegadas 4K para Agência',
    description: 'Necessitamos de 15 unidades de monitores 4K para nossa equipe de design. Preferência por marcas como Dell, LG ou Samsung.',
    category: 'Tecnologia & Eletrônicos',
    location: 'São Paulo, SP',
    deadline: '15/06/2024',
    createdAt: yesterday.toISOString(),
    budget: 'R$ 35.000',
    status: DemandStatus.ABERTO,
    isPremium: true,
    ownerId: 'user-1',
    offersCount: 2,
    tags: ['Hardware', 'Design'],
    images: ['https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?q=80&w=800&auto=format&fit=crop'],
    items: [{ id: 'item-1', description: 'Monitor 27" 4K IPS', unit: 'un', quantity: 15, unitPrice: 2300, totalPrice: 34500 }]
  },
  {
    id: 'DEM-002',
    title: 'Reforma de Fachada Comercial - 200m²',
    description: 'Contratação de empresa para reforma de fachada em ACM e iluminação em LED.',
    category: 'Casa, Obras & Construção',
    location: 'Curitiba, PR',
    deadline: '01/07/2024',
    createdAt: lastWeek.toISOString(),
    budget: 'R$ 12.000',
    status: DemandStatus.EM_ANALISE,
    isPremium: false,
    ownerId: 'user-1',
    offersCount: 1,
    tags: ['Reforma', 'Fachada'],
    items: [{ id: 'item-2', description: 'Instalação de ACM', unit: 'M²', quantity: 200, unitPrice: 60, totalPrice: 12000 }]
  },
  {
    id: 'DEM-003',
    title: 'Projeto de Identidade Visual Corporativa',
    description: 'Redesign completo de marca para holding do agronegócio.',
    category: 'Serviços',
    location: 'Goiânia, GO',
    deadline: '20/07/2024',
    createdAt: now.toISOString(),
    budget: 'R$ 8.500',
    status: DemandStatus.ABERTO,
    isPremium: false,
    ownerId: 'user-1',
    offersCount: 3,
    tags: ['Branding', 'Design'],
    items: [{ id: 'item-3', description: 'Criação de Logo e Manual', unit: 'Serv', quantity: 1, unitPrice: 8500, totalPrice: 8500 }]
  },
  {
    id: 'DEM-004',
    title: 'Manutenção Preventiva de Ar Condicionado (10 un)',
    description: 'Serviço de limpeza e carga de gás em 10 máquinas Split de 12.000 BTUs.',
    category: 'Serviços',
    location: 'Rio de Janeiro, RJ',
    deadline: '05/06/2024',
    createdAt: yesterday.toISOString(),
    budget: 'R$ 2.500',
    status: DemandStatus.ABERTO,
    isPremium: false,
    ownerId: 'user-1',
    offersCount: 2,
    tags: ['Manutenção', 'HVAC'],
    items: [{ id: 'item-4', description: 'Manutenção Split 12k', unit: 'un', quantity: 10, unitPrice: 250, totalPrice: 2500 }]
  },
  {
    id: 'DEM-005',
    title: 'Consultoria para Implementação de CRM',
    description: 'Busco especialista em Salesforce ou HubSpot para configurar funil de vendas B2B.',
    category: 'Tecnologia & Eletrônicos',
    location: 'São Paulo, SP',
    deadline: '30/06/2024',
    createdAt: lastWeek.toISOString(),
    budget: 'R$ 15.000',
    status: DemandStatus.ABERTO,
    isPremium: true,
    ownerId: 'user-1',
    offersCount: 1,
    tags: ['CRM', 'Vendas'],
    items: [{ id: 'item-5', description: 'Implementação CRM', unit: 'Serv', quantity: 1, unitPrice: 15000, totalPrice: 15000 }]
  },

  // --- SITUAÇÃO 2: DEMANDAS DE OUTROS USUÁRIOS ---
  {
    id: 'DEM-006',
    title: 'Aquisição de Fertilizante NPK 10-10-10 (5 Ton)',
    description: 'Lote fechado de fertilizante para plantio de safra de milho.',
    category: 'Agro, Rural & Campo',
    location: 'Ribeirão Preto, SP',
    deadline: '10/06/2024',
    createdAt: now.toISOString(),
    budget: 'R$ 18.000',
    status: DemandStatus.ABERTO,
    isPremium: true,
    ownerId: 'user-99',
    offersCount: 0,
    tags: ['Agro', 'Insumos'],
    images: ['https://images.unsplash.com/photo-1586771107445-d3ca888129ff?q=80&w=800&auto=format&fit=crop']
  },
  {
    id: 'DEM-007',
    title: 'Desenvolvimento de App Mobile Delivery',
    description: 'MVP de aplicativo para entrega de bebidas de nicho.',
    category: 'Tecnologia & Eletrônicos',
    location: 'Florianópolis, SC',
    deadline: '30/08/2024',
    createdAt: yesterday.toISOString(),
    budget: 'R$ 25.000',
    status: DemandStatus.ABERTO,
    isPremium: false,
    ownerId: 'user-100',
    offersCount: 1,
    tags: ['Software', 'App']
  },
  {
    id: 'DEM-008',
    title: 'Segurança Privada para Evento (3 dias)',
    description: 'Necessário 4 vigilantes desarmados para feira tecnológica.',
    category: 'Serviços',
    location: 'Porto Alegre, RS',
    deadline: '20/06/2024',
    createdAt: lastWeek.toISOString(),
    budget: 'R$ 4.200',
    status: DemandStatus.ABERTO,
    isPremium: false,
    ownerId: 'user-101',
    offersCount: 2,
    tags: ['Eventos', 'Segurança']
  },
  {
    id: 'DEM-009',
    title: 'Fornecimento de Marmitas Corporativas (50/dia)',
    description: 'Contrato mensal para fornecimento de almoço para funcionários de obra.',
    category: 'Alimentos & Bebidas',
    location: 'Belo Horizonte, MG',
    deadline: '01/06/2024',
    createdAt: yesterday.toISOString(),
    budget: 'R$ 18.000',
    status: DemandStatus.EM_ANALISE,
    isPremium: true,
    ownerId: 'user-102',
    offersCount: 5,
    tags: ['Alimentação', 'Contrato']
  },
  {
    id: 'DEM-010',
    title: 'Transporte de Carga Fechada (Caminhão Baú)',
    description: 'Frete de Campinas para Brasília. Carga: Equipamentos Eletrônicos.',
    category: 'Outros',
    location: 'Campinas, SP',
    deadline: '05/06/2024',
    createdAt: now.toISOString(),
    budget: 'R$ 6.500',
    status: DemandStatus.ABERTO,
    isPremium: false,
    ownerId: 'user-103',
    offersCount: 1,
    tags: ['Logística', 'Frete']
  },

  // --- SITUAÇÃO 3: DEMANDAS QUE EU ACEITEI A OFERTA (NEGÓCIO FECHADO) ---
  {
    id: 'DEM-011',
    title: 'Notebooks Dell Latitude (Lote 5 un)',
    description: 'Compra de notebooks para novos colaboradores da área de RH.',
    category: 'Tecnologia & Eletrônicos',
    location: 'São Paulo, SP',
    deadline: '20/05/2024',
    createdAt: lastMonth.toISOString(),
    budget: 'R$ 25.000',
    status: DemandStatus.FECHADO,
    isPremium: true,
    ownerId: 'user-1',
    offersCount: 4,
    // Fix: Add missing tags property required by Demand interface
    tags: ['Hardware', 'Notebooks'],
    items: [{ id: 'item-11', description: 'Notebook Dell Latitude 3440', unit: 'un', quantity: 5, unitPrice: 4800, totalPrice: 24000 }]
  },
  {
    id: 'DEM-012',
    title: 'Móveis Planejados para Escritório',
    description: 'Criação de 4 estações de trabalho e mesa de reunião.',
    category: 'Casa, Obras & Construção',
    location: 'Curitiba, PR',
    deadline: '10/05/2024',
    createdAt: lastMonth.toISOString(),
    budget: 'R$ 10.000',
    status: DemandStatus.FECHADO,
    isPremium: false,
    ownerId: 'user-1',
    offersCount: 2,
    // Fix: Add missing tags property required by Demand interface
    tags: ['Móveis', 'Escritório'],
    items: [{ id: 'item-12', description: 'Estação de Trabalho 4 Lugares', unit: 'un', quantity: 1, unitPrice: 9500, totalPrice: 9500 }]
  }
];

export const offers: Offer[] = [
  // Ofertas para DEM-001 (Monitores)
  {
    id: 'OFF-101', demandId: 'DEM-001', sellerId: 'seller-tech', sellerName: 'Tech Central', 
    sellerRating: 4.8, sellerReviews: 89, value: 33500, shippingCost: 0, deadlineDays: 3, 
    warrantyMonths: 12, message: 'Pronta entrega de monitores Dell.', verified: true, 
    status: 'pending', createdAt: now.toISOString()
  },
  {
    id: 'OFF-102', demandId: 'DEM-001', sellerId: 'seller-it', sellerName: 'IT Distribuidora', 
    sellerRating: 4.2, sellerReviews: 12, value: 32000, shippingCost: 200, deadlineDays: 7, 
    warrantyMonths: 6, message: 'Preço especial para pagamento à vista.', verified: false, 
    status: 'pending', createdAt: yesterday.toISOString()
  },

  // Minhas ofertas enviadas para demandas de terceiros
  {
    id: 'OFF-MY-1', demandId: 'DEM-007', sellerId: 'user-1', sellerName: 'JS Soluções Comerciais', 
    sellerRating: 5.0, sellerReviews: 10, value: 22000, shippingCost: 0, deadlineDays: 30, 
    warrantyMonths: 12, message: 'Especialista em React Native.', verified: true, 
    status: 'pending', createdAt: now.toISOString()
  },
  {
    id: 'OFF-MY-2', demandId: 'DEM-008', sellerId: 'user-1', sellerName: 'JS Soluções Comerciais', 
    sellerRating: 5.0, sellerReviews: 10, value: 4000, shippingCost: 0, deadlineDays: 3, 
    warrantyMonths: 0, message: 'Temos equipe disponível para as datas.', verified: true, 
    status: 'pending', createdAt: yesterday.toISOString()
  },
  {
    id: 'OFF-MY-3', demandId: 'DEM-010', sellerId: 'user-1', sellerName: 'JS Soluções Comerciais', 
    sellerRating: 5.0, sellerReviews: 10, value: 6200, shippingCost: 0, deadlineDays: 2, 
    warrantyMonths: 0, message: 'Caminhão baú disponível com rastreamento.', verified: true, 
    status: 'pending', createdAt: now.toISOString()
  },

  // Ofertas Aceitas (Geraram pedidos)
  {
    id: 'OFF-ACC-1', demandId: 'DEM-011', sellerId: 'dell-direct', sellerName: 'Dell Brasil Oficial', 
    sellerRating: 4.9, sellerReviews: 1500, value: 24000, shippingCost: 0, deadlineDays: 5, 
    warrantyMonths: 36, message: 'Oferta direta de fábrica.', verified: true, 
    status: 'accepted', createdAt: lastMonth.toISOString(),
    items: [{ id: 'item-11', description: 'Notebook Dell Latitude 3440', unit: 'un', quantity: 5, unitPrice: 4800, totalPrice: 24000 }]
  },
  {
    id: 'OFF-ACC-2', demandId: 'DEM-012', sellerId: 'moveis-curitiba', sellerName: 'Art Móveis Curitiba', 
    sellerRating: 4.5, sellerReviews: 45, value: 9500, shippingCost: 200, deadlineDays: 15, 
    warrantyMonths: 12, message: 'Podemos instalar no próximo sábado.', verified: true, 
    status: 'accepted', createdAt: lastMonth.toISOString(),
    items: [{ id: 'item-12', description: 'Estação de Trabalho 4 Lugares', unit: 'un', quantity: 1, unitPrice: 9300, totalPrice: 9300 }]
  }
];
