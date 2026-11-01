import { Box, Breadcrumbs, Link, Stack, Typography } from "@mui/material";
import type { ReactNode } from "react";
import { Link as RouterLink } from "react-router-dom";

export interface MiettePain { libelle: string; to?: string }

export default function PageHeader({ titre, sousTitre, actions, fil }: {
  titre: ReactNode; sousTitre?: ReactNode; actions?: ReactNode; fil?: MiettePain[];
}) {
  return (
    <Box sx={{ mb: 2 }}>
      {fil && fil.length > 0 && (
        <Breadcrumbs sx={{ mb: 0.5, fontSize: 13 }}>
          {fil.map((m) =>
            m.to ? <Link key={m.libelle} component={RouterLink} to={m.to} underline="hover" color="inherit">{m.libelle}</Link>
                 : <Typography key={m.libelle} color="text.primary" fontSize={13}>{m.libelle}</Typography>)}
        </Breadcrumbs>
      )}
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2} flexWrap="wrap" useFlexGap>
        <Box>
          <Typography variant="h5" component="h1">{titre}</Typography>
          {sousTitre && <Typography color="text.secondary" variant="body2">{sousTitre}</Typography>}
        </Box>
        {actions && <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>{actions}</Stack>}
      </Stack>
    </Box>
  );
}
