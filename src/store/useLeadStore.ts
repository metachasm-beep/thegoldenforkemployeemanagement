import { create } from "zustand";
import { Lead } from "@/types";

interface LeadState {
  leads: Lead[];
  isLoading: boolean;
  
  setLeads: (leads: Lead[]) => void;
  updateLeadOptimistic: (id: string, updates: Partial<Lead>) => void;
  addLeadOptimistic: (lead: Lead) => void;
  deleteLeadOptimistic: (id: string) => void;
}

export const useLeadStore = create<LeadState>((set) => ({
  leads: [],
  isLoading: false,

  setLeads: (leads) => set({ leads }),
  
  updateLeadOptimistic: (id, updates) => set((state) => ({
    leads: state.leads.map(lead => lead.id === id ? { ...lead, ...updates } as Lead : lead)
  })),

  addLeadOptimistic: (lead) => set((state) => ({
    leads: [lead, ...state.leads]
  })),

  deleteLeadOptimistic: (id) => set((state) => ({
    leads: state.leads.filter(lead => lead.id !== id)
  }))
}));

