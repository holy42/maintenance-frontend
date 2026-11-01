import AutoAwesomeOutlined from "@mui/icons-material/AutoAwesomeOutlined";
import { Alert, Box, Button, Chip, Paper, Stack, TextField, Typography } from "@mui/material";
import { useState } from "react";
import { messageErreur } from "../../api/client";
import { demanderDiagnostic, listDiagnostics, retourSolution } from "../../api/problemes";
import type { Solution } from "../../api/types";
import BarreConfiance from "../../components/BarreConfiance";
import ChampSelect from "../../components/ChampSelect";
import CodeBlock from "../../components/CodeBlock";
import DiffBlock from "../../components/DiffBlock";
import FiabiliteBadge from "../../components/FiabiliteBadge";
import Etat from "../../components/Etat";
import { useApplication } from "../../context/ApplicationContext";
import { useProbleme } from "../../context/ProblemeContext";
import { useNotifier } from "../../context/SnackbarContext";
import { useAsync } from "../../hooks/useAsync";
import { dateHeure } from "../../utils/format";
import { options } from "../../utils/libelles";
import { PERM } from "../../utils/permissions";

function SolutionCarte({ solution, numero, peutEvaluer }: { solution: Solution; numero: number; peutEvaluer: boolean }) {
  const notifier = useNotifier();
  const [utilite, setUtilite] = useState("");
  const [commentaire, setCommentaire] = useState("");

  async function enregistrer() {
    if (!utilite) return;
    try { await retourSolution(solution.id, { utilite_percue: utilite, commentaire: commentaire || undefined }); notifier("Évaluation enregistrée."); }
    catch (e) { notifier(messageErreur(e), "error"); }
  }

  return (
    <Paper sx={{ p: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="subtitle1" fontWeight={600}>Solution {numero}</Typography>
        <Chip size="small" color="warning" label="Proposition" />
      </Stack>
      <Typography variant="body2" sx={{ my: 1 }}>{solution.description}</Typography>
      {solution.extrait_code && (solution.format_code === "diff" ? <DiffBlock diff={solution.extrait_code} /> : <CodeBlock code={solution.extrait_code} />)}
      {solution.extrait_code && (
        <Button size="small" sx={{ mt: 1 }} onClick={() => navigator.clipboard.writeText(solution.extrait_code ?? "").then(() => notifier("Code copié."))}>Copier le code</Button>
      )}
      {solution.fiabilite && <Box sx={{ mt: 1.5 }}><FiabiliteBadge fiabilite={solution.fiabilite} titre="Probabilité de validation au test" /></Box>}
      {solution.risques && <Typography variant="body2" sx={{ mt: 1 }}><strong>Risques :</strong> {solution.risques}</Typography>}
      {solution.tests_suggeres && <Typography variant="body2"><strong>Tests suggérés :</strong> {solution.tests_suggeres}</Typography>}
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mt: 2 }} alignItems="center">
        <Box sx={{ minWidth: 220 }}><ChampSelect label="Votre évaluation" valeur={utilite} onChange={setUtilite} vide="Non évaluée" options={options("utilite")} disabled={!peutEvaluer} /></Box>
        <TextField size="small" label="Commentaire" fullWidth value={commentaire} onChange={(e) => setCommentaire(e.target.value)} disabled={!peutEvaluer} />
        <Button variant="outlined" onClick={enregistrer} disabled={!peutEvaluer || !utilite}>Enregistrer</Button>
      </Stack>
    </Paper>
  );
}

/** L'IA propose ; le code proposé n'est jamais appliqué au dépôt par la plateforme. */
export default function ProblemeDiagnostic() {
  const { peut, archivee } = useApplication();
  const { probleme } = useProbleme();
  const notifier = useNotifier();
  const { data, loading, error, reload } = useAsync(() => listDiagnostics(probleme.id), [probleme.id]);
  const [choix, setChoix] = useState<number | null>(null);
  const [attente, setAttente] = useState(false);
  const diagnostic = (data ?? []).find((d) => d.id === choix) ?? data?.[0];

  async function demander() {
    setAttente(true);
    try { const d = await demanderDiagnostic(probleme.id); setChoix(d.id); reload(); }
    catch (e) { notifier(messageErreur(e), "error"); }
    finally { setAttente(false); }
  }

  return (
    <Etat loading={loading} error={error}>
      <Stack spacing={2}>
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
          {(data ?? []).length > 0 && (
            <Box sx={{ minWidth: 320 }}>
              <ChampSelect label="Diagnostic" valeur={String(diagnostic?.id ?? "")} onChange={(v) => setChoix(Number(v))}
                options={(data ?? []).map((d, i) => ({ valeur: String(d.id), libelle: `Diagnostic ${(data?.length ?? 0) - i} · ${dateHeure(d.cree_le)}${d.branche_analysee ? ` · ${d.branche_analysee}` : ""}` }))} />
            </Box>
          )}
          <Button variant="outlined" startIcon={<AutoAwesomeOutlined />} onClick={demander} disabled={attente || !peut(PERM.PROBLEME_MODIFIER) || archivee}>
            {attente ? "L'IA analyse…" : "Demander un nouveau diagnostic"}
          </Button>
        </Stack>
        {!diagnostic && <Alert severity="info">Aucun diagnostic. Les anciens diagnostics sont toujours conservés : un nouveau ne remplace jamais l'ancien.</Alert>}
        {diagnostic && (
          <>
            <Paper sx={{ p: 2 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="subtitle1" fontWeight={600}>Diagnostic</Typography>
                <Chip size="small" color="warning" icon={<AutoAwesomeOutlined />} label="Hypothèse de l'IA, non vérifiée" />
              </Stack>
              <Typography variant="body2" sx={{ my: 1 }}>{diagnostic.explication}</Typography>
              {(diagnostic.causes_probables ?? []).length > 0 && <Typography variant="body2" color="text.secondary">Causes probables : {(diagnostic.causes_probables ?? []).map((c, i) => `${i + 1}. ${c}`).join(" · ")}</Typography>}
              <Box sx={{ my: 1 }}><BarreConfiance valeur={diagnostic.niveau_confiance} /></Box>
              <Alert severity="info"><strong>Ce que l'IA ne sait pas :</strong> {diagnostic.incertitudes ?? "non précisé."}</Alert>
              {(diagnostic.verifications_recommandees ?? []).length > 0 && (
                <Box sx={{ mt: 1.5 }}>
                  <Typography variant="subtitle2">Vérifications recommandées</Typography>
                  <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
                    {(diagnostic.verifications_recommandees ?? []).map((v, i) => (
                      <Typography key={i} component="li" variant="body2">
                        {v.texte}
                        {v.controle === "a_verifier" && <Chip size="small" color="warning" variant="outlined" label="à vérifier" title={v.motif} sx={{ ml: 1 }} />}
                        {v.origine === "regle" && <Chip size="small" variant="outlined" label="règle générale" sx={{ ml: 1 }} />}
                      </Typography>
                    ))}
                  </Box>
                  <Typography variant="caption" color="text.secondary">Rédigées par l'IA, puis contrôlées par des règles (doublons, affirmations de correction, fichiers cités).</Typography>
                </Box>
              )}
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                Produit sur la branche {diagnostic.branche_analysee ?? "—"}, version {diagnostic.commit_reference?.slice(0, 8) ?? "—"}{diagnostic.modele_ia ? ` · modèle ${diagnostic.modele_ia}` : ""}.
              </Typography>
            </Paper>
            <Typography variant="subtitle1" fontWeight={600}>Solutions proposées</Typography>
            {diagnostic.solutions.map((s, i) => <SolutionCarte key={s.id} solution={s} numero={i + 1} peutEvaluer={peut(PERM.SOLUTION_DECIDER) && !archivee} />)}
            <Typography variant="caption" color="text.secondary">Le code proposé n'est jamais appliqué au dépôt : c'est au développeur de le reprendre, le modifier ou l'ignorer.</Typography>
          </>
        )}
      </Stack>
    </Etat>
  );
}
