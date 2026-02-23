

import React, { createContext, useContext, useState, ReactNode, useMemo, useEffect } from 'react';
import { Demand, DemandFilters, Offer, DemandStatus, DemandItem, Order, AppNotification } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface DemandsContextType {
  demands: Demand[];
  filteredDemands: Demand[];
  offers: Offer[];
  orders: Order[];
  notifications: AppNotification[];
  filters: DemandFilters;
  isLoading: boolean;
  setFilters: React.Dispatch<React.SetStateAction<DemandFilters>>;
  markNotificationsAsRead: () => void;
  addDemand: (demand: Demand) => Promise<void>;
  updateDemand: (demand: Demand) => Promise<void>;
  deleteDemand: (id: string) => Promise<void>;
  addOffer: (offer: Offer) => Promise<void>;
  acceptOffer: (offerId: string, selectedItemIds?: string[]) => Promise<string | void>;
  rejectOffer: (offerId: string) => Promise<void>;
  resetFilters: () => void;
}

const initialFilters: DemandFilters = {
  search: '',
  state: '',
  city: '',
  categories: [],
  status: 'Todas'
};

const DemandsContext = createContext<DemandsContextType | undefined>(undefined);

export const DemandsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [demands, setDemands] = useState<Demand[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [filters, setFilters] = useState<DemandFilters>(initialFilters);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch data from Supabase
  useEffect(() => {
    const fetchData = async () => {
      console.log('DemandsContext: Starting fetchData...');
      setIsLoading(true);
      try {
        console.log('DemandsContext: Using Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
        // Fetch Demands
        const { data: demandsData, error: demandsError } = await supabase
          .from('demands')
          .select('*, demand_items(*), owner:profiles(name, company_name, cnpj)')
          .order('created_at', { ascending: false });

        if (demandsError) throw demandsError;
        console.log('DemandsContext: Fetched demandsData:', demandsData);

        // Transform database data to frontend Demand type
        const transformedDemands: Demand[] = (demandsData || []).map(d => ({
          id: d.id.toString(),
          title: d.title || 'Sem título',
          description: d.description || '',
          category: d.category || '',
          location: d.location || '',
          deadline: d.need_date ? d.need_date.split('-').reverse().join('/') : '',
          createdAt: d.created_at,
          budget: d.estimated_price ? `R$ ${d.estimated_price.toLocaleString('pt-BR')}` : 'Sob consulta',
          status: d.status === 'aberto' ? DemandStatus.ABERTO :
            d.status === 'analise' ? DemandStatus.EM_ANALISE : DemandStatus.FECHADO,
          isPremium: false,
          ownerId: d.user_id,
          userName: d.owner?.name,
          ownerCompany: d.owner?.company_name,
          ownerCnpj: d.owner?.cnpj,
          offersCount: 0,
          tags: d.category ? [d.category] : [],
          items: (d.demand_items || []).map((item: any) => ({
            id: item.id,
            description: item.name,
            unit: item.unit,
            quantity: item.quantity,
            unitPrice: item.desired_unit_price,
            totalPrice: item.total_price
          })),
          images: d.images || []
        }));

        setDemands(transformedDemands);

        // Fetch Offers
        const { data: offersData, error: offersError } = await supabase
          .from('offers')
          .select(`
            *,
            seller:profiles(name, rating, company_name, cnpj),
            items:offer_items(*)
          `)
          .order('created_at', { ascending: false });

        if (offersError) throw offersError;

        // Transform database data to frontend Offer type
        const transformedOffers: Offer[] = (offersData || []).map(o => ({
          id: o.id,
          demandId: o.demand_id,
          sellerId: o.seller_id,
          sellerName: o.seller?.name || 'Fornecedor',
          sellerCompany: o.seller?.company_name,
          sellerCnpj: o.seller?.cnpj,
          sellerRating: o.seller?.rating || 5.0,
          sellerReviews: 0,
          value: o.total_price,
          shippingCost: o.shipping_cost || 0,
          deadlineDays: parseInt(o.delivery_time) || 0,
          warrantyMonths: o.warranty_months || 0,
          paymentTerms: o.payment_terms || '',
          validUntil: o.valid_until || '',
          message: o.message || '',
          verified: false,
          status: o.status === 'aceita' ? 'accepted' :
            o.status === 'rejeitada' ? 'rejected' : 'pending',
          createdAt: o.created_at,
          pdfUrl: o.pdf_url,
          items: (o.items || []).map((item: any) => ({
            id: item.id,
            description: item.name,
            unit: item.unit,
            quantity: item.quantity,
            unitPrice: item.unit_price,
            totalPrice: item.total_price
          }))
        }));

        setOffers(transformedOffers);

        // Fetch Orders
        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select('*, order_items(*)')
          .order('created_at', { ascending: false });

        if (ordersError) throw ordersError;

        const transformedOrders: Order[] = (ordersData || []).map(o => ({
          id: o.id.toString(),
          demandId: o.demand_id.toString(),
          offerId: o.offer_id.toString(),
          buyerId: o.buyer_id,
          sellerId: o.seller_id,
          finalPrice: o.final_price,
          status: o.status === 'ativo' ? 'ativo' : o.status === 'concluido' ? 'concluido' : 'cancelado',
          createdAt: o.created_at,
          orderNumber: o.order_number,
          items: (o.order_items || []).map((oi: any) => ({
            id: oi.offer_item_id?.toString(), // Map correctly to the offer item ID for cross-reference
            description: oi.description,
            unit: oi.unit,
            quantity: oi.quantity,
            unitPrice: oi.unit_price,
            totalPrice: oi.total_price
          }))
        }));

        setOrders(transformedOrders);

        // Optional: Update offersCount for demands
        setDemands(prev => prev.map(d => ({
          ...d,
          offersCount: transformedOffers.filter(o => o.demandId === d.id).length
        })));

      } catch (error) {
        console.error('Error fetching data from Supabase:', error);
        // Fallback to mock data if there's an error (optional, maybe better to show empty state)
        // setDemands(initialDemands);
        // setOffers(initialOffers);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const addDemand = async (demand: Demand) => {
    try {
      // 1. Insert Demand
      const { data: demandInsert, error: demandError } = await supabase
        .from('demands')
        .insert({
          title: demand.title,
          description: demand.description,
          category: demand.category,
          location: demand.location,
          need_date: demand.deadline.split('/').reverse().join('-'),
          estimated_price: demand.items?.reduce((acc, curr) => acc + curr.totalPrice, 0) || 0,
          status: 'aberto',
          user_id: user?.id,
          images: demand.images || []
        })
        .select()
        .single();

      console.log('!!! ADD DEMAND ATTEMPT !!!', { demand, userId: user?.id });
      console.log('Insert Attempt Result:', { demandInsert, demandError });

      if (demandError) {
        console.error('Supabase Insert Error:', demandError);
        throw new Error(demandError.message);
      }

      // 2. Insert Items
      if (demand.items && demand.items.length > 0) {
        const itemsToInsert = demand.items.map(item => ({
          demand_id: demandInsert.id,
          name: item.description,
          unit: item.unit,
          quantity: item.quantity,
          desired_unit_price: item.unitPrice,
          total_price: item.totalPrice
        }));

        const { error: itemsError } = await supabase
          .from('demand_items')
          .insert(itemsToInsert);

        if (itemsError) throw itemsError;
      }

      // 3. Update local state
      const newDemand = { ...demand, id: demandInsert.id, ownerId: user?.id || '' };
      setDemands((prev) => [newDemand, ...prev]);

    } catch (error) {
      console.error('Error adding demand:', error);
      throw error;
    }
  };

  const updateDemand = async (updatedDemand: Demand) => {
    try {
      // 1. Update Demand
      const { error: demandError } = await supabase
        .from('demands')
        .update({
          title: updatedDemand.title,
          description: updatedDemand.description,
          category: updatedDemand.category,
          location: updatedDemand.location,
          need_date: updatedDemand.deadline.split('/').reverse().join('-'),
          estimated_price: updatedDemand.items?.reduce((acc, curr) => acc + curr.totalPrice, 0) || 0,
          images: updatedDemand.images || []
        })
        .eq('id', updatedDemand.id);

      if (demandError) throw demandError;

      // 2. Update Items (Complex: simpler to delete and re-insert or just update local state if persistence isn't 100% required for items edit yet)
      // For now, let's just sync local state
      setDemands((prev) => prev.map(d => d.id === updatedDemand.id ? updatedDemand : d));

    } catch (error) {
      console.error('Error updating demand:', error);
      throw error;
    }
  };

  const deleteDemand = async (id: string) => {
    try {
      const { error } = await supabase.from('demands').delete().eq('id', id);
      if (error) throw error;

      setDemands((prev) => prev.filter(d => d.id !== id));
      setOffers((prev) => prev.filter(o => o.demandId !== id));
    } catch (error) {
      console.error('Error deleting demand:', error);
      throw error;
    }
  };

  const addOffer = async (offer: Offer) => {
    try {
      const { data: offerData, error } = await supabase
        .from('offers')
        .insert({
          demand_id: offer.demandId,
          seller_id: user?.id,
          total_price: offer.value,
          delivery_time: offer.deadlineDays.toString(),
          shipping_cost: offer.shippingCost,
          warranty_months: offer.warrantyMonths,
          payment_terms: offer.paymentTerms,
          valid_until: offer.validUntil || null,
          message: offer.message,
          pdf_url: offer.pdfUrl,
          status: 'enviada'
        })
        .select()
        .single();

      if (error) throw error;

      // 2. Insert Offer Items
      if (offer.items && offer.items.length > 0) {
        const itemsToInsert = offer.items.map(item => ({
          offer_id: offerData.id,
          name: item.description,
          unit: item.unit,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          total_price: item.totalPrice
        }));

        const { error: itemsError } = await supabase
          .from('offer_items')
          .insert(itemsToInsert);

        if (itemsError) throw itemsError;
      }

      const newOffer = { ...offer, id: offerData.id };
      setOffers((prev) => [newOffer, ...prev]);
      setDemands((prev) => prev.map(d =>
        d.id === offer.demandId ? { ...d, offersCount: d.offersCount + 1 } : d
      ));
    } catch (error) {
      console.error('Error adding offer:', error);
      throw error;
    }
  };

  const acceptOffer = async (offerId: string, selectedItemIds?: string[]) => {
    try {
      const selectedOffer = offers.find(o => o.id === offerId);
      if (!selectedOffer) return;

      const targetDemandId = selectedOffer.demandId;
      const itemsToOrder = selectedItemIds
        ? selectedOffer.items?.filter(item => selectedItemIds.includes(item.id))
        : selectedOffer.items;

      if (!itemsToOrder || itemsToOrder.length === 0) {
        throw new Error("Nenhum item selecionado para o pedido.");
      }

      const orderTotal = itemsToOrder.reduce((acc, curr) => acc + curr.totalPrice, 0);

      // Create Order in DB
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          demand_id: targetDemandId,
          offer_id: offerId,
          buyer_id: user?.id,
          seller_id: selectedOffer.sellerId,
          final_price: orderTotal,
          status: 'ativo'
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create Order Items
      const orderItemsInsert = itemsToOrder.map(item => ({
        order_id: orderData.id,
        offer_item_id: item.id,
        description: item.description,
        unit: item.unit,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        total_price: item.totalPrice
      }));

      const { error: oiError } = await supabase
        .from('order_items')
        .insert(orderItemsInsert);

      if (oiError) throw oiError;

      // Update offer status if all items accepted (optional logic, for now mark as accepted)
      // Check if all items of the demand are now in an order
      const demand = demands.find(d => d.id === targetDemandId);
      const allItemsCount = demand?.items?.length || 0;

      // Calculate how many items are already in other orders for this demand
      const existingOrdersForDemand = orders.filter(ord => ord.demandId === targetDemandId);
      const alreadyOrderedItemDescriptions = new Set();
      existingOrdersForDemand.forEach(ord => ord.items?.forEach(item => alreadyOrderedItemDescriptions.add(item.description)));
      itemsToOrder.forEach(item => alreadyOrderedItemDescriptions.add(item.description));

      const isFullyAccepted = alreadyOrderedItemDescriptions.size >= allItemsCount;

      // Mark THIS offer as accepted as soon as we have an order
      await supabase.from('offers').update({ status: 'aceita' }).eq('id', offerId);

      if (isFullyAccepted) {
        // Only reject OTHER offers if all items of the demand are now fulfilled
        await supabase.from('offers')
          .update({ status: 'rejeitada' })
          .eq('demand_id', targetDemandId)
          .neq('id', offerId)
          .eq('status', 'enviada');

        await supabase.from('demands').update({ status: 'fechado' }).eq('id', targetDemandId);
      }

      const newOrder: Order = {
        id: orderData.id,
        demandId: orderData.demand_id,
        offerId: orderData.offer_id,
        buyerId: orderData.buyer_id,
        sellerId: orderData.seller_id,
        finalPrice: orderData.final_price,
        status: 'ativo',
        createdAt: orderData.created_at,
        orderNumber: orderData.order_number,
        items: itemsToOrder
      };

      // Update local state
      setOrders(prev => [newOrder, ...prev]);

      // Update local state for THIS offer
      setOffers(prevOffers => prevOffers.map(o => {
        if (o.id === offerId) return { ...o, status: 'accepted' };
        if (isFullyAccepted && o.demandId === targetDemandId && o.status === 'pending') {
          return { ...o, status: 'rejected' };
        }
        return o;
      }));

      if (isFullyAccepted) {
        setDemands(prevDemands => prevDemands.map(d => {
          if (d.id === targetDemandId) return { ...d, status: DemandStatus.FECHADO };
          return d;
        }));
      }
      return orderData.id;

    } catch (error) {
      console.error('Error accepting offer:', error);
      throw error;
    }
  };

  const rejectOffer = async (offerId: string) => {
    try {
      await supabase.from('offers').update({ status: 'rejeitada' }).eq('id', offerId);
      setOffers((prev) => prev.map(o => o.id === offerId ? { ...o, status: 'rejected' } : o));
    } catch (error) {
      console.error('Error rejecting offer:', error);
      throw error;
    }
  };

  const resetFilters = () => {
    setFilters(initialFilters);
  };

  const [lastReadTimestamp, setLastReadTimestamp] = useState<number>(() => {
    try {
      return Number(localStorage.getItem('last_read_notifications') || 0);
    } catch (e) {
      console.warn('Failed to access localStorage:', e);
      return 0;
    }
  });

  const markNotificationsAsRead = () => {
    const now = Date.now();
    setLastReadTimestamp(now);
    try {
      localStorage.setItem('last_read_notifications', now.toString());
    } catch (e) {
      console.warn('Failed to save to localStorage:', e);
    }
  };

  const notifications = useMemo(() => {
    if (!user) return [];
    const list: AppNotification[] = [];

    // 1. New offers on my demands
    const userDemands = demands.filter(d => d.ownerId === user.id);
    const userDemandIds = userDemands.map(d => d.id);

    offers.forEach(o => {
      if (userDemandIds.includes(o.demandId) && o.sellerId !== user.id) {
        list.push({
          id: `offer-${o.id}`,
          type: 'new_offer',
          title: 'Nova Oferta Recebida',
          message: `Você recebeu uma nova oferta na demanda: ${userDemands.find(d => d.id === o.demandId)?.title}`,
          link: `/demanda/${o.demandId}`,
          createdAt: o.createdAt,
          read: new Date(o.createdAt).getTime() <= lastReadTimestamp
        });
      }
    });

    // 2. Orders for my offers (I'm the seller)
    orders.forEach(ord => {
      if (ord.sellerId === user.id) {
        list.push({
          id: `order-${ord.id}`,
          type: 'order_accepted',
          title: 'Venda Confirmada!',
          message: `O comprador aceitou sua oferta! Pedido #${(ord.orderNumber || 0).toString().padStart(4, '0')}`,
          link: `/pedido/${ord.id}`,
          createdAt: ord.createdAt,
          read: new Date(ord.createdAt).getTime() <= lastReadTimestamp
        });
      }
    });

    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [demands, offers, orders, user, lastReadTimestamp]);

  const filteredDemands = useMemo(() => {
    return demands.filter((demand) => {
      const searchLower = filters.search.toLowerCase();
      const titleLower = (demand.title || '').toLowerCase();
      const idLower = (demand.id || '').toString().toLowerCase();
      const locationLower = (demand.location || '').toLowerCase();

      if (filters.search && !titleLower.includes(searchLower) && !idLower.includes(searchLower)) {
        return false;
      }
      if (filters.state && !locationLower.includes(filters.state.toLowerCase())) {
        return false;
      }
      if (filters.city && !locationLower.includes(filters.city.toLowerCase())) {
        return false;
      }
      if (filters.categories.length > 0 && !filters.categories.includes(demand.category)) {
        return false;
      }
      if (filters.status !== 'Todas') {
        const mappedStatus = filters.status === 'Abertas' ? DemandStatus.ABERTO : DemandStatus.EM_ANALISE;
        if (demand.status !== mappedStatus) return false;
      }
      return true;
    });
  }, [demands, filters]);

  return (
    <DemandsContext.Provider value={{ demands, filteredDemands, offers, orders, notifications, filters, isLoading, setFilters, markNotificationsAsRead, addDemand, updateDemand, deleteDemand, addOffer, acceptOffer, rejectOffer, resetFilters }}>
      {children}
    </DemandsContext.Provider>
  );
};

export const useDemands = () => {
  const context = useContext(DemandsContext);
  if (!context) {
    throw new Error('useDemands must be used within a DemandsProvider');
  }
  return context;
};
