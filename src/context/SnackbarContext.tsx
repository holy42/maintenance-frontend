import { Alert, Snackbar } from "@mui/material";
import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

type Gravite = "success" | "info" | "warning" | "error";
type Notifier = (message: string, gravite?: Gravite) => void;

const SnackbarContext = createContext<Notifier>(() => undefined);

/** Messages de confirmation ou d'erreur affichés en bas de l'écran. */
export function SnackbarProvider({ children }: { children: ReactNode }) {
  const [etat, setEtat] = useState<{ message: string; gravite: Gravite } | null>(null);
  const notifier = useCallback<Notifier>((message, gravite = "success") => setEtat({ message, gravite }), []);
  return (
    <SnackbarContext.Provider value={notifier}>
      {children}
      <Snackbar open={etat !== null} autoHideDuration={5000} onClose={() => setEtat(null)} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        {etat ? <Alert severity={etat.gravite} onClose={() => setEtat(null)} variant="filled">{etat.message}</Alert> : undefined}
      </Snackbar>
    </SnackbarContext.Provider>
  );
}

export const useNotifier = () => useContext(SnackbarContext);
