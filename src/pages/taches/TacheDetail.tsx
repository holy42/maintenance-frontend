import AutoAwesomeOutlined from "@mui/icons-material/AutoAwesomeOutlined";
import DeleteOutline from "@mui/icons-material/DeleteOutline";
import { Alert, Box, Button, Chip, IconButton, Paper, Stack, TextField, Tooltip, Typography } from "@mui/material";
import { useState } from "react";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";
import { messageErreur } from "../../api/client";
import { ajouterNoteTache, notesTache } from "../../api/collaboration";
import {
  actionTache, ajouterCritereAcceptation, ajouterSousTache, getTache, retirerSousTache, statutSousTache, type ActionTache,
} from "../../api/taches";
import ChampSelect from "../../components/ChampSelect";
import Etat from "../../components/Etat";
import PageHeader from "../../components/PageHeader";
import StatutChip from "../../components/StatutChip";
import { useApplication } from "../../context/ApplicationContext";
import { useAnnuaire } from "../../context/AnnuaireContext";
import { useAuth } from "../../context/AuthContext";
import { useNotifier } from "../../context/SnackbarContext";
import { useAsync } from "../../hooks/useAsync";
import { date, dateHeure } from "../../utils/format";
import { libelle } from "../../utils/libelles";
import { PERM } from "../../utils/permissions";
import { TRANSITIONS_TACHE } from "../../utils/transitions";

/** Détail d'une tâche : actions de statut, sous-tâches (avec « Demander de l'aide » -> assistant IA du problème), critères d'acceptation. */
export default function TacheDetail() {
  const { application, peut, archivee } = useApplication();
  const id = Number(useParams().tacheId);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { nom } = useAnnuaire();
  const notifier = useNotifier();
  const { data: t, loading, error, reload } = useAsync(() => getTache(id), [id]);
  const { data: notes, reload: rechargerNotes } = useAsync(() => notesTache(id), [id]);
  const [nouvelleSous, setNouvelleSous] = useState("");
  const [nouveauCritere, setNouveauCritere] = useState("");
  const [note, setNote] = useState("");

  const peutAgir = !archivee && (peut(PERM.TACHE_GERER) || t?.responsable_id === user?.id);
  const gerer = peut(PERM.TACHE_GERER) && !archivee;

  async function agir(fn: () => Promise<unknown>, succes?: string) {
    try { await fn(); if (succes) notifier(succes); reload(); } catch (e) { notifier(messageErreur(e), "error"); }
  }
  const lancer = (a: ActionTache, succes: string) => agir(() => actionTache(id, a), succes);

  function aide(sousId: number, titre: string) {
    if (!t) return;
    const q = encodeURIComponent(`Comment faire cette étape : « ${titre} » ?`);
    navigate(`/applications/${application.id}/problemes/${t.probleme_id}?assistant=1&tache=${t.id}&sous=${sousId}&question=${q}`);
  }

  const sousOuvertes = (t?.sous_taches ?? []).filter((s) => s.statut !== "terminee" && s.statut !== "arretee").length;

  return (
    <Etat loading={loading} error={error}>
      {t && (
        <>
          <PageHeader titre={t.titre} fil={[{ libelle: "Tâches", to: `/applications/${application.id}/taches` }, { libelle: t.titre }]}
            sousTitre={<Stack direction="row" spacing={1} sx={{ mt: 0.5 }}><StatutChip groupe="statutTache" valeur={t.statut} />
              <Chip size="small" variant="outlined" component={RouterLink} to={`/applications/${application.id}/problemes/${t.probleme_id}`} clickable label={`Problème n°${t.probleme_id}`} /></Stack>}
            actions={<>
              {(t.statut === "a_faire" || t.statut === "en_pause") && <Button variant="contained" disabled={!peutAgir} onClick={() => lancer("demarrer", "Tâche démarrée.")}>Démarrer</Button>}
              {t.statut === "en_cours" && <Button variant="outlined" disabled={!peutAgir} onClick={() => lancer("pause", "Tâche mise en pause.")}>Mettre en pause</Button>}
              {(t.statut === "en_cours" || t.statut === "en_pause") && <Button variant="outlined" disabled={!peutAgir} onClick={() => lancer("arreter", "Tâche arrêtée.")}>Arrêter</Button>}
              {t.statut === "en_cours" && (
                <Tooltip title={sousOuvertes > 0 ? "Toutes les sous-tâches doivent être terminées (les arrêtées ne bloquent pas)." : ""}>
                  <span><Button variant="contained" color="success" disabled={!peutAgir || sousOuvertes > 0} onClick={() => lancer("terminer", "Tâche terminée.")}>Terminer</Button></span>
                </Tooltip>
              )}
            </>} />
          <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "1.9fr 1fr" } }}>
            <Stack spacing={2}>
              <Paper sx={{ p: 2 }}><Typography variant="subtitle1" fontWeight={600}>Description</Typography><Typography variant="body2">{t.description ?? "—"}</Typography></Paper>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle1" fontWeight={600}>Sous-tâches · {t.sous_taches.filter((s) => s.statut === "terminee").length} sur {t.sous_taches.length} terminée(s)</Typography>
                <Stack spacing={1} sx={{ mt: 1 }}>
                  {t.sous_taches.map((s) => (
                    <Stack key={s.id} direction="row" spacing={1} alignItems="center">
                      <Typography variant="body2" color="text.secondary" sx={{ width: 20 }}>{s.ordre}</Typography>
                      <Typography variant="body2" sx={{ flex: 1 }}>{s.titre} <Chip size="small" variant="outlined" label={s.origine === "ia" ? "IA" : "Vous"} /></Typography>
                      <Box sx={{ width: 150 }}>
                        <ChampSelect label="Statut" valeur={s.statut} disabled={!peutAgir || (TRANSITIONS_TACHE[s.statut] ?? []).length === 0}
                          options={[s.statut, ...(TRANSITIONS_TACHE[s.statut] ?? [])].map((v) => ({ valeur: v, libelle: libelle("statutTache", v) }))}
                          onChange={(v) => agir(() => statutSousTache(t.id, s.id, v))} />
                      </Box>
                      <Button size="small" startIcon={<AutoAwesomeOutlined />} onClick={() => aide(s.id, s.titre)}>Aide</Button>
                      {gerer && <IconButton size="small" aria-label="Retirer" onClick={() => agir(() => retirerSousTache(t.id, s.id))}><DeleteOutline fontSize="small" /></IconButton>}
                    </Stack>
                  ))}
                </Stack>
                {gerer && (
                  <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                    <TextField size="small" fullWidth placeholder="Nouvelle sous-tâche" value={nouvelleSous} onChange={(e) => setNouvelleSous(e.target.value)} />
                    <Button variant="outlined" disabled={!nouvelleSous.trim()} onClick={() => agir(async () => { await ajouterSousTache(t.id, nouvelleSous.trim()); setNouvelleSous(""); })}>Ajouter</Button>
                  </Stack>
                )}
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>« Aide » ouvre l'assistant IA du problème avec cette étape comme contexte.</Typography>
              </Paper>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle1" fontWeight={600}>Critères d'acceptation</Typography>
                {t.criteres_acceptation.length === 0 && <Typography variant="body2" color="text.secondary">Aucun critère.</Typography>}
                {t.criteres_acceptation.map((c) => <Typography key={c.id} variant="body2">• {c.texte}</Typography>)}
                {gerer && (
                  <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                    <TextField size="small" fullWidth placeholder="Nouveau critère d'acceptation" value={nouveauCritere} onChange={(e) => setNouveauCritere(e.target.value)} />
                    <Button variant="outlined" disabled={!nouveauCritere.trim()} onClick={() => agir(async () => { await ajouterCritereAcceptation(t.id, nouveauCritere.trim()); setNouveauCritere(""); })}>Ajouter</Button>
                  </Stack>
                )}
              </Paper>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>Notes</Typography>
                {(notes ?? []).filter((n) => !n.supprime_le).map((n) => <Typography key={n.id} variant="body2" sx={{ mb: 0.5 }}><strong>{nom(n.auteur_id)}</strong> · {dateHeure(n.cree_le)} : {n.contenu}</Typography>)}
                {peut(PERM.DISCUSSION_PARTICIPER) && !archivee && (
                  <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                    <TextField size="small" fullWidth placeholder="Ajouter une note" value={note} onChange={(e) => setNote(e.target.value)} />
                    <Button variant="outlined" disabled={!note.trim()} onClick={async () => { try { await ajouterNoteTache(t.id, note.trim(), "note_interne"); setNote(""); rechargerNotes(); } catch (e) { notifier(messageErreur(e), "error"); } }}>Ajouter</Button>
                  </Stack>
                )}
              </Paper>
            </Stack>
            <Paper sx={{ p: 2, alignSelf: "start" }}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>Propriétés</Typography>
              {[["Responsable", nom(t.responsable_id)], ["Créée le", date(t.cree_le)], ["Début", date(t.debut_le)], ["Échéance", date(t.echeance)], ["Fin", date(t.fin_le)],
                ["Durée estimée", t.duree_estimee_h !== null ? `${t.duree_estimee_h} h (indication)` : "—"], ["Origine", t.origine === "ia" ? "Proposée par l'IA" : "Saisie"]].map(([k, v]) => (
                <Stack key={k} direction="row" justifyContent="space-between" sx={{ py: 0.5, borderTop: 1, borderColor: "divider" }}><Typography variant="body2" color="text.secondary">{k}</Typography><Typography variant="body2">{v}</Typography></Stack>
              ))}
              <Alert severity="info" sx={{ mt: 2 }}>Terminer la tâche ne ferme pas le problème : le test se demande quand toutes ses tâches sont terminées.</Alert>
            </Paper>
          </Box>
        </>
      )}
    </Etat>
  );
}
