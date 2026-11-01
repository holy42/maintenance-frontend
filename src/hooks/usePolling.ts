import { useEffect, useRef } from "react";

/** Appelle `fn` toutes les `delaiMs` tant que `actif` est vrai (ex. suivi d'une vérification en cours). */
export function usePolling(fn: () => void, actif: boolean, delaiMs = 3000) {
  const ref = useRef(fn);
  ref.current = fn;
  useEffect(() => {
    if (!actif) return;
    const id = window.setInterval(() => ref.current(), delaiMs);
    return () => window.clearInterval(id);
  }, [actif, delaiMs]);
}
