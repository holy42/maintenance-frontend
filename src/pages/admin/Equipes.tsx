import PersonRemoveOutlined from "@mui/icons-material/PersonRemoveOutlined";
import GroupsOutlined from "@mui/icons-material/GroupsOutlined";
import GroupAddOutlined from "@mui/icons-material/GroupAddOutlined";
import {
  Avatar, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, List, ListItemButton, ListItemText, Paper, Stack, Table,
  TableBody, TableCell, TableHead, TableRow, TextField, Typography,
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
      <PageHeader titre="Équipes" fil={[{ libelle: "Administration" }, { libelle: "Équipes" }]} actions={<Button variant="contained" startIcon={<GroupAddOutlined />} onClick={() => setNouvelle(true)}>Nouvelle équipe</Button>} />
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
                <Typography variant="subtitle1" fontWeight={700}>Membres</Typography>
                <Typography variant="caption" color="text.secondary">{(membres ?? []).length} membre{(membres ?? []).length === 1 ? "" : "s"} dans l’équipe sélectionnée</Typography>
              </Box>
              <Button variant="outlined" startIcon={<GroupAddOutlined />} onClick={() => setAjout(true)} disabled={!equipeId}>Ajouter un membre</Button>
            </Stack>
            <Box sx={{ overflowX: "auto", display: { xs: "none", sm: "block" } }}>
            <Table size="small">
              <TableHead><TableRow><TableCell>Membre</TableCell><TableCell>Rôle dans l'équipe</TableCell><TableCell align="right" /></TableRow></TableHead>
              <TableBody>
                {(membres ?? []).map((m) => (
                  <TableRow key={m.utilisateur_id}>
                    <TableCell>{m.identifiant}</TableCell>
                    <TableCell sx={{ width: 220 }}>
                      <ChampSelect label="Rôle" valeur={String(m.role_id)} options={options}
                        onChange={(v) => equipeId && agir(() => attribuerRole(equipeId, m.utilisateur_id, Number(v)), "Rôle modifié.")} />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton aria-label="Retirer de l'équipe" onClick={() => equipeId && agir(() => retirerMembre(equipeId, m.utilisateur_id), "Membre retiré.")}><PersonRemoveOutlined /></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {(membres ?? []).length === 0 && <TableRow><TableCell colSpan={3}><Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>Aucun membre dans cette équipe.</Typography></TableCell></TableRow>}
              </TableBody>
            </Table>
            </Box>
            <Stack spacing={1} sx={{ display: { xs: "flex", sm: "none" } }}>
              {(membres ?? []).map((m) => (
                <Paper key={m.utilisateur_id} sx={{ p: 1.25, borderRadius: 1.5, bgcolor: "background.default" }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Avatar sx={{ width: 34, height: 34, bgcolor: "secondary.main" }}>{m.identifiant.slice(0, 1).toUpperCase()}</Avatar>
                    <Typography variant="body2" fontWeight={600} sx={{ flex: 1, overflowWrap: "anywhere" }}>{m.identifiant}</Typography>
                    <IconButton size="small" aria-label="Retirer de l'équipe" onClick={() => equipeId && agir(() => retirerMembre(equipeId, m.utilisateur_id), "Membre retiré.")}><PersonRemoveOutlined /></IconButton>
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
        <DialogContent><Box sx={{ maxWidth: 440, mx: "auto" }}><TextField sx={{ mt: 1 }} fullWidth size="small" label="Nom" value={nom} onChange={(e) => setNom(e.target.value)} /></Box></DialogContent>
        <DialogActions>
          <Button onClick={() => setNouvelle(false)}>Annuler</Button>
          <Button variant="contained" disabled={!nom.trim()}
            onClick={async () => { try { await creerEquipe({ nom: nom.trim() }); setNom(""); setNouvelle(false); notifier("Équipe créée."); reload(); } catch (e) { notifier(messageErreur(e), "error"); } }}>Créer</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={ajout} onClose={() => setAjout(false)} fullWidth maxWidth="xs">
        <DialogTitle>Ajouter un membre</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1, maxWidth: 440, mx: "auto" }}>
            <ChampSelect label="Utilisateur" valeur={utilisateurId} onChange={setUtilisateurId}
              options={(utilisateurs ?? []).filter((u) => u.actif && !dejaMembres.has(u.id)).map((u) => ({ valeur: String(u.id), libelle: u.identifiant }))} />
            <ChampSelect label="Rôle" valeur={roleId} onChange={setRoleId} options={options} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAjout(false)}>Annuler</Button>
          <Button variant="contained" disabled={!utilisateurId || !roleId || !equipeId}
            onClick={() => equipeId && agir(() => attribuerRole(equipeId, Number(utilisateurId), Number(roleId)), "Membre ajouté.").then(() => { setAjout(false); setUtilisateurId(""); })}>Ajouter</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
