import BoutonAction from "../components/BoutonAction";
import ArrowBack from "@mui/icons-material/ArrowBack";
import PlayArrowOutlined from "@mui/icons-material/PlayArrowOutlined";
import { Alert, Box, IconButton, Stack, Typography } from "@mui/material";
import { useEffect, useMemo } from "react";
import { Link as RouterLink, Outlet, useLocation, useNavigate, useParams } from "react-router-dom";
import { getApplication, mesPermissions } from "../api/applications";
import Etat from "../components/Etat";
import OngletsHorizontaux from "../components/OngletsHorizontaux";
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
const ONGLETS = [
  ...PRINCIPAUX,
  ...PLUS.map((p) => ({ valeur: p.seg, ...p })),
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
  const applicationActuelle = application?.id === id ? application : null;

  useEffect(() => { if (!Number.isNaN(id)) noterApplicationRecente(id); }, [id]);

  const segment = pathname.split("/")[3] ?? "";
  const valeurOnglet = ONGLETS.find((p) => p.seg === segment)?.valeur ?? false;

  const contexte = useMemo<ApplicationCtx | null>(() => {
    if (!applicationActuelle) return null;
    return {
      application: applicationActuelle,
      archivee: applicationActuelle.statut === "archivee",
      recharger: () => { reload(); rechargerListe(); },
      peut: (code) => Boolean(user?.est_admin) || Boolean(perms && (perms.permissions.includes("*") || perms.permissions.includes(code))),
    };
  }, [applicationActuelle, perms, user, reload, rechargerListe]);

  return (
    <>
      {applicationActuelle && error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Etat loading={loading && !applicationActuelle} error={applicationActuelle ? null : error}>
      {applicationActuelle && contexte && (
        <ApplicationContext.Provider value={contexte}>
          <Box sx={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0, minHeight: 0 }}>
            <PageHeader
              fil={[{ libelle: "Applications", to: "/applications" }, { libelle: applicationActuelle.nom }]}
              titre={
                <Stack direction="row" spacing={1} alignItems="center">
                  <IconButton component={RouterLink} to="/applications" aria-label="Retour aux applications" size="small"><ArrowBack /></IconButton>
                  <span>{applicationActuelle.nom}</span>
                  <StatutChip groupe="statutApplication" valeur={applicationActuelle.statut} />
                </Stack>
              }
              sousTitre={applicationActuelle.technologies.join(" · ") || undefined}
              actions={contexte.peut(PERM.VERIFICATION_LANCER) && !contexte.archivee ? (
                <BoutonAction variant="contained" startIcon={<PlayArrowOutlined />} component={RouterLink} to={`/applications/${id}/verifications/nouvelle`}>
                  Lancer une vérification
                </BoutonAction>
              ) : undefined}
            />
            {contexte.archivee && <Alert severity="info" sx={{ mb: 2 }}>Application archivée : consultation en lecture seule.</Alert>}

            <Box sx={{
              display: "flex", flexDirection: "column", flex: 1, minWidth: 0, minHeight: 0,
              bgcolor: "background.paper", borderRadius: 2, overflow: "hidden",
            }}>
              <OngletsHorizontaux
                valeur={valeurOnglet}
                onglets={ONGLETS.map(({ valeur, libelle }) => ({ valeur, libelle }))}
                onChange={(valeur) => {
                  const onglet = ONGLETS.find((p) => p.valeur === valeur);
                  if (onglet) navigate(`/applications/${id}/${onglet.seg}`);
                }}
              />

              <Box sx={{
                display: "flex", flexDirection: "column", flex: 1, minWidth: 0, minHeight: 0,
                p: { xs: 1.5, sm: 2 }, "& > :last-child": { flexGrow: 1, minHeight: 0 },
              }}>
                <Outlet />
              </Box>
            </Box>
          </Box>
        </ApplicationContext.Provider>
      )}
      {!loading && !error && !applicationActuelle && <Typography>Application introuvable.</Typography>}
      </Etat>
    </>
  );
}
