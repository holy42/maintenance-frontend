import SendOutlined from "@mui/icons-material/SendOutlined";
import { Alert, Box, Button, Chip, Divider, Drawer, IconButton, Stack, TextField, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { messageErreur } from "../api/client";
import { messagesIA, partagerDansSalon, poserQuestion, proposerSolution } from "../api/collaboration";
import type { Id, MessageIA } from "../api/types";
import { useAnnuaire } from "../context/AnnuaireContext";
import { useNotifier } from "../context/SnackbarContext";
import { useAsync } from "../hooks/useAsync";
import { dateHeure } from "../utils/format";
import BarreConfiance from "./BarreConfiance";
import Etat from "./Etat";

interface Props {
  ouvert: boolean;
  onClose: () => void;
  problemeId: Id;
  peutUtiliser: boolean;
  peutProposer: boolean;
  /** Question préremplie (bouton « Demander de l'aide » d'une tâche ou d'une sous-tâche). */
  questionInitiale?: string;
  tacheId?: Id | null;
  sousTacheId?: Id | null;
  onSolutionCreee?: () => void;
}

/** Assistant IA du problème : UNE conversation commune à l'équipe. Il propose, il ne modifie jamais le code. */
export default function AssistantIAPanel({ ouvert, onClose, problemeId, peutUtiliser, peutProposer, questionInitiale, tacheId, sousTacheId, onSolutionCreee }: Props) {
  const notifier = useNotifier();
  const { nom } = useAnnuaire();
  const { data, loading, error, reload } = useAsync(() => (ouvert ? messagesIA(problemeId) : Promise.resolve([] as MessageIA[])), [problemeId, ouvert]);
  const [question, setQuestion] = useState(questionInitiale ?? "");
  const [envoi, setEnvoi] = useState(false);

  useEffect(() => { if (questionInitiale) setQuestion(questionInitiale); }, [questionInitiale]);

  async function envoyer() {
    if (!question.trim()) return;
    setEnvoi(true);
    try {
      await poserQuestion(problemeId, { question: question.trim(), tache_id: tacheId ?? null, sous_tache_id: sousTacheId ?? null });
      setQuestion("");
      reload();
    } catch (e) {
      notifier(messageErreur(e), "error");      // 503 : le service d'IA est indisponible, le reste fonctionne
    } finally {
      setEnvoi(false);
    }
  }

  async function agir(fn: () => Promise<unknown>, succes: string) {
    try { await fn(); notifier(succes); reload(); onSolutionCreee?.(); } catch (e) { notifier(messageErreur(e), "error"); }
  }

  return (
    <Drawer anchor="right" open={ouvert} onClose={onClose} PaperProps={{ sx: { width: { xs: "100%", sm: 440 } } }}>
      <Stack sx={{ height: "100%" }}>
        <Box sx={{ p: 2 }}>
          <Typography variant="h6">Assistant IA</Typography>
          <Typography variant="caption" color="text.secondary">
            Conversation commune à l'équipe. L'assistant propose, il ne modifie jamais le code. Les secrets ne lui sont pas transmis.
          </Typography>
        </Box>
        <Divider />
        <Box sx={{ flex: 1, overflowY: "auto", p: 2 }}>
          <Etat loading={loading} error={error}>
            <Stack spacing={1.5}>
              {(data ?? []).length === 0 && <Typography color="text.secondary">Aucun message pour l'instant.</Typography>}
              {(data ?? []).map((m) => (
                <Box key={m.id} sx={{ alignSelf: m.emetteur === "utilisateur" ? "flex-end" : "flex-start", maxWidth: "92%" }}>
                  <Typography variant="caption" color="text.secondary">
                    {m.emetteur === "utilisateur" ? nom(m.auteur_id) : "Assistant IA"} · {dateHeure(m.cree_le)}
                  </Typography>
                  <Box sx={{ p: 1.25, borderRadius: 2, bgcolor: m.emetteur === "utilisateur" ? "primary.main" : "action.hover",
                    color: m.emetteur === "utilisateur" ? "primary.contrastText" : "text.primary", whiteSpace: "pre-wrap" }}>
                    {m.sous_tache_id && <Chip size="small" label={`Sous-tâche n°${m.sous_tache_id}`} sx={{ mb: 0.5 }} />}
                    {m.tache_id && !m.sous_tache_id && <Chip size="small" label={`Tâche n°${m.tache_id}`} sx={{ mb: 0.5 }} />}
                    <Typography variant="body2" component="div">{m.contenu}</Typography>
                  </Box>
                  {m.emetteur === "assistant" && (
                    <Stack spacing={0.75} sx={{ mt: 0.75 }}>
                      {m.informations_manquantes && <Alert severity="info" sx={{ py: 0 }}><strong>Informations manquantes :</strong> {m.informations_manquantes}</Alert>}
                      <BarreConfiance valeur={m.niveau_confiance} />
                      <Typography variant="caption" color="text.secondary">Réponse générée par une IA : à vérifier.</Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        {Boolean(m.contexte_utilise?.["solution_proposee"]) && !m.solution_id && peutProposer && (
                          <Button size="small" variant="outlined" onClick={() => agir(() => proposerSolution(problemeId, m.id), "Solution ajoutée au problème.")}>
                            Proposer comme solution
                          </Button>
                        )}
                        <Button size="small" variant="outlined" onClick={() => agir(() => partagerDansSalon(problemeId, m.id), "Partagé dans le salon.")}>
                          Partager dans le salon
                        </Button>
                      </Stack>
                    </Stack>
                  )}
                </Box>
              ))}
            </Stack>
          </Etat>
        </Box>
        <Divider />
        <Box sx={{ p: 2 }}>
          {!peutUtiliser ? (
            <Alert severity="warning">Vous n'avez pas la permission d'utiliser l'assistant.</Alert>
          ) : (
            <Stack direction="row" spacing={1} alignItems="flex-end">
              <TextField multiline minRows={2} maxRows={6} fullWidth size="small" placeholder="Posez une question sur ce problème"
                value={question} onChange={(e) => setQuestion(e.target.value)} />
              <IconButton color="primary" onClick={envoyer} disabled={envoi || !question.trim()} aria-label="Envoyer"><SendOutlined /></IconButton>
            </Stack>
          )}
        </Box>
      </Stack>
    </Drawer>
  );
}
