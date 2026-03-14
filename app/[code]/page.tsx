import type { Metadata } from 'next';

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }): Promise<Metadata> {
  const { code } = await params;
  return {
    title: `Today · ${code} · LunchCrew`,
  };
}

export default function WorkspaceTodayPage() {
  return null;
}
