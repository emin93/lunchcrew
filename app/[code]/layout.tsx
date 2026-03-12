import { LunchCrewApp } from '@/components/LunchCrewApp';

export default async function WorkspaceLayout({ params }: { params: Promise<{ code: string }>; children: React.ReactNode }) {
  const { code } = await params;
  return <LunchCrewApp initialCode={code} />;
}
