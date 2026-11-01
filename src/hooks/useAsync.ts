import { useCallback, useEffect, useState } from "react";
import { messageErreur } from "../api/client";

/** Charge des données au montage et quand `deps` change. `reload()` relance l'appel. */
export function useAsync<T>(fn: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let annule = false;
    setLoading(true);
    setError(null);
    fn()
      .then((d) => { if (!annule) setData(d); })
      .catch((e) => { if (!annule) setError(messageErreur(e)); })
      .finally(() => { if (!annule) setLoading(false); });
    return () => { annule = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { data, loading, error, reload, setData };
}
