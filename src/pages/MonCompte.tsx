import { Alert, Button, Checkbox, FormControlLabel, Paper, Stack, TextField, Typography } from "@mui/material";
import { useEffect, useState, type FormEvent } from "react";
import { changerMotDePasse } from "../api/auth";
import { messageErreur } from "../api/client";
import { definirPreferences, preferences } from "../api/suivi";
import PageHeader from "../components/PageHeader";
import { useAuth } from "../context/AuthContext";
import { useNotifier } from "../context/SnackbarContext";
import { libelle, TYPES_NOTIFICATION } from "../utils/libelles";

export default function MonCompte() {
  const { user } = useAuth();
  const notifier = useNotifier();
  const [ancien, setAncien] = useState("");
  const [nouveau, setNouveau] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [actives, setActives] = useState<Record<string, boolean>>({});

  useEffect(() => {
    preferences().then((liste) => {
      const etat: Record<string, boolean> = {};
      TYPES_NOTIFICATION.forEach((t) => { etat[t] = true; });          // tout est activé par défaut
      liste.forEach((p) => { etat[p.type_evenement] = p.active; });
      setActives(etat);
    }).catch((e) => notifier(messageErreur(e), "error"));
  }, [notifier]);

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
      await definirPreferences(TYPES_NOTIFICATION.map((t) => ({ type_evenement: t, active: actives[t] ?? true })));
      notifier("Préférences enregistrées.");
    } catch (e) { notifier(messageErreur(e), "error"); }
  }

  return (
    <>
      <PageHeader titre="Mon compte" />
      <Stack spacing={2} sx={{ maxWidth: 720 }}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>Profil</Typography>
          <Typography variant="body2">Identifiant : {user?.identifiant}</Typography>
          <Typography variant="body2" color="text.secondary">E-mail : {user?.email ?? "non renseigné"}</Typography>
          <Typography variant="caption" color="text.secondary">Vos rôles sont attribués par l'administrateur.</Typography>
        </Paper>
        <Paper component="form" onSubmit={changerMdp} noValidate sx={{ p: 2 }}>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>Mot de passe</Typography>
          <Stack spacing={2}>
            <TextField size="small" label="Mot de passe actuel" type="password" value={ancien} onChange={(e) => setAncien(e.target.value)} autoComplete="current-password" />
            <TextField size="small" label="Nouveau mot de passe" type="password" value={nouveau} onChange={(e) => setNouveau(e.target.value)} autoComplete="new-password" />
            <TextField size="small" label="Confirmer" type="password" value={confirmation} onChange={(e) => setConfirmation(e.target.value)} autoComplete="new-password" />
            {erreur && <Alert severity="error">{erreur}</Alert>}
            <Button type="submit" variant="outlined" sx={{ alignSelf: "flex-start" }}>Changer le mot de passe</Button>
          </Stack>
        </Paper>
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>Notifications à recevoir</Typography>
          <Stack>
            {TYPES_NOTIFICATION.map((t) => (
              <FormControlLabel key={t} label={libelle("evenement", t)}
                control={<Checkbox checked={actives[t] ?? true} onChange={(e) => setActives({ ...actives, [t]: e.target.checked })} />} />
            ))}
          </Stack>
          <Button variant="contained" onClick={enregistrerPreferences} sx={{ mt: 1 }}>Enregistrer</Button>
        </Paper>
      </Stack>
    </>
  );
}
