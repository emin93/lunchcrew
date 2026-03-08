import React, { createContext, useContext } from 'react';
import { useAppState } from './AppState';

type AppStateValue = ReturnType<typeof useAppState>;

const AppStateContext = createContext<AppStateValue | null>(null);

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const value = useAppState();
  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppStateContext() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppStateContext must be used inside AppStateProvider');
  return ctx;
}
