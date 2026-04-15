'use client';

import type { User as AuthUser } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
import { trackEvent } from '@/lib/analytics';
import { supabase } from '@/lib/supabase';
import type { Workspace, WorkspaceRole } from '@/lib/types';
import {
  claimWorkspace as claimWorkspaceRecord,
  fetchWorkspaceRoles,
  requestMagicLink as requestMagicLinkEmail,
  startFoundingCheckout as startFoundingCheckoutRequest,
} from './api';

type Params = {
  deviceId: string;
  workspace: Workspace | null;
};

export function useAuthState({ deviceId, workspace }: Params) {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [workspaceRole, setWorkspaceRole] = useState<WorkspaceRole['role'] | null>(null);
  const [workspaceHasOwner, setWorkspaceHasOwner] = useState(false);
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) return setAuthReady(true);
    let active = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setAuthUser(data.session?.user ?? null);
      setAuthReady(true);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setAuthUser(session?.user ?? null);
      setAuthReady(true);
      setAuthError(null);
    });
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!supabase || !workspace?.id) {
      setWorkspaceRole(null);
      setWorkspaceHasOwner(false);
      return;
    }
    let cancelled = false;
    void (async () => {
      const roles = await fetchWorkspaceRoles(supabase, workspace.id, authUser?.id);
      if (cancelled) return;
      if (!roles) {
        setWorkspaceRole(null);
        setWorkspaceHasOwner(false);
        return;
      }
      setWorkspaceHasOwner(roles.workspaceHasOwner);
      setWorkspaceRole(roles.workspaceRole);
    })();
    return () => {
      cancelled = true;
    };
  }, [workspace?.id, authUser?.id]);

  async function requestMagicLink(email: string, mode: 'claim' | 'signin' = 'signin') {
    const cleanEmail = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) return { ok: false, error: 'Enter a valid email first.' };
    if (!supabase) return { ok: false, error: 'Login is unavailable right now.' };
    setAuthBusy(true);
    setAuthError(null);
    try {
      const { error } = await requestMagicLinkEmail(supabase, cleanEmail, mode, workspace?.invite_code);
      if (error) return { ok: false, error: error.message || 'Could not send magic link.' };
      return { ok: true };
    } finally {
      setAuthBusy(false);
    }
  }

  async function signOutAuthUser() {
    if (!supabase) return;
    setAuthBusy(true);
    try {
      await supabase.auth.signOut();
      setWorkspaceRole(null);
    } finally {
      setAuthBusy(false);
    }
  }

  async function claimWorkspace() {
    if (!supabase || !workspace || !authUser) return { ok: false, error: 'Sign in first.' };
    setAuthBusy(true);
    setAuthError(null);
    try {
      if (workspaceHasOwner && !workspaceRole) return { ok: false, error: 'This crew already has an owner.' };
      const { error } = await claimWorkspaceRecord(supabase, workspace.id, authUser.id);
      if (error) return { ok: false, error: error.message || 'Could not claim this crew.' };
      setWorkspaceRole('owner');
      setWorkspaceHasOwner(true);
      void trackEvent('workspace_claimed', { workspace_id: workspace.id }, deviceId || undefined);
      return { ok: true };
    } finally {
      setAuthBusy(false);
    }
  }

  async function startFoundingCheckout() {
    if (!supabase || !workspace) return { ok: false, error: 'This crew is not ready for checkout yet.' };
    if (!authUser) return { ok: false, error: 'Sign in first.' };
    if (workspaceRole !== 'owner') return { ok: false, error: 'Only the crew owner can unlock founding access.' };
    if (workspace.pro_enabled || workspace.plan === 'founding') return { ok: false, error: 'This crew already has founding access.' };
    setCheckoutBusy(true);
    setCheckoutError(null);
    try {
      const { accessToken, data, error } = await startFoundingCheckoutRequest(supabase, workspace.id);
      if (!accessToken) {
        const message = 'Your owner session expired. Sign in again from Crew settings.';
        setCheckoutError(message);
        return { ok: false, error: message };
      }
      if (error) {
        const message = typeof error.message === 'string' ? error.message : 'Could not start checkout.';
        setCheckoutError(message);
        return { ok: false, error: message };
      }
      if (data?.alreadyUnlocked) {
        setCheckoutError('This crew already has founding access.');
        return { ok: false, error: 'This crew already has founding access.' };
      }
      if (!data?.url) {
        setCheckoutError('Stripe checkout URL was missing.');
        return { ok: false, error: 'Stripe checkout URL was missing.' };
      }
      void trackEvent('founding_checkout_started', { workspace_id: workspace.id }, deviceId || undefined);
      if (typeof window !== 'undefined') window.location.assign(data.url);
      return { ok: true };
    } catch (error: any) {
      const message = error?.message || 'Could not start checkout.';
      setCheckoutError(message);
      return { ok: false, error: message };
    } finally {
      setCheckoutBusy(false);
    }
  }

  return {
    authUser,
    authReady,
    authBusy,
    authError,
    workspaceRole,
    workspaceHasOwner,
    checkoutBusy,
    checkoutError,
    setAuthError,
    setWorkspaceRole,
    setCheckoutError,
    requestMagicLink,
    signOutAuthUser,
    claimWorkspace,
    startFoundingCheckout,
  };
}
