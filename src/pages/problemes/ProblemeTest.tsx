import AutoAwesomeOutlined from "@mui/icons-material/AutoAwesomeOutlined";
import { Alert, Button, List, ListItemButton, ListItemText, Paper, Stack, TextField, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { messageErreur } from "../../api/client";
import { definirDescriptionTest, demanderTest, descriptionProposee, lireTest } from "../../api/tests";
import Etat from "../../components/Etat";
import StatutChip from "../../components/StatutChip";
import { useApplication } from "../../context/ApplicationContext";
import { useAnnuaire } from "../../context/AnnuaireContext";
import { useProbleme } from "../../context/ProblemeContext";
import { useNotifier } from "../../context/SnackbarContext";
import { useAsync } from "../../hooks/useAsync";
import { dateHeure } from "../../utils/format";
import { PERM } from "../../utils/permissions";

/** Un seul test par problème (avec sa description), plusieurs passages. Demande possible seulement si toutes les tâches sont terminées. */
export default function ProblemeTest() {
  const { application, peut, archivee } = useApplication();
  const { probleme, recharger } = useProbleme();
  const { nom } = useAnnuaire();
  const notifier = useNotifier();
  const { data, loading, error, reload } = useAsync(() => lireTest(probleme.id), [probleme.id, probleme.statut]);
  const [description, setDescription] = useState("");
  const [attente, setAttente] = useState(false);
  const modifiable = peut(PERM.PROBLEME_MODIFIER) && !archivee;

  useEffect(() => { if (data?.test) setDescription(data.test.description); }, [data?.test]);

  async function sauvegarder() {
    try { await definirDescriptionTest(probleme.id, description.trim()); notifier("Description du test enregistrée."); reload(); } catch (e) { notifier(messageErreur(e), "error"); }
  }
  async function proposer() {
    setAttente(true);
    try { setDescription((await descriptionProposee(probleme.id)).description); } catch (e) { notifier(messageErreur(e), "error"); } finally { setAttente(false); }
  }
  async function demander() {
    if (!description.trim()) { notifier("Rédigez d'abord la description du test.", "warning"); return; }
    try { await demanderTest(probleme.id, description.trim()); notifier("Test demandé."); reload(); recharger(); }
    catch (e) { notifier(messageErreur(e), "error"); }     // 409 : tâches non terminées, décision manquante...
  }

  return (
    <Etat loading={loading} error={error}>
      <Stack spacing={2}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>Description du test</Typography>
          <TextField multiline minRows={4} fullWidth size="small" value={description} onChange={(e) => setDescription(e.target.value)} disabled={!modifiable}
            placeholder="Étapes à suivre et résultat attendu" />
          <Stack direction="row" spacing={1} sx={{ mt: 1 }} flexWrap="wrap" useFlexGap>
            <Button variant="outlined" startIcon={<AutoAwesomeOutlined />} onClick={proposer} disabled={!modifiable || attente}>{attente ? "L'IA rédige…" : "Proposer avec l'IA"}</Button>
            <Button variant="outlined" onClick={sauvegarder} disabled={!modifiable || !description.trim()}>Enregistrer la description</Button>
            <Button variant="contained" onClick={demander} disabled={!modifiable || probleme.statut !== "en_cours"}>Demander le test</Button>
          </Stack>
          <Alert severity="info" sx={{ mt: 2 }}>
            Le test ne peut être demandé que si le problème est « en cours », qu'une décision de correction est enregistrée et que toutes ses tâches sont terminées (les tâches arrêtées ne bloquent pas).
            Un test non validé fait passer le problème à « rouvert ».
          </Alert>
        </Paper>
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle1" fontWeight={600}>Passages de test</Typography>
          <List>
            {(data?.sessions ?? []).length === 0 && <Typography color="text.secondary" variant="body2">Aucun passage.</Typography>}
            {(data?.sessions ?? []).map((s) => (
              <ListItemButton key={s.id} component={RouterLink} to={`/applications/${application.id}/tests/${s.id}`}>
                <ListItemText primary={`Passage n°${s.numero} · branche ${s.branche_testee}`}
                  secondary={`Demandé le ${dateHeure(s.demande_le)}${s.testeur_id ? ` · testeur : ${nom(s.testeur_id)}` : " · pas encore pris en charge"}`} />
                <StatutChip groupe="statutSession" valeur={s.statut} />
              </ListItemButton>
            ))}
          </List>
        </Paper>
      </Stack>
    </Etat>
  );
}
