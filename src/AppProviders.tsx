import { CssBaseline, ThemeProvider, useMediaQuery } from "@mui/material";
import { useMemo, type ReactNode } from "react";
import { AnnuaireProvider } from "./context/AnnuaireContext";
import { ApplicationsProvider } from "./context/ApplicationsContext";
import { AuthProvider } from "./context/AuthContext";
import { EquipeProvider } from "./context/EquipeContext";
import { SnackbarProvider } from "./context/SnackbarContext";
import { creerTheme } from "./theme";

export default function AppProviders({ children }: { children: ReactNode }) {
  const sombre = useMediaQuery("(prefers-color-scheme: dark)");
  const theme = useMemo(() => creerTheme(sombre), [sombre]);
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SnackbarProvider>
        <AuthProvider>
          <AnnuaireProvider>
            <ApplicationsProvider>
              <EquipeProvider>{children}</EquipeProvider>
            </ApplicationsProvider>
          </AnnuaireProvider>
        </AuthProvider>
      </SnackbarProvider>
    </ThemeProvider>
  );
}
