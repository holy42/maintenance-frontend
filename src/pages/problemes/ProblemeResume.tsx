import AssignmentOutlined from "@mui/icons-material/AssignmentOutlined";
import TuneOutlined from "@mui/icons-material/TuneOutlined";
import { alpha, type Theme } from "@mui/material/styles";
import { Box, Button, Paper, Stack, TextField, Typography } from "@mui/material";
import type { ReactNode } from "react";
import FiabiliteBadge from "../../components/FiabiliteBadge";
import { useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { membresApplication } from "../../api/applications";
import { messageErreur } from "../../api/client";
import { changerStatutProbleme, modifierProbleme } from "../../api/problemes";
import ChampSelect from "../../components/ChampSelect";
import CodeBlock from "../../components/CodeBlock";
import SourceBadge from "../../components/SourceBadge";
import { useApplication } from "../../context/ApplicationContext";
import { useProbleme } from "../../context/ProblemeContext";
import { useNotifier } from "../../context/SnackbarContext";
import { useAsync } from "../../hooks/useAsync";
import { dateHeure } from "../../utils/format";
import { libelle, options } from "../../utils/libelles";
import { PERM } from "../../utils/permissions";
import { TRANSITIONS_MANUELLES } from "../../utils/transitions";

export default function ProblemeResume() {
  const { application, peut, archivee } = useApplication();
  const { probleme: p, recharger } = useProbleme();
  const notifier = useNotifier();
  const { data: membres } = useAsync(() => membresApplication(application.id), [application.id]);
  const [gravite, setGravite] = useState(p.gravite ?? "");
  const [priorite, setPriorite] = useState(p.priorite ?? "");
  const [responsable, setResponsable] = useState(p.responsable_id ? String(p.responsable_id) : "");
  const [echeance, setEcheance] = useState(p.echeance ?? "");
  const modifiable = peut(PERM.PROBLEME_MODIFIER) && !archivee;

  useEffect(() => { setGravite(p.gravite ?? ""); setPriorite(p.priorite ?? ""); setResponsable(p.responsable_id ? String(p.responsable_id) : ""); setEcheance(p.echeance ?? ""); }, [p]);

  const suivants = TRANSITIONS_MANUELLES[p.statut] ?? [];

  async function enregistrer() {
    try {
      await modifierProbleme(p.id, { gravite: gravite || undefined, priorite: priorite || undefined, responsable_id: responsable ? Number(responsable) : null, echeance: echeance || null });
      notifier("Problème modifié."); recharger();
    } catch (e) { notifier(messageErreur(e), "error"); }
  }
  async function statut(nouveau: string) {
    try { await changerStatutProbleme(p.id, nouveau); notifier("Statut modifié."); recharger(); } catch (e) { notifier(messageErreur(e), "error"); }
  }

  const carte = { p: { xs: 1.75, sm: 2.5 }, borderRadius: 2.5, borderColor: "divider", boxShadow: (theme: Theme) => `0 4px 18px ${alpha(theme.palette.primary.dark, theme.palette.mode === "light" ? 0.045 : 0.12)}` };
  const titreSection = (icone: ReactNode, texte: string) => (
    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5, color: "primary.dark" }}>
      {icone}<Typography variant="subtitle1" fontWeight={700} color="text.primary">{texte}</Typography>
    </Stack>
  );
  return (
    <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "1.7fr 1fr" }, maxWidth: 1220, width: "100%", mx: "auto", alignItems: "start" }}>
      <Stack spacing={2}>
        <Paper sx={carte}>
          {titreSection(<AssignmentOutlined fontSize="small" />, "Description")}
          <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", lineHeight: 1.75 }}>{p.description ?? "—"}</Typography>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1.5, mt: 2 }}>
            {[["Comportement attendu", p.comportement_attendu], ["Comportement observé", p.comportement_observe]].map(([label, valeur]) => (
              <Box key={label} sx={{ p: 1.5, borderRadius: 2, bgcolor: "action.hover", borderLeft: 3, borderColor: "secondary.main" }}>
                <Typography variant="caption" color="text.secondary" fontWeight={700} display="block" sx={{ mb: 0.5 }}>{label}</Typography>
                <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{valeur || "—"}</Typography>
              </Box>
            ))}
          </Box>
        </Paper>
        {(p.fichier || p.extrait_code) && (
          <Paper sx={carte}>
            {titreSection(<TuneOutlined fontSize="small" />, "Localisation")}
            <Typography variant="body2" sx={{ fontFamily: "monospace", mb: 1.5, overflowWrap: "anywhere", color: "text.secondary" }}>{p.fichier}{p.ligne_debut ? ` · ligne ${p.ligne_debut}` : ""}{p.fonction ? ` · ${p.fonction}()` : ""}</Typography>
            {p.extrait_code && <CodeBlock code={p.extrait_code} premiereLigne={p.ligne_debut ?? 1} surlignees={p.ligne_debut ? [p.ligne_debut] : []} />}
          </Paper>
        )}
        {p.fiabilite_preuve && (
          <Paper sx={carte}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>Fiabilité de la preuve d'origine</Typography>
            <FiabiliteBadge fiabilite={p.fiabilite_preuve} titre="Probabilité d'anomalie réelle" />
          </Paper>
        )}
        <Paper sx={carte}>
          <Typography variant="subtitle1" fontWeight={600}>Origine</Typography>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
            <SourceBadge source={p.source} />
            {p.verification_id
              ? <Typography variant="body2">Résultat de la <RouterLink to={`/applications/${application.id}/verifications/${p.verification_id}`}>vérification n°{p.verification_id}</RouterLink></Typography>
              : <Typography variant="body2" color="text.secondary">Saisi manuellement, sans résultat d'analyse d'origine.</Typography>}
          </Stack>
        </Paper>
      </Stack>

      <Paper sx={{ ...carte, position: { md: "sticky" }, top: { md: 84 } }}>
        {titreSection(<TuneOutlined fontSize="small" />, "Propriétés")}
        <Stack spacing={2}>
          <Typography variant="caption" color="text.secondary" sx={{ p: 1, borderRadius: 1.5, bgcolor: "action.hover" }}>{p.code} · créé le {dateHeure(p.cree_le)} (non modifiables)</Typography>
          <ChampSelect label="Statut" valeur={p.statut} onChange={statut} disabled={!modifiable || suivants.length === 0}
            options={[p.statut, ...suivants].map((s) => ({ valeur: s, libelle: libelle("statutProbleme", s) }))} />
          <Typography variant="caption" color="text.secondary" sx={{ mt: "-8px !important" }}>
            Seules les transitions autorisées sont proposées ; « à tester », « testé » et « rouvert » passent par la demande de test et le retour du testeur.
          </Typography>
          <ChampSelect label="Gravité" valeur={gravite} onChange={setGravite} vide="—" options={options("gravite")} disabled={!modifiable} />
          <ChampSelect label="Priorité" valeur={priorite} onChange={setPriorite} vide="—" options={options("priorite")} disabled={!modifiable} />
          <ChampSelect label="Responsable" valeur={responsable} onChange={setResponsable} vide="Aucun" disabled={!modifiable}
            options={(membres ?? []).map((m) => ({ valeur: String(m.utilisateur_id), libelle: m.identifiant }))} />
          <TextField size="small" type="date" label="Échéance" InputLabelProps={{ shrink: true }} value={echeance} onChange={(e) => setEcheance(e.target.value)} disabled={!modifiable} />
          <Button variant="contained" onClick={enregistrer} disabled={!modifiable}>Enregistrer</Button>
        </Stack>
      </Paper>
    </Box>
  );
}
