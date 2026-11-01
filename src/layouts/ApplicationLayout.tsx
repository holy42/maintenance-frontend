import ArrowBack from "@mui/icons-material/ArrowBack";
import ExpandMore from "@mui/icons-material/ExpandMore";
import PlayArrowOutlined from "@mui/icons-material/PlayArrowOutlined";
import { Alert, Box, Button, IconButton, Menu, MenuItem, Stack, Tab, Tabs, Typography } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { Link as RouterLink, Outlet, useLocation, useNavigate, useParams } from "react-router-dom";
import { getApplication, mesPermissions } from "../api/applications";
import Etat from "../components/Etat";
import PageHeader from "../components/PageHeader";
import StatutChip from "../components/StatutChip";
import { ApplicationContext, type ApplicationCtx } from "../context/ApplicationContext";
import { useApplications } from "../context/ApplicationsContext";
import { useAuth } from "../context/AuthContext";
import { useAsync } from "../hooks/useAsync";
import { PERM } from "../utils/permissions";
import { noterApplicationRecente } from "../utils/recents";

const PRINCIPAUX = [
  { valeur: "vue", seg: "", libelle: "Vue d'ensemble" },
  { valeur: "verifications", seg: "verifications", libelle: "Vérifications" },
  { valeur: "problemes", seg: "problemes", libelle: "Problèmes" },
  { valeur: "taches", seg: "taches", libelle: "Tâches" },
  { valeur: "tests", seg: "tests", libelle: "Tests" },
  { valeur: "discussions", seg: "discussions", libelle: "Discussions" },
];
const PLUS = [
  { seg: "criteres", libelle: "Critères" },
  { seg: "depot", libelle: "Dépôt Git" },
  { seg: "historique", libelle: "Historique" },
  { seg: "rapports", libelle: "Rapports" },
  { seg: "notifications", libelle: "Notifications" },
  { seg: "membres", libelle: "Membres et permissions" },
  { seg: "parametres", libelle: "Paramètres" },
];

/** Niveau 2 : l'espace d'une application. Son menu est horizontal ; le menu global reste à gauche (rétractable). */
export default function ApplicationLayout() {
  const { applicationId } = useParams();
  const id = Number(applicationId);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { user } = useAuth();
  const { recharger: rechargerListe } = useApplications();
  const { data: application, loading, error, reload } = useAsync(() => getApplication(id), [id]);
  const { data: perms } = useAsync(() => mesPermissions(id), [id]);
  const [ancre, setAncre] = useState<HTMLElement | null>(null);

  useEffect(() => { if (!Number.isNaN(id)) noterApplicationRecente(id); }, [id]);

  const segment = pathname.split("/")[3] ?? "";
  const plusActif = PLUS.find((p) => p.seg === segment);
  const valeurOnglet = plusActif ? "plus" : PRINCIPAUX.find((p) => p.seg === segment)?.valeur ?? false;

  const contexte = useMemo<ApplicationCtx | null>(() => {
    if (!application) return null;
    return {
      application,
      archivee: application.statut === "archivee",
      recharger: () => { reload(); rechargerListe(); },
      peut: (code) => Boolean(user?.est_admin) || Boolean(perms && (perms.permissions.includes("*") || perms.permissions.includes(code))),
    };
  }, [application, perms, user, reload, rechargerListe]);

  return (
    <Etat loading={loading} error={error}>
      {application && contexte && (
        <ApplicationContext.Provider value={contexte}>
          <PageHeader
            fil={[{ libelle: "Applications", to: "/applications" }, { libelle: application.nom }]}
            titre={
              <Stack direction="row" spacing={1} alignItems="center">
                <IconButton component={RouterLink} to="/applications" aria-label="Retour aux applications" size="small"><ArrowBack /></IconButton>
                <span>{application.nom}</span>
                <StatutChip groupe="statutApplication" valeur={application.statut} />
              </Stack>
            }
            sousTitre={application.technologies.join(" · ") || undefined}
            actions={contexte.peut(PERM.VERIFICATION_LANCER) && !contexte.archivee ? (
              <Button variant="contained" startIcon={<PlayArrowOutlined />} component={RouterLink} to={`/applications/${id}/verifications/nouvelle`}>
                Lancer une vérification
              </Button>
            ) : undefined}
          />
          {contexte.archivee && <Alert severity="info" sx={{ mb: 2 }}>Application archivée : consultation en lecture seule.</Alert>}

          <Tabs value={valeurOnglet} variant="scrollable" scrollButtons="auto" sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}
            onChange={(_, v: string) => { if (v !== "plus") navigate(`/applications/${id}/${PRINCIPAUX.find((p) => p.valeur === v)?.seg ?? ""}`); }}>
            {PRINCIPAUX.map((p) => <Tab key={p.valeur} value={p.valeur} label={p.libelle} />)}
            <Tab value="plus" label={<Stack direction="row" alignItems="center">{plusActif?.libelle ?? "Plus"}<ExpandMore fontSize="small" /></Stack>}
              onClick={(e) => setAncre(e.currentTarget)} />
          </Tabs>
          <Menu anchorEl={ancre} open={Boolean(ancre)} onClose={() => setAncre(null)}>
            {PLUS.map((p) => (
              <MenuItem key={p.seg} selected={p.seg === segment} onClick={() => { setAncre(null); navigate(`/applications/${id}/${p.seg}`); }}>
                {p.libelle}
              </MenuItem>
            ))}
          </Menu>

          <Box><Outlet /></Box>
        </ApplicationContext.Provider>
      )}
      {!loading && !error && !application && <Typography>Application introuvable.</Typography>}
    </Etat>
  );
}
