import { createContext, useContext } from "react";
import type { Application } from "../api/types";

export interface ApplicationCtx {
  application: Application;
  peut: (permission: string) => boolean;
  archivee: boolean;
  recharger: () => void;
}

export const ApplicationContext = createContext<ApplicationCtx | null>(null);

/** Application courante (à utiliser dans les pages de l'espace d'une application). */
export function useApplication(): ApplicationCtx {
  const ctx = useContext(ApplicationContext);
  if (!ctx) throw new Error("useApplication doit être utilisé dans l'espace d'une application.");
  return ctx;
}

/** Version tolérante : null dans les vues globales (menu global). */
export const useApplicationOptionnelle = (): ApplicationCtx | null => useContext(ApplicationContext);
