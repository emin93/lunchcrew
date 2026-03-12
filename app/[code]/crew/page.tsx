import { LunchCrewApp } from '@/components/LunchCrewApp';

export default async function CrewPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return <LunchCrewApp initialCode={code} initialView="crew" />;
}
