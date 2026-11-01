import { Alert, Chip, Paper, Table, TableBody, TableCell, TableHead, TableRow } from "@mui/material";
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
      <Alert severity="info" sx={{ mb: 2 }}>Les membres de l'équipe propriétaire ont accès à cette application, avec les permissions de leur rôle. L'administrateur attribue les rôles.</Alert>
      <Paper sx={{ overflowX: "auto" }}>
        <Table size="small">
          <TableHead><TableRow><TableCell>Membre</TableCell><TableCell>Rôle dans l'équipe</TableCell></TableRow></TableHead>
          <TableBody>
            {(data ?? []).map((m) => (
              <TableRow key={m.utilisateur_id}><TableCell>{m.identifiant}</TableCell><TableCell><Chip size="small" variant="outlined" label={m.role} /></TableCell></TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Etat>
  );
}
