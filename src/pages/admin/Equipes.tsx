import PersonRemoveOutlined from "@mui/icons-material/PersonRemoveOutlined";
import {
  Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, List, ListItemButton, ListItemText, Paper, Stack, Table,
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
      <PageHeader titre="Équipes" fil={[{ libelle: "Administration" }, { libelle: "Équipes" }]} actions={<Button variant="contained" onClick={() => setNouvelle(true)}>Nouvelle équipe</Button>} />
      <Etat loading={loading} error={error}>
        <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "1fr 2.2fr" } }}>
          <Paper><List>
            {(equipes ?? []).map((e) => (
              <ListItemButton key={e.id} selected={e.id === equipeId} onClick={() => setChoix(e.id)}><ListItemText primary={e.nom} secondary={e.description} /></ListItemButton>
            ))}
          </List></Paper>
          <Paper sx={{ p: 2 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
              <Typography variant="subtitle1" fontWeight={600}>Membres</Typography>
              <Button variant="outlined" onClick={() => setAjout(true)} disabled={!equipeId}>Ajouter un membre</Button>
            </Stack>
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
              </TableBody>
            </Table>
            <Typography variant="caption" color="text.secondary">Retirer un membre ne supprime ni ses notes, ni ses décisions, ni ses tests : ils restent dans l'historique.</Typography>
          </Paper>
        </Box>
      </Etat>

      <Dialog open={nouvelle} onClose={() => setNouvelle(false)} fullWidth maxWidth="xs">
        <DialogTitle>Nouvelle équipe</DialogTitle>
        <DialogContent><TextField sx={{ mt: 1 }} fullWidth size="small" label="Nom" value={nom} onChange={(e) => setNom(e.target.value)} /></DialogContent>
        <DialogActions>
          <Button onClick={() => setNouvelle(false)}>Annuler</Button>
          <Button variant="contained" disabled={!nom.trim()}
            onClick={async () => { try { await creerEquipe({ nom: nom.trim() }); setNom(""); setNouvelle(false); notifier("Équipe créée."); reload(); } catch (e) { notifier(messageErreur(e), "error"); } }}>Créer</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={ajout} onClose={() => setAjout(false)} fullWidth maxWidth="xs">
        <DialogTitle>Ajouter un membre</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
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
