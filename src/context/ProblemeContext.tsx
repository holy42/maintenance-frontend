import { createContext, useContext } from "react";
import type { Probleme } from "../api/types";

export interface ProblemeCtx {
  probleme: Probleme;
  recharger: () => void;
}

export const ProblemeContext = createContext<ProblemeCtx | null>(null);

export function useProbleme(): ProblemeCtx {
  const ctx = useContext(ProblemeContext);
  if (!ctx) throw new Error("useProbleme doit être utilisé dans la fiche d'un problème.");
  return ctx;
}
