"use client";

import { useSyncExternalStore } from "react";
import type { CustomerSummary } from "@/lib/customer";

/**
 * Who is signed in, as an external store fed by `/api/account/me`.
 *
 * Asked for from the browser rather than read in `app/(site)/layout.tsx`, because
 * a layout that reads cookies forces every page to render per-request and the
 * landing page is prerendered. That is the same trade the cart makes, for the same
 * reason — see the Cart section of ARCHITECTURE.md.
 *
 * A store rather than state in a provider, again matching the cart: the answer
 * lives outside React, several places want it, and `refreshAccount()` lets the
 * sign-in and sign-up flows update the navbar without a full page load.
 *
 * The cost is that the header shows nothing account-related until the first fetch
 * lands. That is why `status` exists: rendering "Sign in" while still loading
 * would flash the wrong thing at someone who is signed in.
 */

export type AccountSnapshot = {
  status: "loading" | "ready";
  customer: CustomerSummary | null;
};

/**
 * The server render always gets this exact object.
 *
 * Module state is shared across requests on the server, so returning the live
 * `state` from `getServerSnapshot` could show one visitor another's name. The
 * store is only ever populated in the browser.
 */
const SERVER_SNAPSHOT: AccountSnapshot = { status: "loading", customer: null };

let state: AccountSnapshot = SERVER_SNAPSHOT;

const listeners = new Set<() => void>();

/**
 * Bumped on every request. A response only wins if it is still the newest one
 * asked for, so a `refreshAccount()` cannot be overwritten by an earlier fetch
 * that happened to land after it.
 */
let generation = 0;
let loading = false;

function emit() {
  for (const listener of listeners) listener();
}

function load() {
  const current = (generation += 1);

  loading = true;

  fetch("/api/account/me", { cache: "no-store" })
    .then((response) => (response.ok ? response.json() : { customer: null }))
    .then((body: { customer?: CustomerSummary | null }) => {
      if (current !== generation) return;

      state = { status: "ready", customer: body.customer ?? null };
      loading = false;
      emit();
    })
    .catch(() => {
      if (current !== generation) return;

      // Treated as signed out. The account pages check the session for real, so
      // the worst a failed lookup does is hide the menu.
      state = { status: "ready", customer: null };
      loading = false;
      emit();
    });
}

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);

  // React calls this on mount, which is the supported place to start listening
  // to something outside React — unlike an effect that calls setState.
  if (state.status === "loading" && !loading) load();

  return () => {
    listeners.delete(onChange);
  };
}

function getSnapshot(): AccountSnapshot {
  return state;
}

function getServerSnapshot(): AccountSnapshot {
  return SERVER_SNAPSHOT;
}

/**
 * Re-reads the session. Call after signing in, signing up or signing out, so the
 * navbar catches up without a full page load.
 */
export function refreshAccount() {
  load();
}

export function useAccount(): AccountSnapshot {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
