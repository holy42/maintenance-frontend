import { Alert, Avatar, Box, Chip, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";
import { membresApplication } from "../../api/applications";
import Etat from "../../components/Etat";
import { useApplication } from "../../context/ApplicationContext";
import { useAsync } from "../../hooks/useAsync";

/** Lecture seule : l'accès se règle par équipe ; les rôles se modifient dans l'administration. */
export default function Membres() {
  const { application } = useApplication();
  const { data, loading, error } = useAsync(() => membresApplication(application.id), [application.id]);
  return (
    <Etat loading={loading} error={error}>
      <Paper sx={{ overflow: "hidden", borderRadius: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: { xs: 1.5, sm: 2 }, py: 1.5 }}>
          <Box>
            <Typography variant="subtitle1" fontWeight={700}>Membres de l’équipe</Typography>
            <Typography variant="body2" color="text.secondary">Personnes ayant accès à cette application</Typography>
          </Box>
          <Chip size="small" color="primary" variant="outlined" label={(data ?? []).length} />
        </Box>
        <Box sx={{ display: { xs: "none", sm: "block" } }}>
          <Table size="small">
            <TableHead><TableRow><TableCell>Membre</TableCell><TableCell>Rôle dans l'équipe</TableCell></TableRow></TableHead>
            <TableBody>
              {(data ?? []).map((m) => (
                <TableRow key={m.utilisateur_id} hover>
                  <TableCell>
                    <Stack direction="row" spacing={1.25} alignItems="center">
                      <Avatar sx={{ width: 36, height: 36, bgcolor: "primary.main", fontSize: 14, fontWeight: 700 }}>{m.identifiant.slice(0, 1).toUpperCase()}</Avatar>
                      <Typography variant="body2" fontWeight={600}>{m.identifiant}</Typography>
                    </Stack>
                  </TableCell>
                  <TableCell><Chip size="small" color="primary" variant="outlined" label={m.role} /></TableCell>
                </TableRow>
              ))}
              {(data ?? []).length === 0 && <TableRow><TableCell colSpan={2} sx={{ py: 4, textAlign: "center" }}><Typography variant="body2" color="text.secondary">Aucun membre à afficher.</Typography></TableCell></TableRow>}
            </TableBody>
          </Table>
        </Box>
        <Stack spacing={1} sx={{ display: { xs: "flex", sm: "none" }, p: 1.5 }}>
          {(data ?? []).map((m) => (
            <Box key={m.utilisateur_id} sx={{ display: "flex", alignItems: "center", gap: 1.25, p: 1.25, borderRadius: 1.75, bgcolor: "background.default" }}>
              <Avatar sx={{ width: 38, height: 38, bgcolor: "primary.main", fontWeight: 700 }}>{m.identifiant.slice(0, 1).toUpperCase()}</Avatar>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2" fontWeight={600} sx={{ overflowWrap: "anywhere" }}>{m.identifiant}</Typography>
                <Chip size="small" color="primary" variant="outlined" label={m.role} sx={{ mt: 0.5 }} />
              </Box>
            </Box>
          ))}
          {(data ?? []).length === 0 && <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: "center" }}>Aucun membre à afficher.</Typography>}
        </Stack>
      </Paper>
    </Etat>
  );
}
