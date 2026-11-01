import { Alert, Button, Checkbox, FormControlLabel, Paper, Radio, RadioGroup, Stack, TextField, Typography } from "@mui/material";
import { useState } from "react";
import { messageErreur } from "../../api/client";
import { creerDecision, listDecisions, listDiagnostics } from "../../api/problemes";
import type { TypeDecision } from "../../api/types";
import ChampSelect from "../../components/ChampSelect";
import Etat from "../../components/Etat";
import { useApplication } from "../../context/ApplicationContext";
import { useAnnuaire } from "../../context/AnnuaireContext";
import { useProbleme } from "../../context/ProblemeContext";
import { useNotifier } from "../../context/SnackbarContext";
import { useAsync } from "../../hooks/useAsync";
import { dateHeure } from "../../utils/format";
import { libelle, options } from "../../utils/libelles";
import { PERM } from "../../utils/permissions";

const CHOIX: { valeur: TypeDecision; aide: string }[] = [
  { valeur: "ia_retenue", aide: "Vous appliquez le code proposé sans le modifier." },
  { valeur: "ia_adaptee", aide: "Vous partez des propositions de l'IA et les modifiez." },
  { valeur: "autre_solution", aide: "Vous avez lu les propositions mais choisi une autre voie." },
  { valeur: "sans_ia", aide: "Vous n'avez pas utilisé les propositions de l'IA." },
];

/** Le développeur retient, adapte ou non les solutions de l'IA, ou prend sa propre voie. La justification est facultative. */
export default function ProblemeDecision() {
  const { peut, archivee } = useApplication();
  const { probleme, recharger } = useProbleme();
  const { nom } = useAnnuaire();
  const notifier = useNotifier();
  const { data: diagnostics, loading, error } = useAsync(() => listDiagnostics(probleme.id), [probleme.id]);
  const { data: decisions, reload } = useAsync(() => listDecisions(probleme.id), [probleme.id]);
  const [type, setType] = useState<TypeDecision>("ia_retenue");
  const [solutions, setSolutions] = useState<Set<number>>(new Set());
  const [description, setDescription] = useState("");
  const [code, setCode] = useState("");
  const [motif, setMotif] = useState("");
  const [justification, setJustification] = useState("");
  const [commit, setCommit] = useState("");
  const [pr, setPr] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);

  const avecIA = type === "ia_retenue" || type === "ia_adaptee";
  const statutOk = ["confirme", "en_cours", "rouvert"].includes(probleme.statut);
  const modifiable = peut(PERM.SOLUTION_DECIDER) && !archivee && statutOk;
  const toutes = (diagnostics ?? []).flatMap((d, i) => d.solutions.map((s, j) => ({ id: s.id, texte: `Diagnostic ${(diagnostics?.length ?? 0) - i} · solution ${j + 1} : ${s.description}` })));

  async function enregistrer() {
    if (avecIA && solutions.size === 0) { setErreur("Cochez au moins une solution de l'IA."); return; }
    if (!avecIA && !description.trim()) { setErreur("Décrivez votre solution."); return; }
    setErreur(null);
    try {
      await creerDecision(probleme.id, {
        type_decision: type, solution_ids: avecIA ? [...solutions] : [],
        description_alternative: description || undefined, extrait_code_alternatif: code || undefined, justification: justification || undefined,
        motif_non_utilisation: !avecIA && motif ? (motif as "pas_utile" | "fausse" | "autre_trouvee") : undefined,
        commit_associe: commit || undefined, pull_request: pr || undefined,
      });
      notifier("Décision enregistrée."); reload(); recharger();
    } catch (e) { setErreur(messageErreur(e)); }
  }

  return (
    <Etat loading={loading} error={error}>
      <Stack spacing={2}>
        {!statutOk && <Alert severity="info">La décision se prend pour un problème confirmé, en cours ou rouvert (statut actuel : {libelle("statutProbleme", probleme.statut)}).</Alert>}
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>Quelle correction retenez-vous ?</Typography>
          <RadioGroup value={type} onChange={(e) => setType(e.target.value as TypeDecision)}>
            {CHOIX.map((c) => (
              <FormControlLabel key={c.valeur} value={c.valeur} disabled={!modifiable}
                control={<Radio />} label={<span>{libelle("typeDecision", c.valeur)}<Typography variant="caption" display="block" color="text.secondary">{c.aide}</Typography></span>} />
            ))}
          </RadioGroup>
          <Stack spacing={2} sx={{ mt: 2 }}>
            {avecIA && (
              <Stack>
                <Typography variant="body2" color="text.secondary">Solutions de l'IA concernées (une ou plusieurs)</Typography>
                {toutes.length === 0 && <Alert severity="warning">Aucune solution de l'IA : demandez d'abord un diagnostic.</Alert>}
                {toutes.map((s) => (
                  <FormControlLabel key={s.id} label={s.texte} disabled={!modifiable}
                    control={<Checkbox checked={solutions.has(s.id)} onChange={(e) => { const n = new Set(solutions); if (e.target.checked) n.add(s.id); else n.delete(s.id); setSolutions(n); }} />} />
                ))}
              </Stack>
            )}
            {(type === "ia_adaptee" || !avecIA) && (
              <TextField multiline minRows={3} size="small" disabled={!modifiable}
                label={type === "ia_adaptee" ? "Vos adaptations" : "Décrivez votre solution (obligatoire)"} value={description} onChange={(e) => setDescription(e.target.value)} />
            )}
            {!avecIA && <TextField multiline minRows={3} size="small" label="Code de votre solution (facultatif)" value={code} onChange={(e) => setCode(e.target.value)} disabled={!modifiable} />}
            {!avecIA && <ChampSelect label="Motif (facultatif)" valeur={motif} onChange={setMotif} vide="—" options={options("motifNonUtilisation")} disabled={!modifiable} />}
            <TextField multiline minRows={2} size="small" label="Justification (facultative)" value={justification} onChange={(e) => setJustification(e.target.value)} disabled={!modifiable} />
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
              <TextField size="small" label="Commit associé" fullWidth value={commit} onChange={(e) => setCommit(e.target.value)} disabled={!modifiable} />
              <TextField size="small" label="Pull request" fullWidth value={pr} onChange={(e) => setPr(e.target.value)} disabled={!modifiable} />
            </Stack>
            {erreur && <Alert severity="error">{erreur}</Alert>}
            <Button variant="contained" sx={{ alignSelf: "flex-start" }} onClick={enregistrer} disabled={!modifiable}>Enregistrer la décision</Button>
            <Typography variant="caption" color="text.secondary">La demande de test se fait depuis l'onglet « Tests », quand toutes les tâches sont terminées.</Typography>
          </Stack>
        </Paper>
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>Décisions précédentes</Typography>
          {(decisions ?? []).length === 0 && <Typography color="text.secondary" variant="body2">Aucune décision.</Typography>}
          {(decisions ?? []).map((d) => (
            <Typography key={d.id} variant="body2" sx={{ mb: 0.5 }}>
              {dateHeure(d.cree_le)} · {libelle("typeDecision", d.type_decision)} · {nom(d.developpeur_id)}
              {d.motif_non_utilisation ? ` · ${libelle("motifNonUtilisation", d.motif_non_utilisation)}` : ""}
            </Typography>
          ))}
        </Paper>
      </Stack>
    </Etat>
  );
}
