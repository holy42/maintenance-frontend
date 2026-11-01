import { Alert, Box, Button, Checkbox, FormControlLabel, Paper, Radio, RadioGroup, Stack, TextField, Typography } from "@mui/material";
import { useState } from "react";
import { Link as RouterLink, useParams } from "react-router-dom";
import { messageErreur } from "../../api/client";
import { detailSession, prendreSession, retourSession } from "../../api/tests";
import Etat from "../../components/Etat";
import PageHeader from "../../components/PageHeader";
import StatutChip from "../../components/StatutChip";
import { useApplication } from "../../context/ApplicationContext";
import { useAnnuaire } from "../../context/AnnuaireContext";
import { useAuth } from "../../context/AuthContext";
import { useNotifier } from "../../context/SnackbarContext";
import { useAsync } from "../../hooks/useAsync";
import { dateHeure } from "../../utils/format";
import { PERM } from "../../utils/permissions";

/** Ce qu'il faut tester + retour du testeur : « validé » ou « non validé » (commentaire obligatoire en cas de refus). */
export default function TestSession() {
  const { application, peut } = useApplication();
  const id = Number(useParams().sessionId);
  const { user } = useAuth();
  const { nom } = useAnnuaire();
  const notifier = useNotifier();
  const { data, loading, error, reload } = useAsync(() => detailSession(id), [id]);
  const [decision, setDecision] = useState<"" | "valide" | "non_valide">("");
  const [commentaire, setCommentaire] = useState("");
  const [preuve, setPreuve] = useState("");
  const [environnement, setEnvironnement] = useState("");
  const [criteres, setCriteres] = useState<Record<number, boolean>>({});
  const [erreur, setErreur] = useState<string | null>(null);

  const s = data?.session;
  const peutTester = peut(PERM.TEST_VALIDER);
  const monTest = s?.statut === "en_cours" && s.testeur_id === user?.id;

  async function prendre() {
    try { await prendreSession(id); reload(); } catch (e) { notifier(messageErreur(e), "error"); }
  }

  async function envoyer() {
    if (!decision) { setErreur("Choisissez « Validé » ou « Non validé »."); return; }
    if (decision === "non_valide" && !commentaire.trim()) { setErreur("Un commentaire est obligatoire pour un retour non validé."); return; }
    setErreur(null);
    try {
      await retourSession(id, {
        valide: decision === "valide", commentaire: commentaire || undefined, preuve: preuve || undefined, environnement: environnement || undefined,
        criteres: Object.entries(criteres).map(([cid, ok]) => ({ critere_acceptation_id: Number(cid), satisfait: ok })),
      });
      notifier(decision === "valide" ? "Test validé." : "Test non validé : le problème est rouvert.");
      reload();
    } catch (e) { setErreur(messageErreur(e)); }
  }

  return (
    <Etat loading={loading} error={error}>
      {data && s && (
        <>
          <PageHeader titre={`Test · passage n°${s.numero}`} fil={[{ libelle: "Tests", to: `/applications/${application.id}/tests` }, { libelle: `Passage n°${s.numero}` }]}
            sousTitre={`Branche à tester : ${s.branche_testee}${s.testeur_id ? ` · testeur : ${nom(s.testeur_id)}` : ""}`}
            actions={<>
              <StatutChip groupe="statutSession" valeur={s.statut} taille="medium" />
              <Button component={RouterLink} to={`/applications/${application.id}/problemes/${data.probleme_id}`} variant="outlined">Voir le problème</Button>
            </>} />
          <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "1.3fr 1fr" } }}>
            <Stack spacing={2}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle1" fontWeight={600}>Description du test</Typography>
                <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>{data.description_test}</Typography>
              </Paper>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle1" fontWeight={600}>Critères d'acceptation des tâches</Typography>
                {data.criteres_acceptation.length === 0 && <Typography variant="body2" color="text.secondary">Aucun critère d'acceptation.</Typography>}
                {data.criteres_acceptation.map((c) => (
                  <FormControlLabel key={c.id} label={c.texte} disabled={!monTest}
                    control={<Checkbox checked={criteres[c.id] ?? false} onChange={(e) => setCriteres({ ...criteres, [c.id]: e.target.checked })} />} />
                ))}
              </Paper>
            </Stack>
            <Paper sx={{ p: 2, alignSelf: "start" }}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>Votre retour</Typography>
              {s.statut === "a_tester" && <Button variant="contained" disabled={!peutTester} onClick={prendre}>Prendre en charge</Button>}
              {s.statut === "a_tester" && <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>Vous ne pouvez pas tester une correction dont vous êtes l'auteur.</Typography>}
              {monTest && (
                <Stack spacing={1.5}>
                  <RadioGroup value={decision} onChange={(e) => setDecision(e.target.value as "valide" | "non_valide")}>
                    <FormControlLabel value="valide" control={<Radio />} label="Validé : la correction fonctionne" />
                    <FormControlLabel value="non_valide" control={<Radio />} label="Non validé : retour au développeur (problème rouvert)" />
                  </RadioGroup>
                  <TextField size="small" label="Environnement testé" value={environnement} onChange={(e) => setEnvironnement(e.target.value)} />
                  <TextField size="small" multiline minRows={3} label={decision === "non_valide" ? "Commentaire (obligatoire)" : "Commentaire"} value={commentaire} onChange={(e) => setCommentaire(e.target.value)} />
                  <TextField size="small" multiline minRows={3} label="Étapes et résultat observé (facultatif)" value={preuve} onChange={(e) => setPreuve(e.target.value)} />
                  {erreur && <Alert severity="error">{erreur}</Alert>}
                  <Button variant="contained" onClick={envoyer}>Envoyer le retour</Button>
                </Stack>
              )}
              {(s.statut === "valide" || s.statut === "non_valide") && (
                <Stack spacing={0.5}>
                  <Typography variant="body2">Retour rendu le {dateHeure(s.decide_le)} par {nom(s.testeur_id)}.</Typography>
                  {s.commentaire && <Typography variant="body2">Commentaire : {s.commentaire}</Typography>}
                  {s.preuve && <Typography variant="body2" color="text.secondary">{s.preuve}</Typography>}
                </Stack>
              )}
              {s.statut === "en_cours" && !monTest && <Alert severity="info">Ce test est pris en charge par {nom(s.testeur_id)}.</Alert>}
            </Paper>
          </Box>
        </>
      )}
    </Etat>
  );
}
