import BoutonAction from "../../components/BoutonAction";
import ChampTexte from "../../components/ChampTexte";
import KeyOutlined from "@mui/icons-material/KeyOutlined";
import PersonOffOutlined from "@mui/icons-material/PersonOffOutlined";
import PersonOutline from "@mui/icons-material/PersonOutline";
import PersonAddAlt1Outlined from "@mui/icons-material/PersonAddAlt1Outlined";
import SearchOutlined from "@mui/icons-material/SearchOutlined";
import {
  Alert, Avatar, Box, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Divider, FormControlLabel, IconButton, InputAdornment, Paper, Stack, Switch, Table,
  TableBody, TableCell, TableHead, TableRow, Tooltip, Typography,
} from "@mui/material";
import { useMemo, useState } from "react";
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
  const [recherche, setRecherche] = useState("");
  const [equipeId, setEquipeId] = useState("");
  const [roleId, setRoleId] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);

  const utilisateursFiltres = useMemo(() => {
    const terme = recherche.trim().toLocaleLowerCase();
    return (utilisateurs ?? []).filter((u) =>
      !terme || u.identifiant.toLocaleLowerCase().includes(terme) || u.email?.toLocaleLowerCase().includes(terme),
    );
  }, [utilisateurs, recherche]);
  const utilisateursActifs = (utilisateurs ?? []).filter((u) => u.actif).length;

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
        actions={<BoutonAction variant="contained" startIcon={<PersonAddAlt1Outlined />} onClick={() => { setErreur(null); setCreation(true); }}>Nouvel utilisateur</BoutonAction>} />
      <Etat loading={loading} error={error}>
        <Paper sx={{ overflow: "hidden", borderRadius: 2 }}>
          <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "stretch", sm: "center" }}
            spacing={1.5} sx={{ p: { xs: 1.5, sm: 2 } }}>
            <Box>
              <Typography variant="subtitle1" fontWeight={700}>Annuaire de la plateforme</Typography>
              <Stack direction="row" spacing={0.75} sx={{ mt: 0.75 }}>
                <Chip size="small" label={`${(utilisateurs ?? []).length} compte${(utilisateurs ?? []).length === 1 ? "" : "s"}`} />
                <Chip size="small" color="success" variant="outlined" label={`${utilisateursActifs} actif${utilisateursActifs === 1 ? "" : "s"}`} />
              </Stack>
            </Box>
            <ChampTexte
              size="small"
              placeholder="Nom ou e-mail"
              aria-label="Rechercher un utilisateur"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              sx={{ width: { xs: "100%", sm: 280 } }}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchOutlined fontSize="small" /></InputAdornment> }}
            />
          </Stack>
          <Divider />
          <Box sx={{ overflowX: "auto", display: { xs: "none", sm: "block" } }}>
            <Table size="small">
              <TableHead><TableRow><TableCell>Utilisateur</TableCell><TableCell>E-mail</TableCell><TableCell>Statut</TableCell><TableCell align="right">Actions</TableCell></TableRow></TableHead>
              <TableBody>
                {utilisateursFiltres.map((u) => (
                  <TableRow key={u.id} hover>
                    <TableCell>
                      <Stack direction="row" spacing={1.25} alignItems="center">
                        <Avatar sx={{ width: 36, height: 36, bgcolor: u.est_admin ? "primary.main" : "action.selected", color: u.est_admin ? "common.white" : "text.secondary", fontSize: 14, fontWeight: 700 }}>
                          {u.identifiant.slice(0, 1).toUpperCase()}
                        </Avatar>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant="body2" fontWeight={650}>{u.identifiant}</Typography>
                          {u.est_admin && <Chip size="small" color="primary" variant="outlined" label="Administrateur" sx={{ mt: 0.35, height: 20 }} />}
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell>{u.email ?? <Typography variant="body2" color="text.disabled">Non renseigné</Typography>}</TableCell>
                    <TableCell><Chip size="small" label={u.actif ? "Actif" : "Désactivé"} color={u.actif ? "success" : "default"} variant={u.actif ? "filled" : "outlined"} /></TableCell>
                    <TableCell align="right">
                      <Stack direction="row" justifyContent="flex-end">
                        <Tooltip title="Attribuer un rôle dans une équipe"><IconButton onClick={() => setCible(u)} aria-label="Attribuer un rôle"><PersonOutline /></IconButton></Tooltip>
                        <Tooltip title="Réinitialiser le mot de passe"><IconButton onClick={() => agir(() => reinitialiserMotDePasseUtilisateur(u.id), "Lien de réinitialisation envoyé.")} aria-label="Réinitialiser le mot de passe"><KeyOutlined /></IconButton></Tooltip>
                        {u.actif
                          ? <Tooltip title="Désactiver (on ne supprime jamais un compte)"><IconButton onClick={() => agir(() => desactiverUtilisateur(u.id), "Compte désactivé.")} aria-label="Désactiver"><PersonOffOutlined /></IconButton></Tooltip>
                          : <BoutonAction size="small" onClick={() => agir(() => reactiverUtilisateur(u.id), "Compte réactivé.")}>Réactiver</BoutonAction>}
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
                {utilisateursFiltres.length === 0 && (
                  <TableRow><TableCell colSpan={4} sx={{ py: 5, textAlign: "center" }}>
                    <Typography fontWeight={600}>{recherche ? "Aucun résultat" : "Aucun utilisateur"}</Typography>
                    <Typography variant="body2" color="text.secondary">{recherche ? "Essayez un autre nom ou une autre adresse e-mail." : "Créez un compte pour commencer."}</Typography>
                  </TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </Box>
        </Paper>
        <Stack spacing={1.25} sx={{ display: { xs: "flex", sm: "none" } }}>
          {utilisateursFiltres.map((u) => (
            <Paper key={u.id} sx={{ p: 1.5, borderRadius: 2 }}>
              <Stack direction="row" spacing={1.25} alignItems="center">
                <Avatar sx={{ bgcolor: u.est_admin ? "primary.main" : "action.selected", color: u.est_admin ? "common.white" : "text.secondary", width: 40, height: 40, fontWeight: 700 }}>{u.identifiant.slice(0, 1).toUpperCase()}</Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap>
                    <Box component="span" sx={{ fontWeight: 700, overflowWrap: "anywhere" }}>{u.identifiant}</Box>
                    {u.est_admin && <Chip size="small" color="primary" variant="outlined" label="Administrateur" />}
                  </Stack>
                  <Box sx={{ color: "text.secondary", fontSize: 13, overflowWrap: "anywhere" }}>{u.email ?? "E-mail non renseigné"}</Box>
                  <Chip size="small" sx={{ mt: 0.75 }} label={u.actif ? "Actif" : "Désactivé"} color={u.actif ? "success" : "default"} variant={u.actif ? "filled" : "outlined"} />
                </Box>
              </Stack>
              <Stack direction="row" justifyContent="flex-end" sx={{ mt: 0.5 }}>
                <Tooltip title="Attribuer un rôle dans une équipe"><IconButton onClick={() => setCible(u)} aria-label="Attribuer un rôle"><PersonOutline /></IconButton></Tooltip>
                <Tooltip title="Réinitialiser le mot de passe"><IconButton onClick={() => agir(() => reinitialiserMotDePasseUtilisateur(u.id), "Lien de réinitialisation envoyé.")} aria-label="Réinitialiser le mot de passe"><KeyOutlined /></IconButton></Tooltip>
                {u.actif
                  ? <Tooltip title="Désactiver (on ne supprime jamais un compte)"><IconButton onClick={() => agir(() => desactiverUtilisateur(u.id), "Compte désactivé.")} aria-label="Désactiver"><PersonOffOutlined /></IconButton></Tooltip>
                  : <BoutonAction size="small" onClick={() => agir(() => reactiverUtilisateur(u.id), "Compte réactivé.")}>Réactiver</BoutonAction>}
              </Stack>
            </Paper>
          ))}
          {utilisateursFiltres.length === 0 && <Paper sx={{ p: 3, textAlign: "center", color: "text.secondary" }}>{recherche ? "Aucun résultat pour cette recherche." : "Aucun utilisateur."}</Paper>}
        </Stack>
      </Etat>

      <Dialog open={creation} onClose={() => setCreation(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ pb: 1 }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Avatar sx={{ width: 44, height: 44, bgcolor: "primary.main" }}><PersonAddAlt1Outlined /></Avatar>
            <Box>
              <Typography variant="h6" fontWeight={700}>Nouvel utilisateur</Typography>
              <Typography variant="body2" color="text.secondary">Créez un compte et définissez son accès à la plateforme.</Typography>
            </Box>
          </Stack>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" } }}>
              <ChampTexte fullWidth size="small" label="Identifiant" autoComplete="username" value={form.identifiant} onChange={(e) => setForm({ ...form, identifiant: e.target.value })} helperText="3 caractères minimum." />
              <ChampTexte fullWidth size="small" label="E-mail (facultatif)" type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </Box>
            <ChampTexte fullWidth size="small" label="Mot de passe initial" type="password" autoComplete="new-password" value={form.mot_de_passe} onChange={(e) => setForm({ ...form, mot_de_passe: e.target.value })} helperText="10 caractères minimum." />
            <Box sx={{ p: 1.5, border: 1, borderColor: "divider", borderRadius: 2 }}>
              <FormControlLabel
                label={<Box><Typography variant="body2" fontWeight={600}>Administrateur de la plateforme</Typography><Typography variant="caption" color="text.secondary">Accès aux paramètres et fonctions d’administration.</Typography></Box>}
                control={<Switch checked={form.est_admin} onChange={(e) => setForm({ ...form, est_admin: e.target.checked })} />}
              />
            </Box>
            {erreur && <Alert severity="error">{erreur}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <BoutonAction onClick={() => setCreation(false)}>Annuler</BoutonAction>
          <BoutonAction variant="contained" startIcon={<PersonAddAlt1Outlined />} onClick={creer}>Créer le compte</BoutonAction>
        </DialogActions>
      </Dialog>

      <Dialog open={cible !== null} onClose={() => setCible(null)} fullWidth maxWidth="xs">
        <DialogTitle>Attribuer un rôle à {cible?.identifiant}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1, maxWidth: 440, mx: "auto" }}>
            <ChampSelect label="Équipe" valeur={equipeId} onChange={setEquipeId} options={(equipes ?? []).map((e) => ({ valeur: String(e.id), libelle: e.nom }))} />
            <ChampSelect label="Rôle" valeur={roleId} onChange={setRoleId} options={(roles ?? []).map((r) => ({ valeur: String(r.id), libelle: r.nom }))} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <BoutonAction onClick={() => setCible(null)}>Annuler</BoutonAction>
          <BoutonAction variant="contained" disabled={!equipeId || !roleId || !cible}
            onClick={() => cible && agir(() => attribuerRole(Number(equipeId), cible.id, Number(roleId)), "Rôle attribué.").then(() => setCible(null))}>Attribuer</BoutonAction>
        </DialogActions>
      </Dialog>
    </>
  );
}
