import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { useMatch } from "react-router-dom";

const CLE_GLOBAL = "maintenance.menu.retreci.global";
const CLE_APP = "maintenance.menu.retreci.application";

const lire = (cle: string, defaut: boolean) => {
  const v = localStorage.getItem(cle);
  return v === null ? defaut : v === "1";
};

interface SidebarValue {
  retreci: boolean;
  basculer: () => void;
  mobileOuvert: boolean;
  setMobileOuvert: (v: boolean) => void;
}

const SidebarContext = createContext<SidebarValue | null>(null);

/** Le menu global ne se cache jamais mais peut être rétréci. Deux préférences mémorisées :
 *  hors application (déployé par défaut) et dans une application (rétréci par défaut). */
export function SidebarProvider({ children }: { children: ReactNode }) {
  const dansApplication = Boolean(useMatch("/applications/:applicationId/*"));
  const [prefGlobal, setPrefGlobal] = useState(() => lire(CLE_GLOBAL, false));
  const [prefApp, setPrefApp] = useState(() => lire(CLE_APP, true));
  const [mobileOuvert, setMobileOuvert] = useState(false);

  const valeur = useMemo<SidebarValue>(() => {
    const retreci = dansApplication ? prefApp : prefGlobal;
    const basculer = () => {
      if (dansApplication) {
        localStorage.setItem(CLE_APP, prefApp ? "0" : "1");
        setPrefApp(!prefApp);
      } else {
        localStorage.setItem(CLE_GLOBAL, prefGlobal ? "0" : "1");
        setPrefGlobal(!prefGlobal);
      }
    };
    return { retreci, basculer, mobileOuvert, setMobileOuvert };
  }, [dansApplication, prefApp, prefGlobal, mobileOuvert]);

  return <SidebarContext.Provider value={valeur}>{children}</SidebarContext.Provider>;
}

export function useSidebar(): SidebarValue {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error("useSidebar doit être utilisé dans <SidebarProvider>.");
  return ctx;
}
