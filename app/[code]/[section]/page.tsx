import { notFound } from 'next/navigation';

const VIEWS = new Set(['plan', 'history', 'crew']);

export default async function WorkspaceSectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;

  if (!VIEWS.has(section)) {
    notFound();
  }

  return null;
}
