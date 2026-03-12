import { notFound } from 'next/navigation';
import { LunchCrewApp } from '@/components/LunchCrewApp';

type AppView = 'today' | 'plan' | 'history' | 'crew';

const VIEWS = new Set(['plan', 'history', 'crew']);

export default async function AppPage({ params }: { params: Promise<{ code: string; section?: string[] }> }) {
  const { code, section } = await params;
  const current = section?.[0];

  if (section && section.length > 1) {
    notFound();
  }

  if (!current) {
    return <LunchCrewApp initialCode={code} initialView="today" />;
  }

  if (!VIEWS.has(current)) {
    notFound();
  }

  return <LunchCrewApp initialCode={code} initialView={current as AppView} />;
}
