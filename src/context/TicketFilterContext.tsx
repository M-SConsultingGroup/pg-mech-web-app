'use client';

import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

interface TicketFilterContextType {
  statusFilter: string;
  setStatusFilter: (filter: string) => void;
  assignedToFilter: string;
  setAssignedToFilter: (filter: string) => void;
  searchBarFilter: string | null;
  setSearchBarFilter: (filter: string | null) => void;
  highlightedTicket: string | null;
  setHighlightedTicket: (id: string | null) => void;
}

const TicketFilterContext = createContext<TicketFilterContextType | undefined>(undefined);

export const TicketFilterProvider = ({ children }: { children: ReactNode }) => {
  const { isAdmin, username, isPermissionsLoading } = useAuth();
  const [searchBarFilter, setSearchBarFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [assignedToFilter, setAssignedToFilter] = useState<string>('');
  const [highlightedTicket, setHighlightedTicket] = useState<string | null>(null);

  useEffect(() => {
    if (!isPermissionsLoading) {
      setStatusFilter(isAdmin ? 'New' : 'Open');
      setAssignedToFilter(isAdmin ? '' : username);
    }
  }, [isAdmin, username, isPermissionsLoading]);

  return (
    <TicketFilterContext.Provider value={{
      statusFilter,
      setStatusFilter,
      assignedToFilter,
      setAssignedToFilter,
      highlightedTicket,
      setHighlightedTicket,
      searchBarFilter,
      setSearchBarFilter
    }}>
      {children}
    </TicketFilterContext.Provider>
  );
};

export const useTicketFilters = () => {
  const context = useContext(TicketFilterContext);
  if (!context) {
    throw new Error('useTicketFilters must be used within a TicketFilterProvider');
  }
  return context;
};