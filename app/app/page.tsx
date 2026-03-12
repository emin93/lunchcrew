import { LunchCrewApp } from '@/components/LunchCrewApp';

export default async function AppPage({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
  const { code } = await searchParams;
  return <LunchCrewApp initialCode={code} />;
}
