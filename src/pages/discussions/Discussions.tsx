import DeleteOutline from "@mui/icons-material/DeleteOutline";
import EditOutlined from "@mui/icons-material/EditOutlined";
import ReplyOutlined from "@mui/icons-material/ReplyOutlined";
import {
  Badge, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, List, ListItemButton, ListItemText, ListSubheader, Paper,
  Stack, TextField, Typography,
} from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";
import { messageErreur } from "../../api/client";
import {
  creerSalon, listSalons, marquerSalonLu, messagesSalon, modifierMessage, publierMessage, supprimerMessage, supprimerSalon,
} from "../../api/collaboration";
import ConfirmDialog from "../../components/ConfirmDialog";
import Etat from "../../components/Etat";
import { useApplication } from "../../context/ApplicationContext";
import { useAnnuaire } from "../../context/AnnuaireContext";
import { useAuth } from "../../context/AuthContext";
import { useNotifier } from "../../context/SnackbarContext";
import { useAsync } from "../../hooks/useAsync";
import { usePolling } from "../../hooks/usePolling";
import { dateHeure } from "../../utils/format";
import { PERM } from "../../utils/permissions";

/** Un espace de discussion par application : un salon par problème (créé automatiquement) + salons généraux.
 *  Tous ceux qui ont accès à l'application peuvent lire et écrire. */
export default function Discussions() {
  const { application, peut, archivee } = useApplication();
  const { salonId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { nom } = useAnnuaire();
  const notifier = useNotifier();
  const { data: salons, loading, error, reload: rechargerSalons } = useAsync(() => listSalons(application.id), [application.id]);
  const courant = (salons ?? []).find((s) => s.id === Number(salonId)) ?? (salonId ? undefined : salons?.[0]);
  const { data: messages, reload } = useAsync(() => (courant ? messagesSalon(courant.id) : Promise.resolve([])), [courant?.id]);
  const [texte, setTexte] = useState("");
  const [reponse, setReponse] = useState<number | null>(null);
  const [edition, setEdition] = useState<{ id: number; texte: string } | null>(null);
  const [nouveau, setNouveau] = useState(false);
  const [titre, setTitre] = useState("");
  const [suppression, setSuppression] = useState(false);
  const peutEcrire = peut(PERM.DISCUSSION_PARTICIPER) && !archivee && !courant?.archive;

  useEffect(() => { if (courant) marquerSalonLu(courant.id).then(rechargerSalons).catch(() => undefined); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [courant?.id]);
  usePolling(useCallback(reload, [reload]), Boolean(courant), 10000);

  async function agir(fn: () => Promise<unknown>) {
    try { await fn(); reload(); } catch (e) { notifier(messageErreur(e), "error"); }
  }

  const base = `/applications/${application.id}/discussions`;
  const generaux = (salons ?? []).filter((s) => s.type === "general");
  const problemes = (salons ?? []).filter((s) => s.type === "probleme" && !s.archive);
  const archives = (salons ?? []).filter((s) => s.type === "probleme" && s.archive);
  const Entree = ({ s }: { s: NonNullable<typeof salons>[number] }) => (
    <ListItemButton selected={s.id === courant?.id} onClick={() => navigate(`${base}/${s.id}`)}>
      <ListItemText primary={s.titre} primaryTypographyProps={{ noWrap: true, fontSize: 13 }} />
      {s.non_lus > 0 && <Badge badgeContent={s.non_lus} color="primary" sx={{ mr: 1 }} />}
    </ListItemButton>
  );

  return (
    <Etat loading={loading} error={error}>
      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "280px 1fr" } }}>
        <Paper>
          <List dense subheader={<ListSubheader>Salons généraux</ListSubheader>}>{generaux.map((s) => <Entree key={s.id} s={s} />)}</List>
          <List dense subheader={<ListSubheader>Salons des problèmes</ListSubheader>}>{problemes.map((s) => <Entree key={s.id} s={s} />)}</List>
          {archives.length > 0 && <List dense subheader={<ListSubheader>Archivés (lecture seule)</ListSubheader>}>{archives.map((s) => <Entree key={s.id} s={s} />)}</List>}
          <Box sx={{ p: 1 }}><Button fullWidth size="small" variant="outlined" onClick={() => setNouveau(true)} disabled={!peutEcrire}>Nouveau salon</Button></Box>
        </Paper>

        <Paper sx={{ p: 2, minHeight: 360, display: "flex", flexDirection: "column" }}>
          {!courant ? <Typography color="text.secondary">Aucun salon sélectionné.</Typography> : (
            <>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                <Box>
                  <Typography variant="subtitle1" fontWeight={600}>{courant.titre}</Typography>
                  <Typography variant="caption" color="text.secondary">{courant.type === "probleme" ? "Salon créé automatiquement avec le problème · accessible à toute l'équipe" : "Salon général"}{courant.archive ? " · archivé (problème terminé)" : ""}</Typography>
                </Box>
                <Stack direction="row" spacing={1}>
                  {courant.probleme_id && <Button size="small" component={RouterLink} to={`/applications/${application.id}/problemes/${courant.probleme_id}`}>Ouvrir le problème</Button>}
                  {peut(PERM.SALON_SUPPRIMER) && <Button size="small" color="error" onClick={() => setSuppression(true)}>Supprimer le salon</Button>}
                </Stack>
              </Stack>
              <Stack spacing={1} sx={{ flex: 1, overflowY: "auto", maxHeight: 480, py: 1 }}>
                {(messages ?? []).filter((m) => !m.supprime_le).map((m) => m.type === "systeme" ? (
                  <Typography key={m.id} variant="caption" color="text.secondary" textAlign="center">⚡ {m.contenu} · {dateHeure(m.cree_le)}</Typography>
                ) : (
                  <Box key={m.id} sx={{ ml: m.parent_id ? 4 : 0, pl: m.parent_id ? 1 : 0, borderLeft: m.parent_id ? 2 : 0, borderColor: "divider" }}>
                    <Typography variant="caption" color="text.secondary">{nom(m.auteur_id)} · {dateHeure(m.cree_le)}{m.modifie_le ? " · modifié" : ""}</Typography>
                    {edition?.id === m.id ? (
                      <Stack direction="row" spacing={1}>
                        <TextField size="small" fullWidth value={edition.texte} onChange={(e) => setEdition({ id: m.id, texte: e.target.value })} />
                        <Button size="small" variant="contained" onClick={() => agir(async () => { await modifierMessage(m.id, edition.texte); setEdition(null); })}>OK</Button>
                      </Stack>
                    ) : <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>{m.contenu}</Typography>}
                    <Stack direction="row">
                      {peutEcrire && <IconButton size="small" aria-label="Répondre" onClick={() => setReponse(m.id)}><ReplyOutlined fontSize="small" /></IconButton>}
                      {m.auteur_id === user?.id && !courant.archive && <>
                        <IconButton size="small" aria-label="Modifier" onClick={() => setEdition({ id: m.id, texte: m.contenu })}><EditOutlined fontSize="small" /></IconButton>
                        <IconButton size="small" aria-label="Supprimer" onClick={() => agir(() => supprimerMessage(m.id))}><DeleteOutline fontSize="small" /></IconButton>
                      </>}
                    </Stack>
                  </Box>
                ))}
              </Stack>
              {reponse && <Typography variant="caption" color="text.secondary">En réponse au message n°{reponse} · <a href="#annuler" onClick={(e) => { e.preventDefault(); setReponse(null); }}>annuler</a></Typography>}
              <Stack direction="row" spacing={1} alignItems="flex-end" sx={{ mt: 1 }}>
                <TextField size="small" fullWidth multiline maxRows={5} placeholder="Écrire un message (@identifiant pour mentionner)" value={texte} onChange={(e) => setTexte(e.target.value)} disabled={!peutEcrire} />
                <Button variant="contained" disabled={!peutEcrire || !texte.trim()}
                  onClick={() => agir(async () => { await publierMessage(courant.id, { contenu: texte.trim(), parent_id: reponse }); setTexte(""); setReponse(null); })}>Envoyer</Button>
              </Stack>
            </>
          )}
        </Paper>
      </Box>

      <Dialog open={nouveau} onClose={() => setNouveau(false)} fullWidth maxWidth="xs">
        <DialogTitle>Nouveau salon</DialogTitle>
        <DialogContent><TextField sx={{ mt: 1 }} fullWidth size="small" label="Titre" value={titre} onChange={(e) => setTitre(e.target.value)} /></DialogContent>
        <DialogActions>
          <Button onClick={() => setNouveau(false)}>Annuler</Button>
          <Button variant="contained" disabled={!titre.trim()} onClick={async () => { try { const s = await creerSalon(application.id, titre.trim()); setNouveau(false); setTitre(""); rechargerSalons(); navigate(`${base}/${s.id}`); } catch (e) { notifier(messageErreur(e), "error"); } }}>Créer</Button>
        </DialogActions>
      </Dialog>
      <ConfirmDialog ouvert={suppression} titre="Supprimer ce salon ?" texte="Suppression logique, réservée au chef de projet : le salon disparaît de la liste mais reste tracé dans l'historique." confirmer="Supprimer"
        onConfirm={async () => { if (!courant) return; try { await supprimerSalon(courant.id); rechargerSalons(); navigate(base); } catch (e) { notifier(messageErreur(e), "error"); } }} onClose={() => setSuppression(false)} />
    </Etat>
  );
}
