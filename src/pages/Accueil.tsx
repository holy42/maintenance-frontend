import AppsOutlined from "@mui/icons-material/AppsOutlined";
import ArrowForwardOutlined from "@mui/icons-material/ArrowForwardOutlined";
import BugReportOutlined from "@mui/icons-material/BugReportOutlined";
import ChecklistOutlined from "@mui/icons-material/ChecklistOutlined";
import ScienceOutlined from "@mui/icons-material/ScienceOutlined";
import { Box, Button, Chip, List, ListItemButton, ListItemText, Paper, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import type { ReactNode } from "react";
import { Link as RouterLink } from "react-router-dom";
import { historique } from "../api/suivi";
import { listProblemes } from "../api/problemes";
import { sessionsApplication } from "../api/tests";
import { listTaches } from "../api/taches";
import Etat from "../components/Etat";
import EvenementIcone from "../components/EvenementIcone";
import PageHeader from "../components/PageHeader";
import StatutChip from "../components/StatutChip";
import { useAnnuaire } from "../context/AnnuaireContext";
import { useApplications } from "../context/ApplicationsContext";
import { useAsync } from "../hooks/useAsync";
import { dateHeure, enRetard } from "../utils/format";
import { libelleEvenement } from "../utils/libelles";
import { lireApplicationsRecentes } from "../utils/recents";

type Accent = "info" | "error" | "warning" | "success";

function Indicateur({ titre, valeur, detail, alerte, icone, accent }: {
  titre: string; valeur: number; detail?: string; alerte?: boolean; icone: ReactNode; accent: Accent;
}) {
  return (
    <Paper sx={{ p: 2, height: "100%", display: "flex", alignItems: "center", gap: 1.5, borderTop: "3px solid", borderTopColor: `${accent}.main` }}>
      <Box sx={(theme) => ({
        display: "grid", placeItems: "center", width: 44, height: 44, borderRadius: 2, flexShrink: 0,
        color: theme.palette[accent].main, bgcolor: alpha(theme.palette[accent].main, 0.12),
      })}>
        {icone}
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="body2" color="text.secondary">{titre}</Typography>
        <Typography variant="h4" component="p" fontWeight={700} lineHeight={1.15}>{valeur}</Typography>
        {detail && <Typography variant="caption" color={alerte ? "error.main" : "text.secondary"}>{detail}</Typography>}
      </Box>
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
      <PageHeader titre="Vue d’ensemble" sousTitre="Le suivi de vos applications et de leur maintenance, au même endroit." />
      <Etat loading={loading} error={error}>
        <Paper sx={{
          p: { xs: 2.5, md: 3 },
          mb: 2,
          color: "text.primary",
          borderColor: "divider",
          display: "flex",
          alignItems: { xs: "flex-start", sm: "center" },
          justifyContent: "space-between",
          gap: 2,
          flexDirection: { xs: "column", sm: "row" },
        }}>
          <Box>
            <Typography variant="overline" color="secondary.main" sx={{ letterSpacing: 1.2 }}>PILOTAGE GLOBAL</Typography>
            <Typography variant="h5" component="h2" fontWeight={700} sx={{ mb: 0.5 }}>Gardez le contrôle de votre maintenance</Typography>
            <Typography variant="body2" color="text.secondary">
              {applications.length} application(s) accessible(s) · {critiques.length} problème(s) critique(s) ouvert(s)
            </Typography>
          </Box>
          <Button component={RouterLink} to="/problemes" variant="contained" endIcon={<ArrowForwardOutlined />}
            sx={{ whiteSpace: "nowrap" }}>
            Voir les problèmes
          </Button>
        </Paper>
        <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(2, 1fr)", xl: "repeat(4, 1fr)" }, mb: 2 }}>
          <Indicateur accent="info" icone={<AppsOutlined />} titre="Applications actives" valeur={applications.filter((a) => a.statut === "active").length} />
          <Indicateur accent="error" icone={<BugReportOutlined />} titre="Problèmes ouverts" valeur={ouverts.length} detail={`dont ${critiques.length} critique(s)`} alerte={critiques.length > 0} />
          <Indicateur accent="warning" icone={<ChecklistOutlined />} titre="Tâches en cours" valeur={enCours.length} detail={`${retards.length} en retard`} alerte={retards.length > 0} />
          <Indicateur accent="success" icone={<ScienceOutlined />} titre="Tests à valider" valeur={data?.sessions.length ?? 0} />
        </Box>
        <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 3fr) minmax(280px, 2fr)" } }}>
          <Paper sx={{ p: { xs: 1.5, md: 2 }, minWidth: 0 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2} sx={{ px: 0.5, mb: 1 }}>
              <Box>
                <Typography variant="h6" component="h2" fontWeight={700}>À traiter en priorité</Typography>
                <Typography variant="body2" color="text.secondary">Les problèmes ouverts les plus urgents</Typography>
              </Box>
              <Chip size="small" label={`${prioritaires.length} urgent(s)`} color={prioritaires.length ? "error" : "default"} variant="outlined" />
            </Stack>
            <List disablePadding>
              {prioritaires.length === 0 && (
                <Typography color="text.secondary" variant="body2" sx={{ px: 1, py: 3, textAlign: "center" }}>
                  Aucun problème critique ou élevé à traiter.
                </Typography>
              )}
              {prioritaires.map((p) => (
                <ListItemButton key={p.id} component={RouterLink} to={`/applications/${p.application_id}/problemes/${p.id}`}
                  sx={{ borderRadius: 1.5, mb: 0.5, px: 1.25, py: 1 }}>
                  <ListItemText primary={`${p.code} · ${p.titre}`} secondary={trouver(p.application_id)?.nom}
                    primaryTypographyProps={{ fontWeight: 600, noWrap: true }} secondaryTypographyProps={{ variant: "caption" }} />
                  <StatutChip groupe="gravite" valeur={p.gravite} />
                </ListItemButton>
              ))}
            </List>
            <Button component={RouterLink} to="/problemes" size="small" endIcon={<ArrowForwardOutlined />} sx={{ mt: 0.5 }}>
              Tous les problèmes
            </Button>
          </Paper>
          <Paper sx={{ p: { xs: 2, md: 2.5 } }}>
            <Typography variant="h6" component="h2" fontWeight={700}>Activité récente</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Les dernières actions sur vos applications</Typography>
            <Stack spacing={0}>
              {(data?.evenements ?? []).length === 0 && (
                <Typography color="text.secondary" variant="body2" sx={{ py: 2 }}>Aucune activité récente.</Typography>
              )}
              {(data?.evenements ?? []).map((e) => (
                <Box key={e.id} sx={{ display: "flex", gap: 1.25, alignItems: "flex-start", py: 1, borderBottom: 1, borderColor: "divider", "&:last-child": { borderBottom: 0 } }}>
                  <EvenementIcone type={e.type_element} action={e.action} />
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="body2" fontWeight={600}>{libelleEvenement(e.action)}</Typography>
                    <Typography variant="caption" color="text.secondary">{nom(e.auteur_id)} · {dateHeure(e.cree_le)}</Typography>
                  </Box>
                </Box>
              ))}
            </Stack>
          </Paper>
        </Box>
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" component="h2" fontWeight={700} sx={{ mb: 1.5 }}>Applications récemment consultées</Typography>
          <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" } }}>
            {recentes.length === 0 && <Typography variant="body2" color="text.secondary">Aucune application consultée récemment.</Typography>}
            {recentes.map((a) => a && (
              <Paper key={a.id} component={RouterLink} to={`/applications/${a.id}`} sx={{
                display: "flex", alignItems: "center", gap: 1.5, p: 1.5, textDecoration: "none", color: "text.primary",
                transition: "border-color .15s, transform .15s",
                "&:hover": { borderColor: "secondary.main", transform: "translateY(-2px)" },
              }}>
                <Box sx={(theme) => {
                  const tone = a.statut === "active" ? "success" : a.statut === "en_maintenance" ? "warning" : "info";
                  return {
                    display: "grid", placeItems: "center", width: 38, height: 38, borderRadius: 1.5, flexShrink: 0,
                    bgcolor: alpha(theme.palette[tone].main, theme.palette.mode === "light" ? 0.12 : 0.2),
                    color: theme.palette.mode === "light" ? theme.palette[tone].dark : theme.palette[tone].light,
                    fontWeight: 700,
                  };
                }}>
                  {a.nom.charAt(0).toUpperCase()}
                </Box>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography fontWeight={600} noWrap>{a.nom}</Typography>
                  <StatutChip groupe="statutApplication" valeur={a.statut} />
                </Box>
                <ArrowForwardOutlined fontSize="small" color="action" />
              </Paper>
            ))}
          </Box>
        </Box>
      </Etat>
    </>
  );
}
