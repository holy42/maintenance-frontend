import { Box, Chip, List, ListItemButton, ListItemText, Paper, Stack, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { historique, } from "../api/suivi";
import { listProblemes } from "../api/problemes";
import { sessionsApplication } from "../api/tests";
import { listTaches } from "../api/taches";
import Etat from "../components/Etat";
import PageHeader from "../components/PageHeader";
import StatutChip from "../components/StatutChip";
import { useAnnuaire } from "../context/AnnuaireContext";
import { useApplications } from "../context/ApplicationsContext";
import { useAsync } from "../hooks/useAsync";
import { dateHeure, enRetard } from "../utils/format";
import { libelle } from "../utils/libelles";
import { lireApplicationsRecentes } from "../utils/recents";

function Indicateur({ titre, valeur, detail, alerte }: { titre: string; valeur: number; detail?: string; alerte?: boolean }) {
  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="body2" color="text.secondary">{titre}</Typography>
      <Typography variant="h4" component="p">{valeur}</Typography>
      {detail && <Typography variant="caption" color={alerte ? "error.main" : "text.secondary"}>{detail}</Typography>}
    </Paper>
  );
}

/** Tableau de bord global : agrège les applications accessibles, adapté aux permissions de l'utilisateur. */
export default function Accueil() {
  const { applications, trouver } = useApplications();
  const { nom } = useAnnuaire();
  const { data, loading, error } = useAsync(async () => {
    const [problemes, taches, evenements] = await Promise.all([
      listProblemes({ limit: 200 }), listTaches({}), historique({ jours: 7, limit: 8 }).catch(() => []),
    ]);
    const sessions = (await Promise.all(applications.map((a) => sessionsApplication(a.id, { statut: "a_tester" }).catch(() => [])))).flat();
    return { problemes, taches, evenements, sessions };
  }, [applications.length]);

  const ouverts = (data?.problemes ?? []).filter((p) => p.statut !== "faux_positif" && p.statut !== "termine");
  const critiques = ouverts.filter((p) => p.gravite === "critique");
  const prioritaires = ouverts.filter((p) => p.gravite === "critique" || p.gravite === "elevee").slice(0, 5);
  const enCours = (data?.taches ?? []).filter((t) => t.statut === "en_cours");
  const retards = (data?.taches ?? []).filter((t) => enRetard(t.echeance, t.statut));
  const recentes = lireApplicationsRecentes().map((id) => trouver(id)).filter((a) => a !== undefined);

  return (
    <>
      <PageHeader titre="Accueil" />
      <Etat loading={loading} error={error}>
        <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" }, mb: 2 }}>
          <Indicateur titre="Applications actives" valeur={applications.filter((a) => a.statut === "active").length} />
          <Indicateur titre="Problèmes ouverts" valeur={ouverts.length} detail={`dont ${critiques.length} critique(s)`} alerte={critiques.length > 0} />
          <Indicateur titre="Tâches en cours" valeur={enCours.length} detail={`${retards.length} en retard`} alerte={retards.length > 0} />
          <Indicateur titre="Tests à valider" valeur={data?.sessions.length ?? 0} />
        </Box>
        <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "3fr 2fr" } }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" fontWeight={600}>À traiter en priorité</Typography>
            <List dense>
              {prioritaires.length === 0 && <Typography color="text.secondary" variant="body2">Aucun problème critique ou élevé.</Typography>}
              {prioritaires.map((p) => (
                <ListItemButton key={p.id} component={RouterLink} to={`/applications/${p.application_id}/problemes/${p.id}`}>
                  <ListItemText primary={`${p.code} · ${p.titre}`} secondary={trouver(p.application_id)?.nom} />
                  <StatutChip groupe="gravite" valeur={p.gravite} />
                </ListItemButton>
              ))}
            </List>
            <Typography component={RouterLink} to="/problemes" variant="body2">Voir tous les problèmes</Typography>
          </Paper>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" fontWeight={600}>Activité récente</Typography>
            <Stack spacing={1} sx={{ mt: 1 }}>
              {(data?.evenements ?? []).length === 0 && <Typography color="text.secondary" variant="body2">Aucune activité récente.</Typography>}
              {(data?.evenements ?? []).map((e) => (
                <Box key={e.id}>
                  <Typography variant="body2">{libelle("evenement", e.action) !== e.action ? libelle("evenement", e.action) : e.action.replace(/_/g, " ")}</Typography>
                  <Typography variant="caption" color="text.secondary">{nom(e.auteur_id)} · {dateHeure(e.cree_le)}</Typography>
                </Box>
              ))}
            </Stack>
          </Paper>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 3, mb: 1 }}>Applications récemment consultées</Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {recentes.length === 0 && <Typography variant="body2" color="text.secondary">Aucune pour l'instant.</Typography>}
          {recentes.map((a) => a && <Chip key={a.id} label={a.nom} component={RouterLink} to={`/applications/${a.id}`} clickable />)}
        </Stack>
      </Etat>
    </>
  );
}
