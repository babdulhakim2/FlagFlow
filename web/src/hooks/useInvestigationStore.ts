import { create } from 'zustand'

interface Investigation {
  id: string
  transactions: any[]
  status: 'idle' | 'running' | 'completed'
  startTime?: Date
  endTime?: Date
  riskLevel?: 'low' | 'medium' | 'high'
  findings: string[]
}

interface InvestigationStore {
  investigation: Investigation | null
  startInvestigation: (transactions: any[]) => void
  updateInvestigation: (updates: Partial<Investigation>) => void
  resetInvestigation: () => void
}

export const useInvestigationStore = create<InvestigationStore>((set) => ({
  investigation: null,

  startInvestigation: (transactions) => {
    const investigation: Investigation = {
      id: `inv_${Date.now()}`,
      transactions,
      status: 'running',
      startTime: new Date(),
      findings: []
    }
    set({ investigation })
  },

  updateInvestigation: (updates) => set((state) => ({
    investigation: state.investigation
      ? { ...state.investigation, ...updates }
      : null
  })),

  resetInvestigation: () => set({ investigation: null })
}))