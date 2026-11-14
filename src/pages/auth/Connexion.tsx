import BoutonAction from "../../components/BoutonAction";
import ChampTexte from "../../components/ChampTexte";
import LoginOutlined from "@mui/icons-material/LoginOutlined";
import LockOutlined from "@mui/icons-material/LockOutlined";
import PersonOutline from "@mui/icons-material/PersonOutline";
import { Alert, InputAdornment, Link, Stack, Typography } from "@mui/material";
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
      <Stack spacing={2.25}>
        <BoxIntro />
        <ChampTexte label="Identifiant" value={identifiant} onChange={(e) => setIdentifiant(e.target.value)} autoFocus autoComplete="username" fullWidth
          InputProps={{ startAdornment: <InputAdornment position="start"><PersonOutline fontSize="small" color="action" /></InputAdornment> }} />
        <ChampTexte label="Mot de passe" type="password" value={motDePasse} onChange={(e) => setMotDePasse(e.target.value)} autoComplete="current-password" fullWidth
          InputProps={{ startAdornment: <InputAdornment position="start"><LockOutlined fontSize="small" color="action" /></InputAdornment> }} />
        {erreur && <Alert severity="error">{erreur}</Alert>}
        <BoutonAction type="submit" variant="contained" size="large" fullWidth startIcon={<LoginOutlined />} disabled={envoi}
          sx={{
            mt: 0.5, py: 1.25, borderRadius: 2,
            background: "linear-gradient(90deg, #3182ce, #4299e0)",
            "&:hover": { background: "linear-gradient(90deg, #2b6cb0, #3182ce)" },
          }}>
          {envoi ? "Connexion en cours…" : "Se connecter"}
        </BoutonAction>
        <Link component={RouterLink} to="/mot-de-passe-oublie" textAlign="center" fontSize={13} fontWeight={600} underline="hover">
          Mot de passe oublié ?
        </Link>
      </Stack>
    </form>
  );
}

function BoxIntro() {
  return (
    <Stack spacing={0.75} alignItems="center" sx={{ mb: 0.75 }}>
      <Typography variant="h5" component="h1" textAlign="center" fontWeight={800}>Connectez-vous</Typography>
      <Typography variant="body2" color="text.secondary" textAlign="center">Accéder à votre espace.</Typography>
    </Stack>
  );
}
