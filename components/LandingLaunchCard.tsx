'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { Button, Card, Input } from '@/components/ui';
import { extractInviteCode, generateInviteCode, workspacePath } from '@/lib/helpers';
import { supabase } from '@/lib/supabase';

export function LandingLaunchCard() {
  const router = useRouter();
  const [joinInput, setJoinInput] = useState('');
  const [loading, setLoading] = useState(false);
  const parsedCode = useMemo(() => extractInviteCode(joinInput), [joinInput]);

  async function createCrew() {
    if (!supabase || loading) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.from('workspaces').insert({ name: 'LunchCrew', invite_code: generateInviteCode() }).select('invite_code').single();
      if (error || !data?.invite_code) throw error || new Error('create failed');
      router.push(workspacePath(data.invite_code, 'plan'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="p-6 sm:p-8">
      <div className="grid gap-4">
        <div>
          <div className="text-lg font-semibold text-[var(--text)]">Open the real app</div>
          <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">Create a crew, jump back into your current one, or paste an invite link to land directly inside the new route-based app.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Button onClick={() => createCrew()} disabled={loading}>{loading ? 'Creating crew…' : 'Create a crew'}</Button>
          <Link href={parsedCode ? workspacePath(parsedCode) : '/'}><Button variant="secondary" className="w-full" disabled={!parsedCode}>Join with code/link</Button></Link>
        </div>
        <Input value={joinInput} onChange={(e) => setJoinInput(e.target.value)} placeholder="Paste invite code or full invite link" />
      </div>
    </Card>
  );
}
