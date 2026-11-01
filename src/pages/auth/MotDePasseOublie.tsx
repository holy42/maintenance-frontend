import { Alert, Button, Link, Stack, TextField, Typography } from "@mui/material";
import { useState, type FormEvent } from "react";
import { Link as RouterLink } from "react-router-dom";
import { messageErreur } from "../../api/client";
import { motDePasseOublie } from "../../api/auth";

export default function MotDePasseOublie() {
  const [valeur, setValeur] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  async function soumettre(e: FormEvent) {
    e.preventDefault();
    if (!valeur.trim()) { setErreur("Entrez votre identifiant ou votre adresse e-mail."); return; }
    setErreur(null);
    try { setMessage((await motDePasseOublie(valeur.trim())).message); } catch (err) { setErreur(messageErreur(err)); }
  }

  return (
    <form onSubmit={soumettre} noValidate>
      <Stack spacing={2}>
        <Typography variant="h5" component="h1" textAlign="center">Mot de passe oublié</Typography>
        <TextField label="Identifiant ou e-mail" value={valeur} onChange={(e) => setValeur(e.target.value)} autoFocus />
        {erreur && <Alert severity="error">{erreur}</Alert>}
        {message && <Alert severity="success">{message}</Alert>}
        <Button type="submit" variant="contained">Envoyer le lien</Button>
        <Link component={RouterLink} to="/connexion" textAlign="center" fontSize={13}>Retour à la connexion</Link>
      </Stack>
    </form>
  );
}
