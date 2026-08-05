import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '../services/database/supabase';

/**
 * useDeckCollaborators — real-time presence + broadcast for deck collaboration.
 *
 * Channel naming: `deck-collab:{deckId}`
 *
 * Features:
 *   - Presence: tracks who is currently viewing/editing a deck
 *   - Broadcast: sends cursor positions, card edits, and presence heartbeats
 *   - Auto-cleanup on unmount
 *
 * Usage:
 *   const { peers, myCursor, broadcastCursor, broadcastEdit } = useDeckCollaborators(deckId, userId, displayName);
 */

export interface CollaboratorPeer {
  userId: string;
  displayName: string;
  cursor?: { cardId: string; field: 'front' | 'back' };
  lastSeen: number;
  isOnline: boolean;
}

export interface DeckCollaboratorState {
  peers: CollaboratorPeer[];
  myCursor: { cardId: string; field: 'front' | 'back' } | null;
}

export function useDeckCollaborators(
  deckId: string | undefined,
  userId: string,
  displayName = 'Anonymous',
) {
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const [state, setState] = useState<DeckCollaboratorState>({
    peers: [],
    myCursor: null,
  });
  const peersRef = useRef<Map<string, CollaboratorPeer>>(new Map());

  // ─── Presence ────────────────────────────────────────────────
  useEffect(() => {
    if (!deckId || !supabase) return;

    const channel = supabase.channel(`deck-collab:${deckId}`, {
      config: { broadcast: { ack: false } },
    });

    // Handle presence via broadcast (simpler than supabase presence API)
    channel
      .on('broadcast', { event: 'cursor' }, (event: any) => {
        const p = event.payload as { userId: string; displayName: string; cardId: string; field: 'front' | 'back'; ts: number };
        if (p.userId === userId) return;
        peersRef.current.set(p.userId, {
          userId: p.userId,
          displayName: p.displayName,
          cursor: { cardId: p.cardId, field: p.field },
          lastSeen: p.ts,
          isOnline: true,
        });
        setState(prev => ({
          ...prev,
          peers: Array.from(peersRef.current.values()),
        }));
      })
      .on('broadcast', { event: 'edit' }, (event: any) => {
        // Card edit broadcast — components can listen for this
        const p = event.payload as { userId: string; displayName: string; cardId: string; field: string; value: string; ts: number };
        if (p.userId === userId) return;
        // Dispatch a custom event so card components can react
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('deck-collab:edit', { detail: p }));
        }
      })
      .on('broadcast', { event: 'presence' }, (event: any) => {
        const p = event.payload as { userId: string; displayName: string; isTyping: boolean; ts: number };
        if (p.userId === userId) return;
        if (p.isTyping) {
          peersRef.current.set(p.userId, {
            userId: p.userId,
            displayName: p.displayName,
            lastSeen: p.ts,
            isOnline: true,
          });
        } else {
          peersRef.current.delete(p.userId);
        }
        setState(prev => ({
          ...prev,
          peers: Array.from(peersRef.current.values()),
        }));
      })
      .subscribe();

    // Announce presence
    channel.send({
      type: 'broadcast',
      event: 'presence',
      payload: { userId, displayName, isTyping: true, ts: Date.now() },
    });

    // Heartbeat every 5s to stay alive
    const heartbeat = setInterval(() => {
      if (channel) {
        channel.send({
          type: 'broadcast',
          event: 'presence',
          payload: { userId, displayName, isTyping: true, ts: Date.now() },
        });
      }
      // Prune peers older than 15s
      const now = Date.now();
      let changed = false;
      peersRef.current.forEach((peer, id) => {
        if (now - peer.lastSeen > 15_000) {
          peersRef.current.delete(id);
          changed = true;
        }
      });
      if (changed) {
        setState(prev => ({
          ...prev,
          peers: Array.from(peersRef.current.values()),
        }));
      }
    }, 5_000);

    channelRef.current = channel;

    return () => {
      clearInterval(heartbeat);
      if (channelRef.current && supabase) {
        // Announce departure
        channelRef.current.send({
          type: 'broadcast',
          event: 'presence',
          payload: { userId, displayName, isTyping: false, ts: Date.now() },
        });
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      peersRef.current.clear();
    };
  }, [deckId, userId, displayName]);

  /** Broadcast cursor position as user navigates cards. */
  const broadcastCursor = useCallback((cardId: string, field: 'front' | 'back') => {
    if (!channelRef.current) return;
    setState(prev => ({ ...prev, myCursor: { cardId, field } }));
    channelRef.current.send({
      type: 'broadcast',
      event: 'cursor',
      payload: { userId, displayName, cardId, field, ts: Date.now() },
    });
  }, [userId, displayName]);

  /** Broadcast a card edit to all collaborators. */
  const broadcastEdit = useCallback((cardId: string, field: string, value: string) => {
    if (!channelRef.current) return;
    channelRef.current.send({
      type: 'broadcast',
      event: 'edit',
      payload: { userId, displayName, cardId, field, value, ts: Date.now() },
    });
  }, [userId, displayName]);

  return {
    ...state,
    broadcastCursor,
    broadcastEdit,
  };
}
