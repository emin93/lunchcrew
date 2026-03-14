import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

const VIEW_TITLES: Record<string, string> = {
  plan: 'Plan',
  history: 'History',
  crew: 'Crew',
};
const VIEWS = new Set(Object.keys(VIEW_TITLES));

export async function generateMetadata({ params }: { params: Promise<{ code: string; section: string }> }): Promise<Metadata> {
  const { code, section } = await params;
  const title = VIEW_TITLES[section];
  if (!title) {
    return { title: 'LunchCrew' };
  }
  return {
    title: `${title} · ${code} · LunchCrew`,
  };
}

export default async function WorkspaceSectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;

  if (!VIEWS.has(section)) {
    notFound();
  }

  return null;
}
