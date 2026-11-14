import BoutonAction from "../components/BoutonAction";
import { Stack, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

export default function NotFound() {
  return (
    <Stack spacing={2} alignItems="flex-start">
      <Typography variant="h5" component="h1">Page introuvable</Typography>
      <BoutonAction component={RouterLink} to="/" variant="outlined">Retour à l'accueil</BoutonAction>
    </Stack>
  );
}
