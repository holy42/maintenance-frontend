import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { listEquipes } from "../api/administration";
import type { Equipe } from "../api/types";
import { useAuth } from "./AuthContext";

const CLE = "maintenance.equipe";

interface EquipeValue {
  equipes: Equipe[];
  /** Équipe choisie dans le menu global (null = toutes mes équipes). */
  equipeId: number | null;
  choisir: (id: number | null) => void;
}

const EquipeContext = createContext<EquipeValue>({ equipes: [], equipeId: null, choisir: () => undefined });

export function EquipeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [equipes, setEquipes] = useState<Equipe[]>([]);
  const [equipeId, setEquipeId] = useState<number | null>(() => {
    const v = localStorage.getItem(CLE);
    return v ? Number(v) : null;
  });

  useEffect(() => {
    if (user) listEquipes().then(setEquipes).catch(() => setEquipes([]));
  }, [user]);

  const valeur = useMemo<EquipeValue>(
    () => ({
      equipes,
      equipeId,
      choisir: (id) => {
        setEquipeId(id);
        if (id === null) localStorage.removeItem(CLE);
        else localStorage.setItem(CLE, String(id));
      },
    }),
    [equipes, equipeId],
  );
  return <EquipeContext.Provider value={valeur}>{children}</EquipeContext.Provider>;
}

export const useEquipe = () => useContext(EquipeContext);
