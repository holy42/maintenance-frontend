import AccountCircleOutlined from "@mui/icons-material/AccountCircleOutlined";
import LockOutlined from "@mui/icons-material/LockOutlined";
import NotificationsActiveOutlined from "@mui/icons-material/NotificationsActiveOutlined";
import { Alert, Avatar, Box, Button, Checkbox, FormControlLabel, Paper, Stack, TextField, Typography } from "@mui/material";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { changerMotDePasse } from "../api/auth";
import { messageErreur } from "../api/client";
import { definirPreferences, definirPreferencesCanaux, preferences, preferencesCanaux } from "../api/suivi";
import PageHeader from "../components/PageHeader";
import { useAuth } from "../context/AuthContext";
import { useNotifier } from "../context/SnackbarContext";
import { useActualisationDonnees } from "../hooks/useActualisationDonnees";
import { EVENEMENT_PREFERENCES_NOTIFICATIONS_MODIFIEES } from "../utils/actualisation";
import { libelle, TYPES_NOTIFICATION } from "../utils/libelles";

export default function MonCompte() {
  const { user } = useAuth();
  const notifier = useNotifier();
  const [ancien, setAncien] = useState("");
  const [nouveau, setNouveau] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [actives, setActives] = useState<Record<string, boolean>>({});
  const [canaux, setCanaux] = useState({ son: true, navigateur: true });
  const [permissionNavigateur, setPermissionNavigateur] = useState<NotificationPermission | "indisponible">("default");

  const actualiserPreferences = useCallback(() => {
    Promise.all([preferences(), preferencesCanaux()]).then(([liste, prefsCanaux]) => {
      const etat: Record<string, boolean> = {};
      TYPES_NOTIFICATION.forEach((t) => { etat[t] = true; });
      liste.forEach((p) => { etat[p.type_evenement] = p.active; });
      setActives(etat);
      setCanaux(prefsCanaux);
    }).catch((e) => notifier(messageErreur(e), "error"));
  }, [notifier]);

  useEffect(() => { actualiserPreferences(); }, [actualiserPreferences]);
  useActualisationDonnees(actualiserPreferences);
  useEffect(() => {
    setPermissionNavigateur(typeof Notification === "undefined" ? "indisponible" : Notification.permission);
  }, []);

  async function changerMdp(e: FormEvent) {
    e.preventDefault();
    if (nouveau.length < 10) { setErreur("Le nouveau mot de passe doit contenir au moins 10 caractères."); return; }
    if (nouveau !== confirmation) { setErreur("La confirmation ne correspond pas."); return; }
    setErreur(null);
    try {
      await changerMotDePasse(ancien, nouveau);
      setAncien(""); setNouveau(""); setConfirmation("");
      notifier("Mot de passe modifié.");
    } catch (err) { setErreur(messageErreur(err)); }
  }

  async function enregistrerPreferences() {
    try {
      await Promise.all([
        definirPreferences(TYPES_NOTIFICATION.map((t) => ({ type_evenement: t, active: actives[t] ?? true }))),
        definirPreferencesCanaux(canaux),
      ]);
      window.dispatchEvent(new Event(EVENEMENT_PREFERENCES_NOTIFICATIONS_MODIFIEES));
      notifier("Préférences enregistrées.");
    } catch (e) { notifier(messageErreur(e), "error"); }
  }

  async function autoriserNotificationsNavigateur() {
    if (typeof Notification === "undefined") {
      setPermissionNavigateur("indisponible");
      return;
    }
    try { setPermissionNavigateur(await Notification.requestPermission()); }
    catch (e) { notifier(messageErreur(e), "error"); }
  }

  return (
    <>
      <PageHeader titre="Mon compte" />
      <Stack spacing={2} sx={{ maxWidth: 680, width: "100%", mx: "auto" }}>
        <Paper sx={{ p: { xs: 2, sm: 2.5 }, borderRadius: 2 }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Avatar sx={{ width: 48, height: 48, bgcolor: "primary.main" }}><AccountCircleOutlined /></Avatar>
            <Box>
              <Typography variant="subtitle1" fontWeight={700}>Profil</Typography>
              <Typography variant="body2" fontWeight={600}>{user?.identifiant}</Typography>
            </Box>
          </Stack>
          <Stack spacing={0.5} sx={{ mt: 1.5, pl: { sm: 7.5 } }}>
            <Typography variant="body2" color="text.secondary">E-mail : {user?.email ?? "non renseigné"}</Typography>
            <Typography variant="caption" color="text.secondary">Vos rôles sont attribués par l'administrateur.</Typography>
          </Stack>
        </Paper>
        <Paper component="form" onSubmit={changerMdp} noValidate sx={{ p: { xs: 2, sm: 2.5 }, borderRadius: 2 }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
            <LockOutlined color="primary" />
            <Typography variant="subtitle1" fontWeight={700}>Mot de passe</Typography>
          </Stack>
          <Stack spacing={2}>
            <Box sx={{ width: "100%", maxWidth: 520, mx: "auto" }}>
              <Stack spacing={2}>
                <TextField fullWidth size="small" label="Mot de passe actuel" type="password" value={ancien} onChange={(e) => setAncien(e.target.value)} autoComplete="current-password" />
                <TextField fullWidth size="small" label="Nouveau mot de passe" type="password" value={nouveau} onChange={(e) => setNouveau(e.target.value)} autoComplete="new-password" />
                <TextField fullWidth size="small" label="Confirmer" type="password" value={confirmation} onChange={(e) => setConfirmation(e.target.value)} autoComplete="new-password" />
              </Stack>
            </Box>
            {erreur && <Alert severity="error">{erreur}</Alert>}
            <Button type="submit" variant="outlined" sx={{ alignSelf: { xs: "stretch", sm: "center" }, minWidth: { sm: 240 } }}>Changer le mot de passe</Button>
          </Stack>
        </Paper>
        <Paper sx={{ p: { xs: 2, sm: 2.5 }, borderRadius: 2 }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
            <NotificationsActiveOutlined color="primary" />
            <Typography variant="subtitle1" fontWeight={700}>Notifications à recevoir</Typography>
          </Stack>
          <Stack sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, columnGap: 2 }}>
            {TYPES_NOTIFICATION.map((t) => (
              <FormControlLabel key={t} label={libelle("evenement", t)}
                control={<Checkbox checked={actives[t] ?? true} onChange={(e) => setActives({ ...actives, [t]: e.target.checked })} />} />
            ))}
          </Stack>
          <Typography variant="subtitle2" fontWeight={700} sx={{ mt: 2 }}>Alertes sur cet appareil</Typography>
          <Stack sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, columnGap: 2 }}>
            <FormControlLabel label="Émettre un son court à chaque notification"
              control={<Checkbox checked={canaux.son} onChange={(e) => setCanaux({ ...canaux, son: e.target.checked })} />} />
            <FormControlLabel label="Afficher les notifications Windows / navigateur"
              control={<Checkbox checked={canaux.navigateur} onChange={(e) => setCanaux({ ...canaux, navigateur: e.target.checked })} />} />
          </Stack>
          {canaux.navigateur && permissionNavigateur === "default" && (
            <Button size="small" variant="outlined" onClick={autoriserNotificationsNavigateur} sx={{ mt: 0.5 }}>
              Autoriser les notifications du navigateur
            </Button>
          )}
          {canaux.navigateur && permissionNavigateur === "denied" && (
            <Alert severity="warning" sx={{ mt: 1 }}>Les notifications sont bloquées par le navigateur. Autorisez-les dans les paramètres du site.</Alert>
          )}
          {canaux.navigateur && permissionNavigateur === "indisponible" && (
            <Alert severity="info" sx={{ mt: 1 }}>Ce navigateur ne prend pas en charge les notifications système.</Alert>
          )}
          <Button variant="contained" onClick={enregistrerPreferences} sx={{ mt: 1, display: "flex", mx: { xs: 0, sm: "auto" }, minWidth: { sm: 220 } }}>Enregistrer</Button>
        </Paper>
      </Stack>
    </>
  );
}
