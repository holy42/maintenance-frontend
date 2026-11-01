import { Alert, Box, CircularProgress } from "@mui/material";
import type { ReactNode } from "react";

/** Affiche un indicateur de chargement ou l'erreur, sinon le contenu. */
export default function Etat({ loading, error, children }: { loading: boolean; error: string | null; children: ReactNode }) {
  if (error) return <Alert severity="error">{error}</Alert>;
  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
        <CircularProgress aria-label="Chargement" />
      </Box>
    );
  }
  return <>{children}</>;
}
