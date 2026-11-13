import DeleteOutline from "@mui/icons-material/DeleteOutline";
import EditOutlined from "@mui/icons-material/EditOutlined";
import ReplyOutlined from "@mui/icons-material/ReplyOutlined";
import ForumOutlined from "@mui/icons-material/ForumOutlined";
import { alpha } from "@mui/material/styles";
import {
  Badge, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, List, ListItemButton, ListItemText, ListSubheader, Paper,
  Stack, TextField, Typography,
} from "@mui/material";
import { useCallback, useEffect, useRef, useState } from "react";
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
  const { data: salons, loading, error } = useAsync(() => listSalons(application.id), [application.id]);
  const courant = (salons ?? []).find((s) => s.id === Number(salonId)) ?? (salonId ? undefined : salons?.[0]);
  const { data: messages, reload } = useAsync(() => (courant ? messagesSalon(courant.id) : Promise.resolve([])), [courant?.id]);
  const [texte, setTexte] = useState("");
  const [reponse, setReponse] = useState<number | null>(null);
  const [edition, setEdition] = useState<{ id: number; texte: string } | null>(null);
  const [nouveau, setNouveau] = useState(false);
  const [titre, setTitre] = useState("");
  const [suppression, setSuppression] = useState(false);
  const salonsMarquesLus = useRef(new Set<number>());
  const peutEcrire = peut(PERM.DISCUSSION_PARTICIPER) && !archivee && !courant?.archive;
  const base = `/applications/${application.id}/discussions`;

  useEffect(() => {
    if (!courant) return;
    if (!salonId) {
      navigate(`${base}/${courant.id}`, { replace: true });
      return;
    }
    if (salonsMarquesLus.current.has(courant.id)) return;
    salonsMarquesLus.current.add(courant.id);
    marquerSalonLu(courant.id).catch((e) => {
      salonsMarquesLus.current.delete(courant.id);
      notifier(messageErreur(e), "error");
    });
  }, [courant?.id, salonId, base, navigate, notifier]);
  usePolling(useCallback(reload, [reload]), Boolean(courant), 10000);

  async function agir(fn: () => Promise<unknown>) {
    try { await fn(); } catch (e) { notifier(messageErreur(e), "error"); }
  }

  const generaux = (salons ?? []).filter((s) => s.type === "general");
  const problemes = (salons ?? []).filter((s) => s.type === "probleme" && !s.archive);
  const archives = (salons ?? []).filter((s) => s.type === "probleme" && s.archive);
  const Entree = ({ s }: { s: NonNullable<typeof salons>[number] }) => (
    <ListItemButton selected={s.id === courant?.id} onClick={() => navigate(`${base}/${s.id}`)} sx={{ borderRadius: 1.5, mx: 0.75, width: "auto", py: 0.75 }}>
      <ListItemText primary={s.titre} primaryTypographyProps={{ noWrap: true, fontSize: 13 }} />
      {s.non_lus > 0 && <Badge badgeContent={s.non_lus} color="primary" sx={{ mr: 1 }} />}
    </ListItemButton>
  );

  return (
    <Etat loading={loading && !salons} error={error}>
      <Box sx={{ display: "grid", gap: 2, flex: 1, minHeight: 0, gridTemplateColumns: { xs: "1fr", md: "280px minmax(0, 1fr)" }, gridTemplateRows: { xs: "minmax(0, 220px) minmax(420px, 1fr)", md: "minmax(0, 1fr)" } }}>
        <Paper sx={{ borderRadius: 2.5, overflow: "hidden", minHeight: 0, overflowY: "auto", borderColor: "divider", display: "flex", flexDirection: "column" }}>
          <List dense subheader={<ListSubheader>Salons généraux</ListSubheader>}>{generaux.map((s) => <Entree key={s.id} s={s} />)}</List>
          <List dense subheader={<ListSubheader>Salons des problèmes</ListSubheader>}>{problemes.map((s) => <Entree key={s.id} s={s} />)}</List>
          {archives.length > 0 && <List dense subheader={<ListSubheader>Archivés (lecture seule)</ListSubheader>}>{archives.map((s) => <Entree key={s.id} s={s} />)}</List>}
          <Box sx={{ p: 1.25, position: "sticky", bottom: 0, bgcolor: "background.paper", borderTop: 1, borderColor: "divider" }}>
            <Button fullWidth size="small" variant="outlined" startIcon={<ForumOutlined />} onClick={() => setNouveau(true)} disabled={!peutEcrire}>Nouveau salon</Button>
          </Box>
        </Paper>

        <Paper sx={{ p: { xs: 1.5, sm: 2 }, minWidth: 0, minHeight: 0, display: "flex", flexDirection: "column", borderRadius: 2.5, borderColor: "divider" }}>
          {!courant ? <Typography color="text.secondary">Aucun salon sélectionné.</Typography> : (
            <>
              <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "stretch", sm: "center" }} spacing={1} sx={{ mb: 1.25, pb: 1.25, borderBottom: 1, borderColor: "divider" }}>
                <Box sx={{ minWidth: 0 }}>
                  <Stack direction="row" spacing={1} alignItems="center"><ForumOutlined color="primary" fontSize="small" /><Typography variant="subtitle1" fontWeight={700} sx={{ overflowWrap: "anywhere" }}>{courant.titre}</Typography></Stack>
                  <Typography variant="caption" color="text.secondary">{courant.type === "probleme" ? "Salon créé automatiquement avec le problème · accessible à toute l'équipe" : "Salon général"}{courant.archive ? " · archivé (problème terminé)" : ""}</Typography>
                </Box>
                <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                  {courant.probleme_id && <Button size="small" variant="outlined" component={RouterLink} to={`/applications/${application.id}/problemes/${courant.probleme_id}`}>Ouvrir le problème</Button>}
                  {peut(PERM.SALON_SUPPRIMER) && <Button size="small" color="error" onClick={() => setSuppression(true)}>Supprimer</Button>}
                </Stack>
              </Stack>
              <Stack spacing={1.25} sx={{ flex: 1, overflowY: "auto", minHeight: 220, py: 1, px: 0.25 }}>
                {(messages ?? []).filter((m) => !m.supprime_le).map((m) => m.type === "systeme" ? (
                  <Typography key={m.id} variant="caption" color="text.secondary" textAlign="center">⚡ {m.contenu} · {dateHeure(m.cree_le)}</Typography>
                ) : (
                  <Box key={m.id} sx={{
                    ml: { xs: m.parent_id ? 1.5 : 0, sm: m.parent_id ? 4 : 0 }, pl: m.parent_id ? 1 : 0,
                    borderLeft: m.parent_id ? 2 : 0, borderColor: "divider",
                    "& .message-content": {
                      display: "inline-block", maxWidth: "min(100%, 720px)", px: 1.5, py: 1, mt: 0.35, borderRadius: 2,
                      bgcolor: m.auteur_id === user?.id ? "action.selected" : "action.hover",
                      border: 1, borderColor: (theme) => alpha(theme.palette.secondary.main, theme.palette.mode === "light" ? 0.18 : 0.3),
                      overflowWrap: "anywhere",
                    },
                  }}>
                    <Typography variant="caption" color="text.secondary">{nom(m.auteur_id)} · {dateHeure(m.cree_le)}{m.modifie_le ? " · modifié" : ""}</Typography>
                    {edition?.id === m.id ? (
                      <Stack direction="row" spacing={1}>
                        <TextField size="small" fullWidth value={edition.texte} onChange={(e) => setEdition({ id: m.id, texte: e.target.value })} />
                        <Button size="small" variant="contained" onClick={() => agir(async () => { await modifierMessage(m.id, edition.texte); setEdition(null); })}>OK</Button>
                      </Stack>
                    ) : <Typography className="message-content" variant="body2" sx={{ whiteSpace: "pre-wrap" }}>{m.contenu}</Typography>}
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
              <Stack direction="row" spacing={1} alignItems="flex-end" sx={{ mt: 1.25, pt: 1.25, borderTop: 1, borderColor: "divider" }}>
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
          <Button variant="contained" disabled={!titre.trim()} onClick={async () => { try { const s = await creerSalon(application.id, titre.trim()); setNouveau(false); setTitre(""); navigate(`${base}/${s.id}`); } catch (e) { notifier(messageErreur(e), "error"); } }}>Créer</Button>
        </DialogActions>
      </Dialog>
      <ConfirmDialog ouvert={suppression} titre="Supprimer ce salon ?" texte="Suppression logique, réservée au chef de projet : le salon disparaît de la liste mais reste tracé dans l'historique." confirmer="Supprimer"
        onConfirm={async () => { if (!courant) return; try { await supprimerSalon(courant.id); navigate(base); } catch (e) { notifier(messageErreur(e), "error"); } }} onClose={() => setSuppression(false)} />
    </Etat>
  );
}
