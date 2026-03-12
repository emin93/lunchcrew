import { LunchCrewApp } from '@/components/LunchCrewApp';

export default async function PlanPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return <LunchCrewApp initialCode={code} initialView="plan" />;
}
