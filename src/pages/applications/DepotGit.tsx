import { Alert, Button, Chip, List, ListItem, ListItemText, Paper, Stack, TextField, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { commitsDepot, definirDepot, getDepot, testerDepot } from "../../api/applications";
import { messageErreur } from "../../api/client";
import Etat from "../../components/Etat";
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
      <Stack spacing={2} sx={{ maxWidth: 760 }}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>Connexion au dépôt</Typography>
          <Stack spacing={2}>
            <TextField size="small" label="URL du dépôt" value={url} onChange={(e) => setUrl(e.target.value)} disabled={!modifiable} />
            <TextField size="small" label="Branche par défaut" value={branche} onChange={(e) => setBranche(e.target.value)} disabled={!modifiable} />
            <TextField size="small" label="Jeton d'accès" type="password" value={jeton} onChange={(e) => setJeton(e.target.value)} disabled={!modifiable}
              placeholder={depot?.jeton_configure ? "•••••• (déjà configuré, laisser vide pour le conserver)" : ""}
              helperText="Chiffré côté serveur et jamais réaffiché." />
            <Stack direction="row" spacing={1}>
              <Button variant="outlined" onClick={tester} disabled={!depot}>Tester la connexion</Button>
              <Button variant="contained" onClick={enregistrer} disabled={!modifiable || !url.trim()}>Enregistrer</Button>
            </Stack>
            {depot && <Typography variant="caption" color="text.secondary">Dernière synchronisation : {dateHeure(depot.derniere_synchro_le)}</Typography>}
          </Stack>
          <Alert severity="info" sx={{ mt: 2 }}>Accès en lecture seule : la plateforme lit les branches et les commits mais n'écrit jamais dans le dépôt.</Alert>
        </Paper>
        {branches && (
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>Branches</Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {branches.map((b) => <Chip key={b} label={b} onClick={() => setBranche(b)} color={b === branche ? "primary" : "default"} />)}
            </Stack>
          </Paper>
        )}
        {depot && (
          <Paper sx={{ p: 2 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="subtitle1" fontWeight={600}>Derniers commits de {branche}</Typography>
              <Button size="small" onClick={afficherCommits}>Afficher</Button>
            </Stack>
            {commits && <List dense>{commits.map((c) => (
              <ListItem key={c.commit}><ListItemText primary={`${c.commit.slice(0, 8)} · ${c.sujet}`} secondary={`${c.auteur} · ${dateHeure(c.date)}`} /></ListItem>
            ))}</List>}
          </Paper>
        )}
      </Stack>
    </Etat>
  );
}
