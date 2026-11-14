import BoutonAction from "../../components/BoutonAction";
import ChampTexte from "../../components/ChampTexte";
import PersonRemoveOutlined from "@mui/icons-material/PersonRemoveOutlined";
import GroupsOutlined from "@mui/icons-material/GroupsOutlined";
import GroupAddOutlined from "@mui/icons-material/GroupAddOutlined";
import {
  Avatar, Box, Chip, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, List, ListItemButton, ListItemText, Paper, Stack, Table,
  TableBody, TableCell, TableHead, TableRow, Tooltip, Typography,
} from "@mui/material";
import { useState } from "react";
import { attribuerRole, creerEquipe, listEquipes, listRoles, listUtilisateurs, membresEquipe, retirerMembre } from "../../api/administration";
import { messageErreur } from "../../api/client";
import ChampSelect from "../../components/ChampSelect";
import Etat from "../../components/Etat";
import PageHeader from "../../components/PageHeader";
import { useNotifier } from "../../context/SnackbarContext";
import { useAsync } from "../../hooks/useAsync";

export default function Equipes() {
  const notifier = useNotifier();
  const { data: equipes, loading, error, reload } = useAsync(listEquipes);
  const { data: roles } = useAsync(listRoles);
  const { data: utilisateurs } = useAsync(listUtilisateurs);
  const [choix, setChoix] = useState<number | null>(null);
  const [nouvelle, setNouvelle] = useState(false);
  const [nom, setNom] = useState("");
  const [ajout, setAjout] = useState(false);
  const [utilisateurId, setUtilisateurId] = useState("");
  const [roleId, setRoleId] = useState("");

  const equipeId = choix ?? equipes?.[0]?.id ?? null;
  const { data: membres, reload: rechargerMembres } = useAsync(() => (equipeId ? membresEquipe(equipeId) : Promise.resolve([])), [equipeId]);

  async function agir(fn: () => Promise<unknown>, succes: string) {
    try { await fn(); notifier(succes); rechargerMembres(); } catch (e) { notifier(messageErreur(e), "error"); }
  }

  const options = (roles ?? []).map((r) => ({ valeur: String(r.id), libelle: r.nom }));
  const dejaMembres = new Set((membres ?? []).map((m) => m.utilisateur_id));

  return (
    <>
      <PageHeader titre="Équipes" fil={[{ libelle: "Administration" }, { libelle: "Équipes" }]} actions={<BoutonAction variant="contained" startIcon={<GroupAddOutlined />} onClick={() => setNouvelle(true)}>Nouvelle équipe</BoutonAction>} />
      <Etat loading={loading} error={error}>
        <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "1fr 2.2fr" } }}>
          <Paper sx={{ overflow: "hidden", borderRadius: 2 }}>
            <Box sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: "divider", bgcolor: "action.hover" }}>
              <Typography variant="subtitle2" fontWeight={700}>Équipes <Typography component="span" variant="caption" color="text.secondary">· {(equipes ?? []).length}</Typography></Typography>
            </Box>
            <List sx={{ p: 1 }}>
              {(equipes ?? []).map((e) => (
                <ListItemButton key={e.id} selected={e.id === equipeId} onClick={() => setChoix(e.id)} sx={{ mb: 0.5, borderRadius: 1.5, px: 1.5 }}>
                  <Avatar sx={{ width: 36, height: 36, mr: 1.25, bgcolor: e.id === equipeId ? "primary.main" : "action.selected" }}><GroupsOutlined fontSize="small" /></Avatar>
                  <ListItemText primary={e.nom} secondary={e.description} primaryTypographyProps={{ fontWeight: e.id === equipeId ? 700 : 500 }} />
                </ListItemButton>
              ))}
              {(equipes ?? []).length === 0 && <Typography sx={{ p: 2 }} color="text.secondary" variant="body2">Aucune équipe.</Typography>}
          </List></Paper>
          <Paper sx={{ p: { xs: 1.5, sm: 2 }, borderRadius: 2, minWidth: 0 }}>
            <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "stretch", sm: "center" }} spacing={1.25} sx={{ mb: 1.5 }}>
              <Box>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="subtitle1" fontWeight={700}>Membres</Typography>
                  <Chip size="small" color="primary" variant="outlined" label={(membres ?? []).length} />
                </Stack>
                <Typography variant="caption" color="text.secondary">Comptes et rôles de l’équipe sélectionnée</Typography>
              </Box>
              <BoutonAction variant="outlined" startIcon={<GroupAddOutlined />} onClick={() => setAjout(true)} disabled={!equipeId}>Ajouter un membre</BoutonAction>
            </Stack>
            <Box sx={{ overflowX: "auto", display: { xs: "none", sm: "block" } }}>
            <Table size="small">
              <TableHead><TableRow><TableCell>Membre</TableCell><TableCell>Accès à l’équipe</TableCell><TableCell align="right">Actions</TableCell></TableRow></TableHead>
              <TableBody>
                {(membres ?? []).map((m) => (
                  <TableRow key={m.utilisateur_id} hover>
                    <TableCell>
                      <Stack direction="row" spacing={1.25} alignItems="center">
                        <Avatar sx={{ width: 36, height: 36, bgcolor: "primary.main", fontSize: 14, fontWeight: 700 }}>{m.identifiant.slice(0, 1).toUpperCase()}</Avatar>
                        <Typography variant="body2" fontWeight={600}>{m.identifiant}</Typography>
                      </Stack>
                    </TableCell>
                    <TableCell sx={{ width: 260 }}>
                      <ChampSelect label="Rôle dans l’équipe" valeur={String(m.role_id)} options={options}
                        onChange={(v) => equipeId && agir(() => attribuerRole(equipeId, m.utilisateur_id, Number(v)), "Rôle modifié.")} />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Retirer de l’équipe">
                        <IconButton color="error" aria-label="Retirer de l'équipe" onClick={() => equipeId && agir(() => retirerMembre(equipeId, m.utilisateur_id), "Membre retiré.")}><PersonRemoveOutlined /></IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
                {(membres ?? []).length === 0 && <TableRow><TableCell colSpan={3} sx={{ py: 4, textAlign: "center" }}>
                  <Typography variant="body2" color="text.secondary">Aucun membre dans cette équipe.</Typography>
                  <BoutonAction size="small" startIcon={<GroupAddOutlined />} onClick={() => setAjout(true)} disabled={!equipeId} sx={{ mt: 0.75 }}>Ajouter un membre</BoutonAction>
                </TableCell></TableRow>}
              </TableBody>
            </Table>
            </Box>
            <Stack spacing={1} sx={{ display: { xs: "flex", sm: "none" } }}>
              {(membres ?? []).map((m) => (
                <Paper key={m.utilisateur_id} sx={{ p: 1.5, borderRadius: 1.75, bgcolor: "background.default" }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Avatar sx={{ width: 38, height: 38, bgcolor: "primary.main", fontWeight: 700 }}>{m.identifiant.slice(0, 1).toUpperCase()}</Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" fontWeight={650} sx={{ overflowWrap: "anywhere" }}>{m.identifiant}</Typography>
                      <Typography variant="caption" color="text.secondary">Membre de l’équipe</Typography>
                    </Box>
                    <Tooltip title="Retirer de l’équipe">
                      <IconButton size="small" color="error" aria-label="Retirer de l'équipe" onClick={() => equipeId && agir(() => retirerMembre(equipeId, m.utilisateur_id), "Membre retiré.")}><PersonRemoveOutlined /></IconButton>
                    </Tooltip>
                  </Stack>
                  <Box sx={{ mt: 1 }}>
                    <ChampSelect label="Rôle dans l'équipe" valeur={String(m.role_id)} options={options}
                      onChange={(v) => equipeId && agir(() => attribuerRole(equipeId, m.utilisateur_id, Number(v)), "Rôle modifié.")} />
                  </Box>
                </Paper>
              ))}
              {(membres ?? []).length === 0 && <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: "center" }}>Aucun membre dans cette équipe.</Typography>}
            </Stack>
            <Typography variant="caption" color="text.secondary">Retirer un membre ne supprime ni ses notes, ni ses décisions, ni ses tests : ils restent dans l'historique.</Typography>
          </Paper>
        </Box>
      </Etat>

      <Dialog open={nouvelle} onClose={() => setNouvelle(false)} fullWidth maxWidth="xs">
        <DialogTitle>Nouvelle équipe</DialogTitle>
        <DialogContent><Box sx={{ maxWidth: 440, mx: "auto" }}><ChampTexte sx={{ mt: 1 }} fullWidth size="small" label="Nom" value={nom} onChange={(e) => setNom(e.target.value)} /></Box></DialogContent>
        <DialogActions>
          <BoutonAction onClick={() => setNouvelle(false)}>Annuler</BoutonAction>
          <BoutonAction variant="contained" disabled={!nom.trim()}
            onClick={async () => { try { await creerEquipe({ nom: nom.trim() }); setNom(""); setNouvelle(false); notifier("Équipe créée."); reload(); } catch (e) { notifier(messageErreur(e), "error"); } }}>Créer</BoutonAction>
        </DialogActions>
      </Dialog>

      <Dialog open={ajout} onClose={() => setAjout(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ pb: 1 }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Avatar sx={{ width: 44, height: 44, bgcolor: "primary.main" }}><GroupAddOutlined /></Avatar>
            <Box>
              <Typography variant="h6" fontWeight={700}>Ajouter un membre</Typography>
              <Typography variant="body2" color="text.secondary">Choisissez un compte actif et son rôle dans l’équipe.</Typography>
            </Box>
          </Stack>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <ChampSelect label="Utilisateur" valeur={utilisateurId} onChange={setUtilisateurId}
              options={(utilisateurs ?? []).filter((u) => u.actif && !dejaMembres.has(u.id)).map((u) => ({ valeur: String(u.id), libelle: u.identifiant }))} />
            <ChampSelect label="Rôle" valeur={roleId} onChange={setRoleId} options={options} />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <BoutonAction onClick={() => setAjout(false)}>Annuler</BoutonAction>
          <BoutonAction variant="contained" disabled={!utilisateurId || !roleId || !equipeId}
            onClick={() => equipeId && agir(() => attribuerRole(equipeId, Number(utilisateurId), Number(roleId)), "Membre ajouté.").then(() => { setAjout(false); setUtilisateurId(""); })}>Ajouter</BoutonAction>
        </DialogActions>
      </Dialog>
    </>
  );
}
