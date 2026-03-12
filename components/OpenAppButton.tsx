'use client';

import { useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui';
import {
  LAST_WORKSPACE_CODE_KEY,
  LAST_WORKSPACE_ID_KEY,
  extractInviteCode,
  generateInviteCode,
  storage,
  workspacePath,
} from '@/lib/helpers';
import { supabase } from '@/lib/supabase';

export function OpenAppButton({
  className,
  variant = 'secondary',
  children = 'Open app',
}: {
  className?: string;
  variant?: 'default' | 'secondary' | 'ghost' | 'gold' | 'destructive';
  children?: ReactNode;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleOpen() {
    if (loading) return;
    setLoading(true);

    try {
      const storedCode = extractInviteCode(storage.get(LAST_WORKSPACE_CODE_KEY) || '');
      if (storedCode) {
        router.push(workspacePath(storedCode));
        return;
      }

      if (!supabase) return;

      const storedWorkspaceId = storage.get(LAST_WORKSPACE_ID_KEY);
      if (storedWorkspaceId) {
        const { data } = await supabase
          .from('workspaces')
          .select('invite_code')
          .eq('id', storedWorkspaceId)
          .maybeSingle();

        const restoredCode = extractInviteCode((data as { invite_code?: string } | null)?.invite_code || '');
        if (restoredCode) {
          storage.set(LAST_WORKSPACE_CODE_KEY, restoredCode);
          router.push(workspacePath(restoredCode));
          return;
        }
      }

      const { data, error } = await supabase
        .from('workspaces')
        .insert({ name: 'LunchCrew', invite_code: generateInviteCode() })
        .select('id,invite_code')
        .single();

      if (error || !data?.invite_code) throw error || new Error('create failed');

      storage.set(LAST_WORKSPACE_ID_KEY, data.id);
      storage.set(LAST_WORKSPACE_CODE_KEY, data.invite_code);
      router.push(workspacePath(data.invite_code));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button className={className} variant={variant} onClick={handleOpen} disabled={loading}>
      {loading ? 'Opening…' : children}
    </Button>
  );
}
