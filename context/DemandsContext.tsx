
import React, { createContext, useContext, useState, ReactNode, useMemo } from 'react';
import { Demand, DemandFilters, Offer, DemandStatus } from '../types';
import { demands as initialDemands, offers as initialOffers } from '../mockData';

interface DemandsContextType {
  demands: Demand[];
  filteredDemands: Demand[];
  offers: Offer[];
  filters: DemandFilters;
  setFilters: React.Dispatch<React.SetStateAction<DemandFilters>>;
  addDemand: (demand: Demand) => void;
  updateDemand: (demand: Demand) => void;
  deleteDemand: (id: string) => void;
  addOffer: (offer: Offer) => void;
  acceptOffer: (offerId: string) => void;
  rejectOffer: (offerId: string) => void;
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
  const [demands, setDemands] = useState<Demand[]>(initialDemands);
  const [offers, setOffers] = useState<Offer[]>(initialOffers);
  const [filters, setFilters] = useState<DemandFilters>(initialFilters);

  const addDemand = (demand: Demand) => {
    setDemands((prev) => [demand, ...prev]);
  };

  const updateDemand = (updatedDemand: Demand) => {
    setDemands((prev) => prev.map(d => d.id === updatedDemand.id ? updatedDemand : d));
  };

  const deleteDemand = (id: string) => {
    setDemands((prev) => prev.filter(d => d.id !== id));
    setOffers((prev) => prev.filter(o => o.demandId !== id));
  };

  const addOffer = (offer: Offer) => {
    setOffers((prev) => [offer, ...prev]);
    setDemands((prev) => prev.map(d => 
      d.id === offer.demandId ? { ...d, offersCount: d.offersCount + 1 } : d
    ));
  };

  const acceptOffer = (offerId: string) => {
    // 1. Localiza a oferta para obter o ID da demanda
    const selectedOffer = offers.find(o => o.id === offerId);
    if (!selectedOffer) return;

    const targetDemandId = selectedOffer.demandId;

    // 2. Atualiza as ofertas daquela demanda
    setOffers(prevOffers => prevOffers.map(o => {
      if (o.id === offerId) {
        return { ...o, status: 'accepted' };
      }
      if (o.demandId === targetDemandId && o.status === 'pending') {
        return { ...o, status: 'rejected' };
      }
      return o;
    }));

    // 3. Atualiza o status da demanda para FECHADO
    setDemands(prevDemands => prevDemands.map(d => {
      if (d.id === targetDemandId) {
        return { ...d, status: DemandStatus.FECHADO };
      }
      return d;
    }));
  };

  const rejectOffer = (offerId: string) => {
    setOffers((prev) => prev.map(o => 
      o.id === offerId ? { ...o, status: 'rejected' } : o
    ));
  };

  const resetFilters = () => {
    setFilters(initialFilters);
  };

  const filteredDemands = useMemo(() => {
    return demands.filter((demand) => {
      if (filters.search && !demand.title.toLowerCase().includes(filters.search.toLowerCase()) && !demand.id.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }
      if (filters.state && !demand.location.includes(filters.state)) {
        return false;
      }
      if (filters.city && !demand.location.toLowerCase().includes(filters.city.toLowerCase())) {
        return false;
      }
      if (filters.categories.length > 0 && !filters.categories.includes(demand.category)) {
        return false;
      }
      if (filters.status !== 'Todas') {
        const mappedStatus = filters.status === 'Abertas' ? 'Aberto' : 'Em análise';
        if (demand.status !== mappedStatus) return false;
      }
      return true;
    });
  }, [demands, filters]);

  return (
    <DemandsContext.Provider value={{ demands, filteredDemands, offers, filters, setFilters, addDemand, updateDemand, deleteDemand, addOffer, acceptOffer, rejectOffer, resetFilters }}>
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
