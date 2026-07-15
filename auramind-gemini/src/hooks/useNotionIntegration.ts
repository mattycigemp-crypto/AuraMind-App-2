import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../services/database/supabase';
import { notionService } from '../services/integrations/notionService';

export type NotionConnectionStatus = 'loading' | 'disconnected' | 'connected';

export interface NotionConnectionMeta {
  connected?: boolean;
  accessToken: string;
  workspaceId?: string;
  workspaceName?: string;
  /** Unix epoch ms when the user connected. Set by the API at connect time. */
  connectedAt?: number;
}

export interface UseNotionIntegrationReturn {
  status: NotionConnectionStatus;
  meta: NotionConnectionMeta | null;
  submitting: boolean;
  error: string | null;
  message: string | null;
  refresh: () => Promise<void>;
  dismiss: () => void;
  connect: (input: { accessToken: string; workspaceName?: string }) => Promise<boolean>;
  disconnect: () => Promise<boolean>;
}

/**
 * Integrations nested under `user_metadata.integrations` by the API.
 * Single source of truth for the shape; mirrors what api/index.ts writes so drift is loud.
 */
interface IntegrationsMeta {
  notion?: NotionConnectionMeta;
  [key: string]: unknown;
}

const API_BASE = () => (import.meta.env.VITE_API_BASE_URL || '');

/**
 * Read/manage the user's Notion integration state.
 *
 * - On mount, reads `data.user.user_metadata.integrations.notion` from Supabase.
 * - On connect/disconnect, hits the authenticated `/api/integrations/notion/{connect,disconnect}` endpoint
 *   and stores the accessToken server-side via Supabase admin updateUserById.
 * - Side-effect: hydrates `notionService` (the shared client used by SourcesPanel, etc.)
 *   with the current token whenever the connection state changes.
 */
export function useNotionIntegration(): UseNotionIntegrationReturn {
  const [status, setStatus] = useState<NotionConnectionStatus>('loading');
  const [meta, setMeta] = useState<NotionConnectionMeta | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!supabase) {
      setStatus('disconnected');
      setMeta(null);
      return;
    }
    try {
      const { data, error: authErr } = await supabase.auth.getUser();
      if (authErr || !data?.user) {
        setStatus('disconnected');
        setMeta(null);
        notionService.clearAccessToken();
        return;
      }
      const userMeta = (data.user?.user_metadata ?? {}) as { integrations?: IntegrationsMeta };
      const integ = userMeta.integrations?.notion;
      if (integ?.accessToken) {          setMeta({
            connected: integ.connected,
            accessToken: integ.accessToken,
            workspaceId: integ.workspaceId,
            workspaceName: integ.workspaceName,
            connectedAt: typeof integ.connectedAt === 'number' ? integ.connectedAt : undefined,
          });
        setStatus('connected');
        notionService.setAccessToken(integ.accessToken);
      } else {
        setMeta(null);
        setStatus('disconnected');
        notionService.clearAccessToken();
      }
    } catch {
      setStatus('disconnected');
      setMeta(null);
      notionService.clearAccessToken();
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const flashMessage = useCallback((m: string) => {
    setError(null);
    setMessage(m);
    window.setTimeout(() => {
      setMessage((cur) => (cur === m ? null : cur));
    }, 4000);
  }, []);

  const dismiss = useCallback(() => {
    setError(null);
    setMessage(null);
  }, []);

  const connect: UseNotionIntegrationReturn['connect'] = useCallback(
    async ({ accessToken, workspaceName }) => {
      if (!supabase) {
        setError('Sign-in required to manage integrations.');
        return false;
      }
      const trimmed = accessToken.trim();
      if (!trimmed) {
        setError('Token is required.');
        return false;
      }
      setSubmitting(true);
      setError(null);
      setMessage(null);
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        if (!token) throw new Error('You are signed out. Please sign in again.');
        const res = await fetch(`${API_BASE()}/api/integrations/notion/connect`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            accessToken: trimmed,
            workspaceName: workspaceName?.trim() || undefined,
          }),
        });
        if (!res.ok) {
          const text = await res.text().catch(() => '');
          throw new Error(text || `Request failed with HTTP ${res.status}`);
        }
        await refresh();
        flashMessage('Connected to Notion.');
        return true;
      } catch (e: any) {
        setError(e?.message || 'Failed to connect to Notion.');
        return false;
      } finally {
        setSubmitting(false);
      }
    },
    [refresh, flashMessage],
  );

  const disconnect: UseNotionIntegrationReturn['disconnect'] = useCallback(async () => {
    if (!supabase) {
      setError('Sign-in required to manage integrations.');
      return false;
    }
    setSubmitting(true);
    setError(null);
    setMessage(null);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error('You are signed out. Please sign in again.');
      const res = await fetch(`${API_BASE()}/api/integrations/notion/disconnect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(text || `Request failed with HTTP ${res.status}`);
      }
      await refresh();
      flashMessage('Notion disconnected.');
      return true;
    } catch (e: any) {
      setError(e?.message || 'Failed to disconnect Notion.');
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [refresh, flashMessage]);

  return { status, meta, submitting, error, message, refresh, dismiss, connect, disconnect };
}
