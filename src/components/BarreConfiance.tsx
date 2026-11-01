import { Box, LinearProgress, Stack, Typography } from "@mui/material";
import { pourcent } from "../utils/format";

/** Confiance DÉCLARÉE par l'IA (Gemini), en pourcentage. Ce n'est pas la fiabilité estimée par notre modèle (voir FiabiliteBadge). */
export default function BarreConfiance({ valeur }: { valeur: number | string | null | undefined }) {
  const p = pourcent(valeur);
  if (p === null) return null;
  return (
    <Stack direction="row" spacing={1} alignItems="center">
      <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: "nowrap" }}>Confiance déclarée par l'IA</Typography>
      <Box sx={{ flex: 1, minWidth: 80 }}><LinearProgress variant="determinate" value={p} /></Box>
      <Typography variant="caption">{p} %</Typography>
    </Stack>
  );
}
