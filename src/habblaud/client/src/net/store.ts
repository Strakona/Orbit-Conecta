import type { OfficeSnapshot } from '../../../shared/types';

export interface StoreEvents {
  snapshot: OfficeSnapshot;
}

type Listener<K extends keyof StoreEvents> = (value: StoreEvents[K]) => void;

/**
 * Adaptador local do OfficeStore do Habblaud para o Orbit Conecta.
 * Sem SSE, sem leitores de Claude/Codex e sem uplink externo.
 */
export class OfficeStore {
  snapshot: OfficeSnapshot | null = null;
  private listeners = new Map<keyof StoreEvents, Set<(value: unknown) => void>>();

  on<K extends keyof StoreEvents>(event: K, cb: Listener<K>): () => void {
    let set = this.listeners.get(event);
    if (!set) {
      set = new Set();
      this.listeners.set(event, set);
    }
    const wrapped = cb as (value: unknown) => void;
    set.add(wrapped);
    return () => {
      set?.delete(wrapped);
    };
  }

  push(snap: OfficeSnapshot): void {
    this.snapshot = snap;
    const set = this.listeners.get('snapshot');
    if (set) {
      for (const cb of set) {
        (cb as Listener<'snapshot'>)(snap);
      }
    }
  }
}
