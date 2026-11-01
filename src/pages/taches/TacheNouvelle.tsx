import AutoAwesomeOutlined from "@mui/icons-material/AutoAwesomeOutlined";
import DeleteOutline from "@mui/icons-material/DeleteOutline";
import { Alert, Box, Button, Checkbox, FormControlLabel, IconButton, Paper, Stack, TextField, Typography } from "@mui/material";
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { membresApplication } from "../../api/applications";
import { messageErreur } from "../../api/client";
import { getProbleme, listDiagnostics, listProblemes } from "../../api/problemes";
import { creerTaches, proposerTaches, tachesDuProbleme } from "../../api/taches";
import type { TacheCreation } from "../../api/types";
import ChampSelect from "../../components/ChampSelect";
import Etat from "../../components/Etat";
import PageHeader from "../../components/PageHeader";
import StatutChip from "../../components/StatutChip";
import { useApplication } from "../../context/ApplicationContext";
import { useNotifier } from "../../context/SnackbarContext";
import { useAsync } from "../../hooks/useAsync";

type Origine = "ia" | "utilisateur";
interface Brouillon {
  cle: number; retenue: boolean; origine: Origine; titre: string; description: string; duree: string; responsable: string; echeance: string;
  solutions: number[]; sous: { titre: string; retenue: boolean; origine: Origine }[]; criteres: { texte: string; retenu: boolean; origine: Origine }[];
}
let compteur = 0;
const vide = (): Brouillon => ({ cle: ++compteur, retenue: true, origine: "utilisateur", titre: "", description: "", duree: "", responsable: "", echeance: "", solutions: [], sous: [], criteres: [] });

/** Création de tâches à partir d'un problème : l'IA PROPOSE (plusieurs tâches possibles), l'utilisateur retient, modifie ou ajoute. */
export default function TacheNouvelle() {
  const { application, archivee } = useApplication();
  const navigate = useNavigate();
  const notifier = useNotifier();
  const [params] = useSearchParams();
  const [pid, setPid] = useState(params.get("problemeId") ?? "");
  const [brouillons, setBrouillons] = useState<Brouillon[]>([]);
  const [attente, setAttente] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const { data: candidats } = useAsync(() => listProblemes({ application_id: application.id, limit: 200 }), [application.id]);
  const probleme = useAsync(() => (pid ? getProbleme(Number(pid)) : Promise.resolve(null)), [pid]);
  const existantes = useAsync(() => (pid ? tachesDuProbleme(Number(pid)) : Promise.resolve([])), [pid]);
  const diagnostics = useAsync(() => (pid ? listDiagnostics(Number(pid)) : Promise.resolve([])), [pid]);
  const { data: membres } = useAsync(() => membresApplication(application.id), [application.id]);
  const solutions = (diagnostics.data ?? []).flatMap((d) => d.solutions.map((s) => ({ id: s.id, texte: s.description })));

  const maj = (cle: number, f: (b: Brouillon) => Brouillon) => setBrouillons(brouillons.map((b) => (b.cle === cle ? f(b) : b)));

  async function proposer() {
    setAttente(true); setErreur(null);
    try {
      const prop = await proposerTaches(Number(pid));
      setBrouillons([...brouillons, ...prop.taches.map((t): Brouillon => ({
        ...vide(), origine: "ia", titre: t.titre, description: t.description ?? "", duree: t.duree_estimee_h !== null ? String(t.duree_estimee_h) : "",
        sous: t.sous_taches.map((s) => ({ titre: s.titre, retenue: true, origine: "ia" })), criteres: t.criteres_acceptation.map((c) => ({ texte: c, retenu: true, origine: "ia" })),
      }))]);
    } catch (e) { setErreur(messageErreur(e)); } finally { setAttente(false); }
  }

  async function creer() {
    const retenues = brouillons.filter((b) => b.retenue);
    if (retenues.length === 0) { setErreur("Retenez au moins une tâche."); return; }
    if (retenues.some((b) => !b.titre.trim())) { setErreur("Chaque tâche retenue doit avoir un titre."); return; }
    const donnees: TacheCreation[] = retenues.map((b) => ({
      titre: b.titre.trim(), description: b.description || undefined, origine: b.origine, duree_estimee_h: b.duree ? Number(b.duree) : null,
      responsable_id: b.responsable ? Number(b.responsable) : null, echeance: b.echeance || null, solution_ids: b.solutions,
      sous_taches: b.sous.filter((s) => s.retenue && s.titre.trim()).map((s) => ({ titre: s.titre.trim(), origine: s.origine })),
      criteres_acceptation: b.criteres.filter((c) => c.retenu && c.texte.trim()).map((c) => ({ texte: c.texte.trim(), origine: c.origine })),
    }));
    try { await creerTaches(Number(pid), donnees); notifier("Tâche(s) créée(s)."); navigate(`/applications/${application.id}/problemes/${pid}/taches`); }
    catch (e) { setErreur(messageErreur(e)); }
  }

  return (
    <>
      <PageHeader titre="Créer des tâches à partir d'un problème" fil={[{ libelle: "Tâches", to: `/applications/${application.id}/taches` }, { libelle: "Nouvelles tâches" }]} />
      {archivee && <Alert severity="warning" sx={{ mb: 2 }}>Application archivée : création impossible.</Alert>}
      <Stack spacing={2}>
        <Paper sx={{ p: 2 }}>
          <ChampSelect label="Problème" valeur={pid} onChange={(v) => { setPid(v); setBrouillons([]); }}
            options={(candidats ?? []).filter((p) => ["confirme", "en_cours", "rouvert"].includes(p.statut)).map((p) => ({ valeur: String(p.id), libelle: `${p.code} · ${p.titre}` }))} />
          <Etat loading={probleme.loading || existantes.loading} error={probleme.error}>
            {probleme.data && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="body2">Statut : <StatutChip groupe="statutProbleme" valeur={probleme.data.statut} /></Typography>
                <Typography variant="caption" color="text.secondary">Tâches déjà créées pour ce problème : {(existantes.data ?? []).map((t) => t.titre).join(" · ") || "aucune"}. Un problème peut avoir plusieurs tâches.</Typography>
              </Box>
            )}
          </Etat>
        </Paper>

        {pid && (
          <>
            <Stack direction="row" spacing={1}>
              <Button variant="outlined" startIcon={<AutoAwesomeOutlined />} onClick={proposer} disabled={attente}>{attente ? "L'IA propose…" : "Demander des propositions à l'IA"}</Button>
              <Button variant="outlined" onClick={() => setBrouillons([...brouillons, vide()])}>Ajouter une tâche</Button>
            </Stack>
            {brouillons.map((b) => (
              <Paper key={b.cle} sx={{ p: 2, opacity: b.retenue ? 1 : 0.6 }}>
                <Stack spacing={1.5}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <FormControlLabel label={b.origine === "ia" ? "Retenir cette tâche (proposée par l'IA)" : "Retenir cette tâche"} control={<Checkbox checked={b.retenue} onChange={(e) => maj(b.cle, (x) => ({ ...x, retenue: e.target.checked }))} />} />
                    <IconButton aria-label="Retirer le brouillon" onClick={() => setBrouillons(brouillons.filter((x) => x.cle !== b.cle))}><DeleteOutline /></IconButton>
                  </Stack>
                  <TextField size="small" label="Titre" value={b.titre} onChange={(e) => maj(b.cle, (x) => ({ ...x, titre: e.target.value }))} />
                  <TextField size="small" label="Description" multiline value={b.description} onChange={(e) => maj(b.cle, (x) => ({ ...x, description: e.target.value }))} />
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                    <ChampSelect label="Responsable" valeur={b.responsable} onChange={(v) => maj(b.cle, (x) => ({ ...x, responsable: v }))} vide="Aucun" options={(membres ?? []).map((m) => ({ valeur: String(m.utilisateur_id), libelle: m.identifiant }))} />
                    <TextField size="small" type="date" label="Échéance" InputLabelProps={{ shrink: true }} fullWidth value={b.echeance} onChange={(e) => maj(b.cle, (x) => ({ ...x, echeance: e.target.value }))} />
                    <TextField size="small" label="Durée estimée (h)" fullWidth value={b.duree} onChange={(e) => maj(b.cle, (x) => ({ ...x, duree: e.target.value }))} helperText="Indication, modifiable" />
                  </Stack>
                  {solutions.length > 0 && (
                    <Stack>
                      <Typography variant="caption" color="text.secondary">Solutions de l'IA sur lesquelles s'appuie la tâche (aucune si vous suivez votre propre solution)</Typography>
                      {solutions.map((s) => (
                        <FormControlLabel key={s.id} label={s.texte} control={<Checkbox checked={b.solutions.includes(s.id)}
                          onChange={(e) => maj(b.cle, (x) => ({ ...x, solutions: e.target.checked ? [...x.solutions, s.id] : x.solutions.filter((i) => i !== s.id) }))} />} />
                      ))}
                    </Stack>
                  )}
                  <Typography variant="subtitle2">Sous-tâches</Typography>
                  {b.sous.map((s, i) => (
                    <Stack key={i} direction="row" spacing={1} alignItems="center">
                      <Checkbox checked={s.retenue} onChange={(e) => maj(b.cle, (x) => ({ ...x, sous: x.sous.map((y, j) => (j === i ? { ...y, retenue: e.target.checked } : y)) }))} inputProps={{ "aria-label": "Retenir" }} />
                      <TextField size="small" fullWidth value={s.titre} onChange={(e) => maj(b.cle, (x) => ({ ...x, sous: x.sous.map((y, j) => (j === i ? { ...y, titre: e.target.value } : y)) }))} />
                    </Stack>
                  ))}
                  <Button size="small" sx={{ alignSelf: "flex-start" }} onClick={() => maj(b.cle, (x) => ({ ...x, sous: [...x.sous, { titre: "", retenue: true, origine: "utilisateur" }] }))}>Ajouter une sous-tâche</Button>
                  <Typography variant="subtitle2">Critères d'acceptation</Typography>
                  {b.criteres.map((c, i) => (
                    <Stack key={i} direction="row" spacing={1} alignItems="center">
                      <Checkbox checked={c.retenu} onChange={(e) => maj(b.cle, (x) => ({ ...x, criteres: x.criteres.map((y, j) => (j === i ? { ...y, retenu: e.target.checked } : y)) }))} inputProps={{ "aria-label": "Retenir" }} />
                      <TextField size="small" fullWidth value={c.texte} onChange={(e) => maj(b.cle, (x) => ({ ...x, criteres: x.criteres.map((y, j) => (j === i ? { ...y, texte: e.target.value } : y)) }))} />
                    </Stack>
                  ))}
                  <Button size="small" sx={{ alignSelf: "flex-start" }} onClick={() => maj(b.cle, (x) => ({ ...x, criteres: [...x.criteres, { texte: "", retenu: true, origine: "utilisateur" }] }))}>Ajouter un critère</Button>
                </Stack>
              </Paper>
            ))}
            {erreur && <Alert severity="error">{erreur}</Alert>}
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="caption" color="text.secondary" sx={{ flex: 1 }}>Rien n'est créé tant que vous n'avez pas validé. Les éléments non retenus ne sont jamais enregistrés.</Typography>
              <Button variant="contained" onClick={creer} disabled={brouillons.length === 0 || archivee}>Créer les tâches retenues</Button>
            </Stack>
          </>
        )}
      </Stack>
    </>
  );
}
