import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import * as authApi from "../api/auth";
import { TOKEN_KEY } from "../api/client";
import type { Utilisateur } from "../api/types";

interface AuthValue {
  user: Utilisateur | null;
  chargement: boolean;
  connecter: (identifiant: string, motDePasse: string) => Promise<void>;
  deconnecter: () => void;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Utilisateur | null>(null);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    if (!localStorage.getItem(TOKEN_KEY)) {
      setChargement(false);
      return;
    }
    authApi.moi()
      .then(setUser)
      .catch(() => localStorage.removeItem(TOKEN_KEY))
      .finally(() => setChargement(false));
  }, []);

  const connecter = useCallback(async (identifiant: string, motDePasse: string) => {
    const { access_token } = await authApi.login(identifiant, motDePasse);
    localStorage.setItem(TOKEN_KEY, access_token);
    setUser(await authApi.moi());
  }, []);

  const deconnecter = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
    window.location.assign("/connexion");
  }, []);

  const valeur = useMemo(() => ({ user, chargement, connecter, deconnecter }), [user, chargement, connecter, deconnecter]);
  return <AuthContext.Provider value={valeur}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit être utilisé dans <AuthProvider>.");
  return ctx;
}
