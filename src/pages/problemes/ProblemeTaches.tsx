import { Alert, Button, List, ListItemButton, ListItemText, Paper, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { tachesDuProbleme } from "../../api/taches";
import Etat from "../../components/Etat";
import StatutChip from "../../components/StatutChip";
import { useApplication } from "../../context/ApplicationContext";
import { useAnnuaire } from "../../context/AnnuaireContext";
import { useProbleme } from "../../context/ProblemeContext";
import { useAsync } from "../../hooks/useAsync";
import { PERM } from "../../utils/permissions";

/** Un problème peut avoir une ou plusieurs tâches. */
export default function ProblemeTaches() {
  const { application, peut, archivee } = useApplication();
  const { probleme } = useProbleme();
  const { nom } = useAnnuaire();
  const { data, loading, error } = useAsync(() => tachesDuProbleme(probleme.id), [probleme.id]);
  const peutCreer = peut(PERM.TACHE_GERER) && !archivee && ["confirme", "en_cours", "rouvert"].includes(probleme.statut);

  return (
    <Etat loading={loading} error={error}>
      <Button variant="contained" sx={{ mb: 2 }} disabled={!peutCreer} component={RouterLink} to={`/applications/${application.id}/taches/nouvelle?problemeId=${probleme.id}`}>
        Créer des tâches
      </Button>
      {!peutCreer && <Alert severity="info" sx={{ mb: 2 }}>Les tâches se créent pour un problème confirmé, en cours ou rouvert, avec la permission « gérer les tâches ».</Alert>}
      <Paper>
        <List>
          {(data ?? []).length === 0 && <Typography sx={{ p: 2 }} color="text.secondary">Aucune tâche pour ce problème.</Typography>}
          {(data ?? []).map((t) => (
            <ListItemButton key={t.id} component={RouterLink} to={`/applications/${application.id}/taches/${t.id}`}>
              <ListItemText primary={t.titre} secondary={`${nom(t.responsable_id)} · étapes ${t.sous_taches.filter((s) => s.statut === "terminee").length}/${t.sous_taches.length}`} />
              <StatutChip groupe="statutTache" valeur={t.statut} />
            </ListItemButton>
          ))}
        </List>
      </Paper>
    </Etat>
  );
}
