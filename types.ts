
export enum DemandStatus {
  ABERTO = 'Aberto',
  EM_ANALISE = 'Em análise',
  FECHADO = 'Fechado'
}

export enum UserRole {
  BUYER = 'buyer',
  SELLER = 'seller',
  BOTH = 'both'
}

export interface Profile {
  id: string;
  name: string;
  email: string;
  rating: number;
  is_premium: boolean;
  avatar_url?: string;
  cnpj?: string;
  company_name?: string;
  website?: string;
  phone?: string;
  bio?: string;
  created_at: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  company?: string;
  verified: boolean;
}

export interface DemandItem {
  id: string;
  description: string;
  unit: 'un' | 'kg' | 'litro' | 'caixa' | 'pacote' | 'outro' | 'Serv' | 'Diaria' | 'Horas' | 'Frete' | 'M' | 'M²' | 'M³';
  quantity: number;
  unitPrice?: number;
  totalPrice: number;
}

export interface Demand {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  deadline: string;
  createdAt: string; // ISO Format
  budget?: string;
  shippingCost?: number;
  status: DemandStatus;
  isPremium: boolean;
  ownerId: string;
  userName?: string;
  ownerCompany?: string;
  ownerCnpj?: string;
  userAvatar?: string;
  offersCount: number;
  tags: string[];
  items?: DemandItem[];
  images?: string[];
}

export interface Offer {
  id: string;
  demandId: string;
  sellerId: string;
  sellerName: string;
  sellerCompany?: string;
  sellerCnpj?: string;
  sellerRating: number;
  sellerReviews: number;
  value: number;
  shippingCost: number;
  deadlineDays: number;
  warrantyMonths: number;
  paymentTerms?: string;
  validUntil?: string;
  message: string;
  verified: boolean;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string; // ISO Format
  items?: DemandItem[];
  pdfUrl?: string;
}

export interface Order {
  id: string;
  demandId: string;
  offerId: string;
  buyerId: string;
  sellerId: string;
  finalPrice: number;
  status: 'ativo' | 'concluido' | 'cancelado';
  createdAt: string;
  orderNumber: number;
  items?: DemandItem[];
}

export interface DemandFilters {
  search: string;
  state: string;
  city: string;
  categories: string[];
  status: string;
}

export interface AppNotification {
  id: string;
  type: 'new_offer' | 'order_accepted';
  title: string;
  message: string;
  link: string;
  createdAt: string;
  read: boolean;
}
