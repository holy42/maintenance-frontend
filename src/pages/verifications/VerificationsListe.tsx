import BoutonAction from "../../components/BoutonAction";
import ArrowForwardOutlined from "@mui/icons-material/ArrowForwardOutlined";
import CheckCircleOutline from "@mui/icons-material/CheckCircleOutline";
import ErrorOutlineOutlined from "@mui/icons-material/ErrorOutlineOutlined";
import PlayCircleOutline from "@mui/icons-material/PlayCircleOutline";
import ScheduleOutlined from "@mui/icons-material/ScheduleOutlined";
import { Box, Chip, ListItemButton, Paper, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useCallback } from "react";
import { Link as RouterLink } from "react-router-dom";
import { listVerifications } from "../../api/verifications";
import type { Verification } from "../../api/types";
import Etat from "../../components/Etat";
import PageHeader from "../../components/PageHeader";
import StatutChip from "../../components/StatutChip";
import { useApplicationOptionnelle } from "../../context/ApplicationContext";
import { useApplications } from "../../context/ApplicationsContext";
import { useAnnuaire } from "../../context/AnnuaireContext";
import { useAsync } from "../../hooks/useAsync";
import { usePolling } from "../../hooks/usePolling";
import { dateHeure } from "../../utils/format";
import { PERM } from "../../utils/permissions";

/** Historique des vérifications : d'une application (espace de l'application) ou de toutes (menu global). */
export default function VerificationsListe() {
  const ctx = useApplicationOptionnelle();
  const { applications, trouver } = useApplications();
  const { nom } = useAnnuaire();
  const { data, loading, error, reload } = useAsync<Verification[]>(async () => {
    if (ctx) return listVerifications(ctx.application.id, { limit: 50 });
    const parApp = await Promise.all(applications.map((a) => listVerifications(a.id, { limit: 10 }).catch(() => [] as Verification[])));
    return parApp.flat().sort((a, b) => b.debut_le.localeCompare(a.debut_le));
  }, [ctx?.application.id, applications.length]);

  const enCours = (data ?? []).some((v) => v.statut === "en_attente" || v.statut === "en_cours");
  usePolling(useCallback(reload, [reload]), enCours);

  return (
    <>
      <PageHeader titre="Vérifications" sousTitre={enCours ? "Une vérification est en cours : la liste se met à jour toute seule." : undefined}
        actions={ctx && ctx.peut(PERM.VERIFICATION_LANCER) && !ctx.archivee
          ? <BoutonAction variant="contained" startIcon={<PlayCircleOutline />} component={RouterLink} to={`/applications/${ctx.application.id}/verifications/nouvelle`}>Nouvelle vérification</BoutonAction> : undefined} />
      <Etat loading={loading && !data} error={error}>
        <Paper sx={{ p: { xs: 1.5, sm: 2 }, mb: 1.5 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
            <Box>
              <Typography variant="subtitle1" fontWeight={700}>{(data ?? []).length} vérification(s)</Typography>
              <Typography variant="caption" color="text.secondary">Historique des contrôles de vos applications</Typography>
            </Box>
            {enCours && <Chip size="small" color="info" icon={<PlayCircleOutline />} label="Mise à jour en direct" />}
          </Stack>
        </Paper>
        {(data ?? []).length === 0 ? (
          <Paper sx={{ p: 5, textAlign: "center", borderStyle: "dashed" }}>
            <PlayCircleOutline color="disabled" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h6" fontWeight={700}>Aucune vérification</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>Les vérifications réalisées apparaîtront ici.</Typography>
          </Paper>
        ) : (
          <Stack spacing={1.25}>
            {(data ?? []).map((v) => {
              const ton = v.statut === "terminee" ? "success" : v.statut === "echouee" ? "error" : v.statut === "en_cours" ? "info" : "warning";
              const icone = v.statut === "terminee" ? <CheckCircleOutline /> : v.statut === "echouee" ? <ErrorOutlineOutlined /> : v.statut === "en_cours" ? <PlayCircleOutline /> : <ScheduleOutlined />;
              return (
                <Paper key={v.id} sx={{ overflow: "hidden" }}>
                  <ListItemButton component={RouterLink} to={`/applications/${v.application_id}/verifications/${v.id}`}
                    sx={{ p: { xs: 1.5, sm: 2 }, gap: 1.5, alignItems: "flex-start" }}>
                    <Box sx={(theme) => ({
                      width: 44, height: 44, borderRadius: 2, display: "grid", placeItems: "center", flexShrink: 0,
                      color: theme.palette[ton].main,
                      bgcolor: alpha(theme.palette[ton].main, theme.palette.mode === "light" ? 0.12 : 0.2),
                    })}>
                      {icone}
                    </Box>
                    <Stack spacing={0.75} sx={{ minWidth: 0, flex: 1 }}>
                      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                        <Typography variant="subtitle2" fontWeight={700}>Vérification #{v.id}</Typography>
                        <StatutChip groupe="statutVerification" valeur={v.statut} />
                        {!ctx && <Chip size="small" variant="outlined" label={trouver(v.application_id)?.nom ?? `Application #${v.application_id}`} />}
                      </Stack>
                      <Typography variant="body2" color="text.secondary">
                        {dateHeure(v.debut_le)} · {nom(v.declenchee_par)}
                      </Typography>
                      <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap>
                        <Chip size="small" variant="outlined" label={`Branche · ${v.branche}`} />
                        <Chip size="small" variant="outlined" label={`Commit · ${v.commit_analyse?.slice(0, 8) ?? "—"}`} />
                        {v.resultat_global && <Chip size="small" color="secondary" label={v.resultat_global} />}
                      </Stack>
                      {v.motif_echec && <Typography variant="caption" color="error.main">{v.motif_echec}</Typography>}
                    </Stack>
                    <ArrowForwardOutlined fontSize="small" color="action" sx={{ alignSelf: "center", flexShrink: 0 }} />
                  </ListItemButton>
                </Paper>
              );
            })}
          </Stack>
        )}
      </Etat>
    </>
  );
}
