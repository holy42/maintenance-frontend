import BoutonAction from "../../components/BoutonAction";
import ChampTexte from "../../components/ChampTexte";
import { Alert, Box, Chip, Divider, Paper, Stack, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { commitsDepot, definirDepot, getDepot, testerDepot } from "../../api/applications";
import { messageErreur } from "../../api/client";
import Etat from "../../components/Etat";
import PageHeader from "../../components/PageHeader";
import { useApplication } from "../../context/ApplicationContext";
import { useNotifier } from "../../context/SnackbarContext";
import { useAsync } from "../../hooks/useAsync";
import { dateHeure } from "../../utils/format";
import { PERM } from "../../utils/permissions";

/** Un seul dépôt par application, en lecture seule : la plateforme n'écrit jamais dans le dépôt. */
export default function DepotGit() {
  const { application, peut, archivee } = useApplication();
  const notifier = useNotifier();
  const { data: depot, loading, error, reload } = useAsync(() => getDepot(application.id), [application.id]);
  const [url, setUrl] = useState("");
  const [branche, setBranche] = useState("develop");
  const [jeton, setJeton] = useState("");
  const [branches, setBranches] = useState<string[] | null>(null);
  const [commits, setCommits] = useState<{ commit: string; auteur: string; date: string; sujet: string }[] | null>(null);
  const modifiable = peut(PERM.APPLICATION_CONFIGURER) && !archivee;

  useEffect(() => { if (depot) { setUrl(depot.url); setBranche(depot.branche_defaut); } }, [depot]);

  async function enregistrer() {
    try { await definirDepot(application.id, { url: url.trim(), branche_defaut: branche.trim() || "develop", jeton: jeton || undefined }); setJeton(""); notifier("Dépôt enregistré."); reload(); }
    catch (e) { notifier(messageErreur(e), "error"); }
  }
  async function tester() {
    try {
      const r = await testerDepot(application.id);
      if ("branches" in r) { setBranches(r.branches); notifier("Connexion réussie."); } else notifier(r.message, "warning");
    } catch (e) { notifier(messageErreur(e), "error"); }
  }
  async function afficherCommits() {
    try { setCommits(await commitsDepot(application.id, branche)); } catch (e) { notifier(messageErreur(e), "error"); }
  }

  return (
    <Etat loading={loading} error={error}>
      <>
      <PageHeader titre="Dépôt Git" sousTitre="Configurez une source de code consultée en lecture seule pour cette application." />
      <Stack spacing={2} sx={{ width: "100%", minWidth: 0 }}>
        <Paper sx={{ overflow: "hidden", borderColor: "white" }}>
          <Box sx={{ p: { xs: 2, sm: 2.5 } }}>
            <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} spacing={1}>
              <Box>
                <Typography variant="overline" color="secondary.main" letterSpacing={1}>CONFIGURATION</Typography>
                <Typography variant="h6" component="h2" fontWeight={700}>Connexion au dépôt</Typography>
              </Box>
              <Chip
                size="small"
                label={depot ? "Dépôt configuré" : "Non configuré"}
                color={depot ? "success" : "default"}
                variant={depot ? "filled" : "outlined"}
              />
            </Stack>
            <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", sm: "1.5fr 1fr" }, mt: 2 }}>
              <ChampTexte fullWidth label="URL du dépôt" value={url} onChange={(e) => setUrl(e.target.value)} disabled={!modifiable}
                placeholder="https://… ou git@…"
                sx={{ gridColumn: { xs: "auto", sm: "1 / -1" } }} />
              <ChampTexte fullWidth label="Branche par défaut" value={branche} onChange={(e) => setBranche(e.target.value)} disabled={!modifiable}
                helperText="Branche utilisée pour les vérifications." />
              <ChampTexte fullWidth label="Jeton d'accès" type="password" value={jeton} onChange={(e) => setJeton(e.target.value)} disabled={!modifiable}
                placeholder={depot?.jeton_configure ? "Déjà configuré — laisser vide pour le conserver" : "Facultatif"}
                helperText="Chiffré côté serveur et jamais réaffiché." />
            </Box>
            <Stack direction={{ xs: "column-reverse", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} spacing={1.5} sx={{ mt: 2 }}>
              {depot
                ? <Typography variant="caption" color="text.secondary">Dernière synchronisation : {dateHeure(depot.derniere_synchro_le)}</Typography>
                : <Typography variant="caption" color="text.secondary">Enregistrez le dépôt pour tester la connexion et consulter ses branches.</Typography>}
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                <BoutonAction variant="outlined" onClick={tester} disabled={!depot} sx={{ width: { xs: "100%", sm: "auto" } }}>Tester la connexion</BoutonAction>
                <BoutonAction variant="contained" onClick={enregistrer} disabled={!modifiable || !url.trim()} sx={{ width: { xs: "100%", sm: "auto" } }}>Enregistrer</BoutonAction>
              </Stack>
            </Stack>
          </Box>
          <Divider />
        </Paper>
        {branches && (
          <Paper sx={{ p: { xs: 2, sm: 2.5 } }}>
            <Typography variant="h6" component="h2" fontWeight={700}>Branches disponibles</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>Choisissez une branche pour la définir comme branche par défaut.</Typography>
            {branches.length === 0 && <Typography variant="body2" color="text.secondary">Aucune branche disponible.</Typography>}
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {branches.map((b) => (
                <Chip key={b} label={b} onClick={() => setBranche(b)} clickable
                  color={b === branche ? "primary" : "default"} variant={b === branche ? "filled" : "outlined"}
                  sx={{ fontFamily: "monospace" }} />
              ))}
            </Stack>
          </Paper>
        )}
        {depot && (
          <Paper sx={{ p: { xs: 2, sm: 2.5 } }}>
            <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} spacing={1}>
              <Box>
                <Typography variant="h6" component="h2" fontWeight={700}>Historique des commits</Typography>
                <Typography variant="body2" color="text.secondary">Branche : <Box component="span" sx={{ fontFamily: "monospace", color: "text.primary" }}>{branche}</Box></Typography>
              </Box>
              <BoutonAction size="small" variant="outlined" onClick={afficherCommits}>Afficher les commits</BoutonAction>
            </Stack>
            {commits === null
              ? <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>Chargez les derniers commits de cette branche.</Typography>
              : commits.length === 0
                ? <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>Aucun commit disponible pour cette branche.</Typography>
                : <Stack spacing={1} sx={{ mt: 2 }}>
                  {commits.map((c) => (
                    <Paper key={c.commit} sx={{ p: 1.5, bgcolor: "action.hover" }}>
                      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} spacing={0.75}>
                        <Typography variant="body2" fontWeight={600}>{c.sujet}</Typography>
                        <Chip size="small" variant="outlined" label={c.commit.slice(0, 8)} sx={{ fontFamily: "monospace", alignSelf: { xs: "flex-start", sm: "center" } }} />
                      </Stack>
                      <Typography variant="caption" color="text.secondary">{c.auteur} · {dateHeure(c.date)}</Typography>
                    </Paper>
                  ))}
                </Stack>}
          </Paper>
        )}
      </Stack>
      </>
    </Etat>
  );
}
