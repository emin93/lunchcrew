import type { useLunchCrewApp } from '@/hooks/useLunchCrewApp';

export type LunchCrewAppModel = ReturnType<typeof useLunchCrewApp>;
export type AppView = 'today' | 'plan' | 'history' | 'crew';
