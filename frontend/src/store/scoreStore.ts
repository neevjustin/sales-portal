// ==============================================================================
// File: frontend/src/store/scoreStore.ts (Corrected)
// ==============================================================================
import { create } from 'zustand';

interface ScoreState {
  totalScore: number | null;
  setTotalScore: (score: number) => void;
  initializeScore: (score: number) => void;
  resetScore: () => void; // <-- ADD THIS LINE
}

export const useScoreStore = create<ScoreState>((set) => ({
  totalScore: null,
  setTotalScore: (score) => set({ totalScore: score }),
  initializeScore: (score) => {
    set((state) => {
      if (state.totalScore === null) {
        return { totalScore: score };
      }
      return state;
    });
  },
  // --- ADD THIS FUNCTION ---
  resetScore: () => set({ totalScore: null }),
}));