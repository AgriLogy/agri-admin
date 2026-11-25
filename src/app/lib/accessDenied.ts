/**
 * Shared "access refused" state for back-office pages.
 *
 * agri-api answers 403 when the signed-in account lacks the access level an
 * endpoint needs (non-staff, or staff below "admin" on admin-only routers).
 * Pages used to swallow that error and render their empty state, so a refused
 * account looked like an account with no data.
 *
 * The shared axios client (./api) reports every 403 on a read (GET) here, and
 * AdminPageShell swaps the page body for an "access refused" panel while the
 * flag is set. 403s on writes are left to the page that made them (a refused
 * save is not a refused page).
 *
 * Each page view is a "generation": AdminPageShell starts a new one when it
 * mounts, and requests are stamped with the generation current when they were
 * sent, so a late 403 from the previous page can't mark the next one refused.
 */
import { useSyncExternalStore } from 'react';

let generation = 0;
let denied = false;
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((listener) => listener());

/** Current page-view generation, stamped on outgoing requests. */
export function currentAccessGeneration(): number {
  return generation;
}

/** Start a new page view: clears any refusal recorded for the previous one. */
export function startAccessGeneration(): void {
  generation += 1;
  if (denied) {
    denied = false;
    emit();
  }
}

/** Record a 403 for a request sent during generation `gen`. */
export function reportAccessDenied(gen: number = generation): void {
  if (gen !== generation || denied) return;
  denied = true;
  emit();
}

export function isAccessDenied(): boolean {
  return denied;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** True once a read on the current page has been refused with a 403. */
export function useAccessDenied(): boolean {
  return useSyncExternalStore(subscribe, isAccessDenied, () => false);
}
