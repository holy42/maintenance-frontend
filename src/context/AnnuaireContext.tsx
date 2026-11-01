import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { annuaire } from "../api/auth";
import type { Annuaire } from "../api/types";
import { useAuth } from "./AuthContext";

interface AnnuaireValue {
  personnes: Annuaire[];
  /** Identifiant d'une personne à partir de son numéro (« — » si inconnu). */
  nom: (id: number | null | undefined) => string;
}

const AnnuaireContext = createContext<AnnuaireValue>({ personnes: [], nom: () => "—" });

export function AnnuaireProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [personnes, setPersonnes] = useState<Annuaire[]>([]);

  useEffect(() => {
    if (user) annuaire().then(setPersonnes).catch(() => setPersonnes([]));
    else setPersonnes([]);
  }, [user]);

  const valeur = useMemo<AnnuaireValue>(() => {
    const index = new Map(personnes.map((p) => [p.id, p.identifiant]));
    return { personnes, nom: (id) => (id == null ? "—" : index.get(id) ?? `#${id}`) };
  }, [personnes]);

  return <AnnuaireContext.Provider value={valeur}>{children}</AnnuaireContext.Provider>;
}

export const useAnnuaire = () => useContext(AnnuaireContext);
