import AutoAwesomeOutlined from "@mui/icons-material/AutoAwesomeOutlined";
import { Alert, Box, Button, Checkbox, Chip, FormControlLabel, Paper, Stack, TextField, Typography } from "@mui/material";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { creerCritere, structurerCritere, validerCritere } from "../../api/criteres";
import { messageErreur } from "../../api/client";
import type { Categorie, PropositionCritere } from "../../api/types";
import ChampSelect from "../../components/ChampSelect";
import PageHeader from "../../components/PageHeader";
import { useApplication } from "../../context/ApplicationContext";
import { useNotifier } from "../../context/SnackbarContext";
import { options } from "../../utils/libelles";

/** Langage naturel -> proposition de l'IA (non validée) -> relecture et validation humaines. */
export default function CritereNouveau() {
  const { application } = useApplication();
  const navigate = useNavigate();
  const notifier = useNotifier();
  const [texte, setTexte] = useState("");
  const [proposition, setProposition] = useState<PropositionCritere | null>(null);
  const [attente, setAttente] = useState(false);
  const [activer, setActiver] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);

  async function structurer() {
    if (texte.trim().length < 5) { setErreur("Décrivez votre critère en quelques mots."); return; }
    setErreur(null); setAttente(true);
    try { setProposition(await structurerCritere(application.id, texte.trim())); }
    catch (e) { setErreur(messageErreur(e)); }
    finally { setAttente(false); }
  }

  function maj<K extends keyof PropositionCritere>(cle: K, valeur: PropositionCritere[K]) {
    if (proposition) setProposition({ ...proposition, [cle]: valeur });
  }

  async function enregistrer(valider: boolean) {
    if (!proposition) return;
    if (!proposition.nom.trim()) { setErreur("Le critère doit avoir un nom."); return; }
    try {
      const c = await creerCritere(application.id, {
        nom: proposition.nom.trim(), description: texte.trim(), categorie: proposition.categorie, automatisabilite: proposition.automatisabilite,
        mode_verification: proposition.mode_verification, formulation_structuree: { ...proposition.formulation },
      });
      if (valider) await validerCritere(c.id, activer);
      notifier(valider ? "Critère validé." : "Brouillon enregistré.");
      navigate(`/applications/${application.id}/criteres`);
    } catch (e) { setErreur(messageErreur(e)); }
  }

  return (
    <>
      <PageHeader titre="Nouveau critère" fil={[{ libelle: "Critères", to: `/applications/${application.id}/criteres` }, { libelle: "Nouveau critère" }]} />
      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "1fr 1.3fr" } }}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>1. Votre critère, en langage naturel</Typography>
          <TextField multiline minRows={5} fullWidth value={texte} onChange={(e) => setTexte(e.target.value)}
            placeholder="Ex. Un utilisateur ne doit pas pouvoir consulter les messages d'un autre utilisateur sans autorisation." />
          <Button sx={{ mt: 1 }} fullWidth variant="outlined" startIcon={<AutoAwesomeOutlined />} onClick={structurer} disabled={attente}>
            {attente ? "L'IA structure votre critère…" : "Demander à l'IA de le structurer"}
          </Button>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
            L'IA reformule et classe votre critère. Elle ne le vérifie pas et ne l'active pas : c'est vous qui validez.
          </Typography>
        </Paper>

        <Paper sx={{ p: 2 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="subtitle1" fontWeight={600}>2. Proposition de l'IA</Typography>
            {proposition && <Chip size="small" color="warning" label="Non validée" />}
          </Stack>
          {!proposition && <Typography color="text.secondary" variant="body2" sx={{ mt: 1 }}>La proposition s'affichera ici. Tous les champs restent modifiables.</Typography>}
          {proposition && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField size="small" label="Nom" value={proposition.nom} onChange={(e) => maj("nom", e.target.value)} />
              <TextField size="small" label="Condition" multiline value={proposition.formulation.condition} onChange={(e) => maj("formulation", { ...proposition.formulation, condition: e.target.value })} />
              <TextField size="small" label="Résultat attendu" multiline value={proposition.formulation.attendu} onChange={(e) => maj("formulation", { ...proposition.formulation, attendu: e.target.value })} />
              <TextField size="small" label="Portée" value={proposition.formulation.portee ?? ""} onChange={(e) => maj("formulation", { ...proposition.formulation, portee: e.target.value })} />
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                <ChampSelect label="Catégorie" valeur={proposition.categorie} onChange={(v) => maj("categorie", v as Categorie)} options={options("categorie")} />
                <ChampSelect label="Vérifiabilité" valeur={proposition.automatisabilite} onChange={(v) => maj("automatisabilite", v as PropositionCritere["automatisabilite"])}
                  options={options("automatisabilite").filter((o) => o.valeur !== "a_determiner")} />
                <ChampSelect label="Mode" valeur={proposition.mode_verification ?? ""} onChange={(v) => maj("mode_verification", v || null)} vide="À déterminer" options={options("modeVerification")} />
              </Stack>
              {proposition.incertitudes.length > 0 && (
                <Alert severity="info">
                  <strong>Points que l'IA signale comme incertains :</strong>
                  {proposition.incertitudes.map((i) => <div key={i}>• {i}</div>)}
                </Alert>
              )}
              <FormControlLabel label="Activer le critère après validation" control={<Checkbox checked={activer} onChange={(e) => setActiver(e.target.checked)} />} />
              <Stack direction="row" spacing={1}>
                <Button variant="outlined" onClick={() => enregistrer(false)}>Enregistrer en brouillon</Button>
                <Button variant="contained" onClick={() => enregistrer(true)}>Valider le critère</Button>
              </Stack>
            </Stack>
          )}
          {erreur && <Alert severity="error" sx={{ mt: 2 }}>{erreur}</Alert>}
        </Paper>
      </Box>
    </>
  );
}
