import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { listApplications } from "../api/applications";
import type { Application } from "../api/types";
import { useAuth } from "./AuthContext";

interface ApplicationsValue {
  applications: Application[];
  recharger: () => void;
  trouver: (id: number) => Application | undefined;
}

const ApplicationsContext = createContext<ApplicationsValue>({ applications: [], recharger: () => undefined, trouver: () => undefined });

/** Liste des applications accessibles : alimente le sous-menu « Applications » et les noms affichés. */
export function ApplicationsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (user) listApplications().then(setApplications).catch(() => setApplications([]));
    else setApplications([]);
  }, [user, tick]);

  const recharger = useCallback(() => setTick((t) => t + 1), []);
  const valeur = useMemo(
    () => ({ applications, recharger, trouver: (id: number) => applications.find((a) => a.id === id) }),
    [applications, recharger],
  );
  return <ApplicationsContext.Provider value={valeur}>{children}</ApplicationsContext.Provider>;
}

export const useApplications = () => useContext(ApplicationsContext);
