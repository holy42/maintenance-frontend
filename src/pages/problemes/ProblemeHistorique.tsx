import { Paper, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";
import { historiqueProbleme } from "../../api/problemes";
import Etat from "../../components/Etat";
import { useAnnuaire } from "../../context/AnnuaireContext";
import { useProbleme } from "../../context/ProblemeContext";
import { useAsync } from "../../hooks/useAsync";
import { dateHeure } from "../../utils/format";
import { libelle } from "../../utils/libelles";

/** Chronologie du problème (et de ses tâches) : lecture seule, journal en ajout seul. */
export default function ProblemeHistorique() {
  const { probleme } = useProbleme();
  const { nom } = useAnnuaire();
  const { data, loading, error } = useAsync(() => historiqueProbleme(probleme.id), [probleme.id]);
  const resume = (v: Record<string, unknown> | null) => (v ? Object.entries(v).map(([k, x]) => `${k} : ${typeof x === "object" ? JSON.stringify(x) : String(x)}`).join(", ") : "");

  return (
    <Etat loading={loading} error={error}>
      <Paper sx={{ overflowX: "auto" }}>
        <Table size="small">
          <TableHead><TableRow><TableCell>Date</TableCell><TableCell>Auteur</TableCell><TableCell>Action</TableCell><TableCell>Détail</TableCell></TableRow></TableHead>
          <TableBody>
            {(data ?? []).length === 0 && <TableRow><TableCell colSpan={4}><Typography color="text.secondary">Aucun événement.</Typography></TableCell></TableRow>}
            {(data ?? []).map((e) => (
              <TableRow key={e.id}>
                <TableCell>{dateHeure(e.cree_le)}</TableCell>
                <TableCell>{nom(e.auteur_id) === "—" ? "Système" : nom(e.auteur_id)}</TableCell>
                <TableCell>{e.action.replace(/_/g, " ")}</TableCell>
                <TableCell>{e.ancienne_valeur ? `${resume(e.ancienne_valeur)} → ` : ""}{resume(e.nouvelle_valeur)}{e.commentaire ? ` (${e.commentaire})` : ""}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
        {libelle("evenement", "statut_modifie")} : les statuts sont tracés avec leur auteur. Le journal ne peut être ni modifié ni supprimé.
      </Typography>
    </Etat>
  );
}
