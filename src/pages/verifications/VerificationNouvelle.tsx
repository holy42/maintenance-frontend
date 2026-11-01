import PlayArrowOutlined from "@mui/icons-material/PlayArrowOutlined";
import { Alert, Box, Button, Checkbox, FormControlLabel, Paper, Radio, RadioGroup, Stack, TextField, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getDepot } from "../../api/applications";
import { listCriteres } from "../../api/criteres";
import { messageErreur } from "../../api/client";
import { lancerVerification } from "../../api/verifications";
import Etat from "../../components/Etat";
import PageHeader from "../../components/PageHeader";
import StatutChip from "../../components/StatutChip";
import { useApplication } from "../../context/ApplicationContext";
import { useAsync } from "../../hooks/useAsync";
import { liste } from "../../utils/format";
import { libelle } from "../../utils/libelles";

/** Lancement à la demande. Version analysée = dernier commit de la branche choisie (pas de comparaison entre versions). */
export default function VerificationNouvelle() {
  const { application, archivee } = useApplication();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { data: criteres, loading, error } = useAsync(() => listCriteres(application.id), [application.id]);
  const { data: depot } = useAsync(() => getDepot(application.id), [application.id]);
  const [branche, setBranche] = useState(params.get("branche") ?? "");
  const [perimetre, setPerimetre] = useState<"defaut" | "dossiers">("defaut");
  const [dossiers, setDossiers] = useState("app, public/js");
  const [exclusions, setExclusions] = useState("vendor, node_modules, writable");
  const [choisis, setChoisis] = useState<Set<number>>(new Set());
  const [avecIA, setAvecIA] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);

  useEffect(() => { if (!branche && depot) setBranche(depot.branche_defaut); }, [depot, branche]);
  const actifs = (criteres ?? []).filter((c) => c.statut === "actif");
  useEffect(() => { if (criteres) setChoisis(new Set(criteres.filter((c) => c.statut === "actif").map((c) => c.id))); }, [criteres]);

  const selection = actifs.filter((c) => choisis.has(c.id));
  const auto = selection.filter((c) => c.mode_verification === "regle_statique" || c.mode_verification === "test_auto").length;

  async function lancer() {
    if (!branche.trim()) { setErreur("Choisissez une branche."); return; }
    if (selection.length === 0) { setErreur("Sélectionnez au moins un critère actif."); return; }
    setEnvoi(true); setErreur(null);
    try {
      const v = await lancerVerification(application.id, {
        branche: branche.trim(), dossiers: perimetre === "dossiers" ? liste(dossiers) : [], exclusions: liste(exclusions),
        critere_ids: selection.map((c) => c.id), avec_interpretation_ia: avecIA,
      });
      navigate(`/applications/${application.id}/verifications/${v.id}`);
    } catch (e) { setErreur(messageErreur(e)); setEnvoi(false); }
  }

  const bascule = (id: number, coche: boolean) => { const s = new Set(choisis); if (coche) s.add(id); else s.delete(id); setChoisis(s); };

  return (
    <>
      <PageHeader titre="Nouvelle vérification" fil={[{ libelle: "Vérifications", to: `/applications/${application.id}/verifications` }, { libelle: "Nouvelle vérification" }]} />
      {archivee && <Alert severity="warning" sx={{ mb: 2 }}>Application archivée : impossible de lancer une vérification.</Alert>}
      <Etat loading={loading} error={error}>
        <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "1.6fr 1fr" } }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>Code à analyser</Typography>
            <Stack spacing={2}>
              <TextField size="small" label="Branche" value={branche} onChange={(e) => setBranche(e.target.value)}
                helperText="develop par défaut ; pour un problème rouvert, la branche porte le code du problème (ex. PB-1029)." />
              <RadioGroup value={perimetre} onChange={(e) => setPerimetre(e.target.value as "defaut" | "dossiers")}>
                <FormControlLabel value="defaut" control={<Radio />} label="Toute l'application (hors exclusions)" />
                <FormControlLabel value="dossiers" control={<Radio />} label="Choisir des dossiers" />
              </RadioGroup>
              {perimetre === "dossiers" && <TextField size="small" label="Dossiers (séparés par des virgules)" value={dossiers} onChange={(e) => setDossiers(e.target.value)} />}
              <TextField size="small" label="Dossiers exclus" value={exclusions} onChange={(e) => setExclusions(e.target.value)} />
            </Stack>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mt: 3 }} gutterBottom>Critères à appliquer</Typography>
            {actifs.length === 0 && <Alert severity="info">Aucun critère actif. Activez des critères dans la rubrique « Critères ».</Alert>}
            <Stack>
              {actifs.map((c) => (
                <FormControlLabel key={c.id} control={<Checkbox checked={choisis.has(c.id)} onChange={(e) => bascule(c.id, e.target.checked)} />}
                  label={<Stack direction="row" spacing={1} alignItems="center"><span>{c.nom}</span><StatutChip groupe="automatisabilite" valeur={c.automatisabilite} /></Stack>} />
              ))}
            </Stack>
          </Paper>
          <Stack spacing={2}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>Résumé avant lancement</Typography>
              <Typography variant="body2">Branche : {branche || "—"}</Typography>
              <Typography variant="body2">Critères sélectionnés : {selection.length}</Typography>
              <Typography variant="body2">Exécutés automatiquement : {auto}</Typography>
              <Typography variant="body2">À vérifier à la main : {selection.length - auto}</Typography>
              <FormControlLabel sx={{ mt: 1 }} label="Faire interpréter les résultats par l'IA" control={<Checkbox checked={avecIA} onChange={(e) => setAvecIA(e.target.checked)} />} />
              {erreur && <Alert severity="error" sx={{ my: 1 }}>{erreur}</Alert>}
              <Button fullWidth variant="contained" startIcon={<PlayArrowOutlined />} onClick={lancer} disabled={envoi || archivee}>Lancer la vérification</Button>
            </Paper>
            <Paper sx={{ p: 2, bgcolor: "action.hover" }}>
              <Typography variant="caption" color="text.secondary" display="block">
                Les critères à validation humaine ne sont pas exécutés automatiquement : ils sont proposés à la fin comme points à vérifier à la main ({libelle("automatisabilite", "humaine")}).
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                Seuls les extraits de code utiles à l'interprétation sont envoyés à l'IA, sans mots de passe ni clés.
              </Typography>
            </Paper>
          </Stack>
        </Box>
      </Etat>
    </>
  );
}
