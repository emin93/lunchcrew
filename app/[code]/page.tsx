import { LunchCrewApp } from '@/components/LunchCrewApp';

export default async function TodayPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return <LunchCrewApp initialCode={code} initialView="today" />;
}
