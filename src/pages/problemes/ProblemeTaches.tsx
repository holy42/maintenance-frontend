import AddTaskOutlined from "@mui/icons-material/AddTaskOutlined";
import { Alert, Box, Button, List, ListItemButton, ListItemText, Paper, Typography } from "@mui/material";
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
      <Button variant="contained" startIcon={<AddTaskOutlined />} sx={{ mb: 2 }} disabled={!peutCreer} component={RouterLink} to={`/applications/${application.id}/taches/nouvelle?problemeId=${probleme.id}`}>
        Créer des tâches
      </Button>
      {!peutCreer && <Alert severity="info" sx={{ mb: 2 }}>Les tâches se créent pour un problème confirmé, en cours ou rouvert, avec la permission « gérer les tâches ».</Alert>}
      <Paper sx={{ maxWidth: 1120, mx: "auto", borderRadius: 2.5, overflow: "hidden", borderColor: "divider" }}>
        <List>
          {(data ?? []).length === 0 && <Box sx={{ p: { xs: 3, sm: 4 }, textAlign: "center" }}><Typography color="text.secondary">Aucune tâche pour ce problème.</Typography></Box>}
          {(data ?? []).map((t) => (
            <ListItemButton key={t.id} component={RouterLink} to={`/applications/${application.id}/taches/${t.id}`}
              sx={{ py: 1.75, px: { xs: 1.5, sm: 2.5 }, gap: 1.5, borderBottom: 1, borderColor: "divider", alignItems: { xs: "flex-start", sm: "center" }, flexWrap: { xs: "wrap", sm: "nowrap" } }}>
              <ListItemText primary={t.titre} primaryTypographyProps={{ fontWeight: 650 }}
                secondary={`${nom(t.responsable_id)} · étapes ${t.sous_taches.filter((s) => s.statut === "terminee").length}/${t.sous_taches.length}`} sx={{ minWidth: 0 }} />
              <StatutChip groupe="statutTache" valeur={t.statut} />
            </ListItemButton>
          ))}
        </List>
      </Paper>
    </Etat>
  );
}
