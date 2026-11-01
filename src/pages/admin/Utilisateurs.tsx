import KeyOutlined from "@mui/icons-material/KeyOutlined";
import PersonOffOutlined from "@mui/icons-material/PersonOffOutlined";
import PersonOutline from "@mui/icons-material/PersonOutline";
import {
  Alert, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, IconButton, Paper, Stack, Switch, Table,
  TableBody, TableCell, TableHead, TableRow, TextField, Tooltip,
} from "@mui/material";
import { useState } from "react";
import {
  attribuerRole, creerUtilisateur, desactiverUtilisateur, listEquipes, listRoles, listUtilisateurs, reactiverUtilisateur,
  reinitialiserMotDePasseUtilisateur,
} from "../../api/administration";
import { messageErreur } from "../../api/client";
import type { Utilisateur } from "../../api/types";
import ChampSelect from "../../components/ChampSelect";
import Etat from "../../components/Etat";
import PageHeader from "../../components/PageHeader";
import { useNotifier } from "../../context/SnackbarContext";
import { useAsync } from "../../hooks/useAsync";

export default function Utilisateurs() {
  const notifier = useNotifier();
  const { data: utilisateurs, loading, error, reload } = useAsync(listUtilisateurs);
  const { data: equipes } = useAsync(listEquipes);
  const { data: roles } = useAsync(listRoles);
  const [creation, setCreation] = useState(false);
  const [cible, setCible] = useState<Utilisateur | null>(null);   // attribution de rôle
  const [form, setForm] = useState({ identifiant: "", email: "", mot_de_passe: "", est_admin: false });
  const [equipeId, setEquipeId] = useState("");
  const [roleId, setRoleId] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);

  async function agir(fn: () => Promise<unknown>, succes: string) {
    try { await fn(); notifier(succes); reload(); } catch (e) { notifier(messageErreur(e), "error"); }
  }

  async function creer() {
    if (form.identifiant.trim().length < 3 || form.mot_de_passe.length < 10) {
      setErreur("Identifiant : 3 caractères minimum. Mot de passe : 10 caractères minimum.");
      return;
    }
    try {
      await creerUtilisateur({ identifiant: form.identifiant.trim(), email: form.email.trim() || undefined, mot_de_passe: form.mot_de_passe, est_admin: form.est_admin });
      setCreation(false); setForm({ identifiant: "", email: "", mot_de_passe: "", est_admin: false }); setErreur(null);
      notifier("Utilisateur créé."); reload();
    } catch (e) { setErreur(messageErreur(e)); }
  }

  return (
    <>
      <PageHeader titre="Utilisateurs" fil={[{ libelle: "Administration" }, { libelle: "Utilisateurs" }]}
        actions={<Button variant="contained" onClick={() => setCreation(true)}>Nouvel utilisateur</Button>} />
      <Etat loading={loading} error={error}>
        <Paper sx={{ overflowX: "auto" }}>
          <Table size="small">
            <TableHead><TableRow><TableCell>Utilisateur</TableCell><TableCell>E-mail</TableCell><TableCell>Statut</TableCell><TableCell align="right">Actions</TableCell></TableRow></TableHead>
            <TableBody>
              {(utilisateurs ?? []).map((u) => (
                <TableRow key={u.id} hover>
                  <TableCell>{u.identifiant} {u.est_admin && <Chip size="small" label="Administrateur" sx={{ ml: 1 }} />}</TableCell>
                  <TableCell>{u.email ?? "—"}</TableCell>
                  <TableCell><Chip size="small" label={u.actif ? "Actif" : "Désactivé"} color={u.actif ? "success" : "default"} variant={u.actif ? "filled" : "outlined"} /></TableCell>
                  <TableCell align="right">
                    <Tooltip title="Attribuer un rôle dans une équipe"><IconButton onClick={() => setCible(u)} aria-label="Attribuer un rôle"><PersonOutline /></IconButton></Tooltip>
                    <Tooltip title="Réinitialiser le mot de passe"><IconButton onClick={() => agir(() => reinitialiserMotDePasseUtilisateur(u.id), "Lien de réinitialisation envoyé.")} aria-label="Réinitialiser le mot de passe"><KeyOutlined /></IconButton></Tooltip>
                    {u.actif
                      ? <Tooltip title="Désactiver (on ne supprime jamais un compte)"><IconButton onClick={() => agir(() => desactiverUtilisateur(u.id), "Compte désactivé.")} aria-label="Désactiver"><PersonOffOutlined /></IconButton></Tooltip>
                      : <Button size="small" onClick={() => agir(() => reactiverUtilisateur(u.id), "Compte réactivé.")}>Réactiver</Button>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      </Etat>

      <Dialog open={creation} onClose={() => setCreation(false)} fullWidth maxWidth="xs">
        <DialogTitle>Nouvel utilisateur</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField size="small" label="Identifiant" value={form.identifiant} onChange={(e) => setForm({ ...form, identifiant: e.target.value })} />
            <TextField size="small" label="E-mail (facultatif)" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <TextField size="small" label="Mot de passe initial" type="password" value={form.mot_de_passe} onChange={(e) => setForm({ ...form, mot_de_passe: e.target.value })} />
            <FormControlLabel label="Administrateur de la plateforme" control={<Switch checked={form.est_admin} onChange={(e) => setForm({ ...form, est_admin: e.target.checked })} />} />
            {erreur && <Alert severity="error">{erreur}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions><Button onClick={() => setCreation(false)}>Annuler</Button><Button variant="contained" onClick={creer}>Créer</Button></DialogActions>
      </Dialog>

      <Dialog open={cible !== null} onClose={() => setCible(null)} fullWidth maxWidth="xs">
        <DialogTitle>Attribuer un rôle à {cible?.identifiant}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <ChampSelect label="Équipe" valeur={equipeId} onChange={setEquipeId} options={(equipes ?? []).map((e) => ({ valeur: String(e.id), libelle: e.nom }))} />
            <ChampSelect label="Rôle" valeur={roleId} onChange={setRoleId} options={(roles ?? []).map((r) => ({ valeur: String(r.id), libelle: r.nom }))} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCible(null)}>Annuler</Button>
          <Button variant="contained" disabled={!equipeId || !roleId || !cible}
            onClick={() => cible && agir(() => attribuerRole(Number(equipeId), cible.id, Number(roleId)), "Rôle attribué.").then(() => setCible(null))}>Attribuer</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
