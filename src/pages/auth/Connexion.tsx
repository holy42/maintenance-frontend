import { Alert, Button, Link, Stack, TextField, Typography } from "@mui/material";
import { useState, type FormEvent } from "react";
import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom";
import { messageErreur } from "../../api/client";
import { useAuth } from "../../context/AuthContext";

export default function Connexion() {
  const { connecter } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [identifiant, setIdentifiant] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);
  const retour = (location.state as { from?: string } | null)?.from ?? "/";

  async function soumettre(e: FormEvent) {
    e.preventDefault();
    if (!identifiant.trim() || !motDePasse) {
      setErreur("Entrez votre identifiant et votre mot de passe.");
      return;
    }
    setEnvoi(true);
    setErreur(null);
    try {
      await connecter(identifiant.trim(), motDePasse);
      navigate(retour, { replace: true });
    } catch (err) {
      setErreur(messageErreur(err));
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <form onSubmit={soumettre} noValidate>
      <Stack spacing={2}>
        <Typography variant="h5" component="h1" textAlign="center">Connexion</Typography>
        <TextField label="Identifiant" value={identifiant} onChange={(e) => setIdentifiant(e.target.value)} autoFocus autoComplete="username" />
        <TextField label="Mot de passe" type="password" value={motDePasse} onChange={(e) => setMotDePasse(e.target.value)} autoComplete="current-password" />
        {erreur && <Alert severity="error">{erreur}</Alert>}
        <Button type="submit" variant="contained" disabled={envoi}>Se connecter</Button>
        <Link component={RouterLink} to="/mot-de-passe-oublie" textAlign="center" fontSize={13}>Mot de passe oublié ?</Link>
      </Stack>
    </form>
  );
}
