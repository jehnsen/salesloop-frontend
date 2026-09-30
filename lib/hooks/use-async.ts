"use client";

import * as React from "react";

export interface AsyncState<T> {
  data: T | undefined;
  error: Error | undefined;
  loading: boolean;
  /** Re-runs the loader. Pass `{ silent: true }` to keep showing current data while refetching. */
  reload: (options?: { silent?: boolean }) => Promise<void>;
  /** Replace local data (e.g. after a mutation returns the updated record). */
  setData: React.Dispatch<React.SetStateAction<T | undefined>>;
}

/**
 * Minimal data-fetching hook for client pages that call `/services`.
 * Swappable for SWR/React Query once a real API exists.
 */
export function useAsync<T>(loader: () => Promise<T>, deps: React.DependencyList = []): AsyncState<T> {
  const [data, setData] = React.useState<T>();
  const [error, setError] = React.useState<Error>();
  const [loading, setLoading] = React.useState(true);
  const loaderRef = React.useRef(loader);
  const requestId = React.useRef(0);

  React.useEffect(() => {
    loaderRef.current = loader;
  });

  const reload = React.useCallback(async (options?: { silent?: boolean }) => {
    const id = ++requestId.current;
    if (!options?.silent) setLoading(true);
    setError(undefined);
    try {
      const result = await loaderRef.current();
      if (id === requestId.current) setData(result);
    } catch (e) {
      if (id === requestId.current) setError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loaderRef.current = loader;
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, error, loading, reload, setData };
}

/** Runs `callback` whenever the mock database changes (this tab or another tab). */
export function useDbChange(callback: () => void) {
  const ref = React.useRef(callback);
  React.useEffect(() => {
    ref.current = callback;
  });
  React.useEffect(() => {
    const handler = () => ref.current();
    window.addEventListener("salesloop:db-change", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("salesloop:db-change", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);
}
