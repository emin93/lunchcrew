import { Suspense } from 'react';
import { LunchCrewApp } from '@/components/LunchCrewApp';

export default function AppEntryPage() {
  return (
    <Suspense fallback={null}>
      <LunchCrewApp />
    </Suspense>
  );
}
