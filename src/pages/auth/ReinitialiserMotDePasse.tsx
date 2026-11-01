import { Alert, Button, Link, Stack, TextField, Typography } from "@mui/material";
import { useState, type FormEvent } from "react";
import { Link as RouterLink, useSearchParams } from "react-router-dom";
import { messageErreur } from "../../api/client";
import { reinitialiser } from "../../api/auth";

export default function ReinitialiserMotDePasse() {
  const [params] = useSearchParams();
  const jeton = params.get("jeton") ?? "";
  const [mdp, setMdp] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [fait, setFait] = useState(false);

  async function soumettre(e: FormEvent) {
    e.preventDefault();
    if (mdp.length < 10) { setErreur("Le mot de passe doit contenir au moins 10 caractères."); return; }
    if (mdp !== confirmation) { setErreur("Les deux mots de passe ne correspondent pas."); return; }
    setErreur(null);
    try { await reinitialiser(jeton, mdp); setFait(true); } catch (err) { setErreur(messageErreur(err)); }
  }

  if (!jeton) return <Alert severity="error">Lien de réinitialisation invalide.</Alert>;
  if (fait) return <Stack spacing={2}><Alert severity="success">Mot de passe modifié.</Alert><Link component={RouterLink} to="/connexion">Se connecter</Link></Stack>;

  return (
    <form onSubmit={soumettre} noValidate>
      <Stack spacing={2}>
        <Typography variant="h5" component="h1" textAlign="center">Nouveau mot de passe</Typography>
        <TextField label="Nouveau mot de passe" type="password" value={mdp} onChange={(e) => setMdp(e.target.value)} autoComplete="new-password" />
        <TextField label="Confirmer" type="password" value={confirmation} onChange={(e) => setConfirmation(e.target.value)} autoComplete="new-password" />
        {erreur && <Alert severity="error">{erreur}</Alert>}
        <Button type="submit" variant="contained">Enregistrer</Button>
      </Stack>
    </form>
  );
}
