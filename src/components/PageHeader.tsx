import { Box, Breadcrumbs, Link, Stack, Typography } from "@mui/material";
import type { ReactNode } from "react";
import { Link as RouterLink } from "react-router-dom";

export interface MiettePain { libelle: string; to?: string }

export default function PageHeader({ titre, sousTitre, actions, fil }: {
  titre: ReactNode; sousTitre?: ReactNode; actions?: ReactNode; fil?: MiettePain[];
}) {
  return (
    <Box sx={{
      mb: 2.5, p: { xs: 1.5, sm: 2 }, borderRadius: 2.5,
      bgcolor: "background.paper", border: 1, borderColor: "divider",
    }}>
      {fil && fil.length > 0 && (
        <Breadcrumbs sx={{ mb: 0.75, fontSize: 12.5, "& .MuiBreadcrumbs-separator": { color: "text.disabled" } }}>
          {fil.map((m) =>
            m.to ? <Link key={m.libelle} component={RouterLink} to={m.to} underline="hover" color="inherit">{m.libelle}</Link>
                 : <Typography key={m.libelle} color="text.primary" fontSize={13}>{m.libelle}</Typography>)}
        </Breadcrumbs>
      )}
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "stretch", sm: "center" }} spacing={1.5} flexWrap="wrap" useFlexGap>
        <Box sx={{ minWidth: 0, flex: "1 1 260px" }}>
          <Typography variant="h5" component="h1" sx={{ fontWeight: 750, letterSpacing: "-0.025em", overflowWrap: "anywhere", color: "text.primary" }}>{titre}</Typography>
          {sousTitre && <Typography color="text.secondary" variant="body2" sx={{ mt: 0.35 }}>{sousTitre}</Typography>}
        </Box>
        {actions && <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ alignItems: "center", "& > *": { maxWidth: "100%" } }}>{actions}</Stack>}
      </Stack>
    </Box>
  );
}
