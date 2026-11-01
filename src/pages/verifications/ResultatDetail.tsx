import { Alert, Box, Button, Chip, Paper, Stack, TextField, Typography } from "@mui/material";
import { useState } from "react";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";
import { listCriteres } from "../../api/criteres";
import { messageErreur } from "../../api/client";
import { confirmerResultat, ecarterResultat, getResultat, resultatsVerification } from "../../api/verifications";
import CodeBlock from "../../components/CodeBlock";
import Etat from "../../components/Etat";
import FiabiliteBadge from "../../components/FiabiliteBadge";
import PageHeader from "../../components/PageHeader";
import SourceBadge from "../../components/SourceBadge";
import StatutChip from "../../components/StatutChip";
import { useApplication } from "../../context/ApplicationContext";
import { useNotifier } from "../../context/SnackbarContext";
import { useAsync } from "../../hooks/useAsync";
import { libelle } from "../../utils/libelles";
import { PERM } from "../../utils/permissions";

/** Page de détail d'un résultat : décision HUMAINE (confirmer = créer un problème, ou écarter). Un résultat à la fois. */
export default function ResultatDetail() {
  const { application, peut, archivee } = useApplication();
  const { verificationId, resultatId } = useParams();
  const vid = Number(verificationId);
  const rid = Number(resultatId);
  const navigate = useNavigate();
  const notifier = useNotifier();
  const { data: r, loading, error, reload } = useAsync(() => getResultat(rid), [rid]);
  const { data: tous } = useAsync(() => resultatsVerification(vid), [vid]);
  const { data: criteres } = useAsync(() => listCriteres(application.id), [application.id]);
  const [motif, setMotif] = useState("");
  const base = `/applications/${application.id}/verifications/${vid}`;
  const index = (tous ?? []).findIndex((x) => x.id === rid);
  const precedent = index > 0 ? tous?.[index - 1] : undefined;
  const suivant = tous && index >= 0 ? tous[index + 1] : undefined;
  const peutDecider = peut(PERM.PROBLEME_MODIFIER) && !archivee && r?.statut_validation === "non_valide";

  async function confirmer() {
    try { const p = await confirmerResultat(rid, { motif: motif || undefined }); notifier(`Problème ${p.code} créé.`); navigate(`/applications/${application.id}/problemes/${p.id}`); }
    catch (e) { notifier(messageErreur(e), "error"); }
  }
  async function ecarter() {
    try { await ecarterResultat(rid, { motif: motif || undefined }); notifier("Résultat écarté."); reload(); } catch (e) { notifier(messageErreur(e), "error"); }
  }

  return (
    <Etat loading={loading} error={error}>
      {r && (
        <>
          <PageHeader titre={r.message}
            fil={[{ libelle: "Vérifications", to: `/applications/${application.id}/verifications` }, { libelle: `n°${vid}`, to: base }, { libelle: "Résultat" }]}
            actions={<>
              <Button disabled={!precedent} component={RouterLink} to={`${base}/resultats/${precedent?.id ?? rid}`}>Précédent</Button>
              <Button disabled={!suivant} component={RouterLink} to={`${base}/resultats/${suivant?.id ?? rid}`}>Suivant</Button>
            </>}
            sousTitre={<Stack direction="row" spacing={1} sx={{ mt: 0.5 }} flexWrap="wrap" useFlexGap>
              <StatutChip groupe="gravite" valeur={r.gravite} /><Chip size="small" variant="outlined" label={libelle("categorie", r.categorie)} />
              <SourceBadge source={r.source} /><StatutChip groupe="validation" valeur={r.statut_validation} />
            </Stack>} />
          {r.source === "ia" && <Alert severity="warning" sx={{ mb: 2 }}>Hypothèse de l'IA, non vérifiée : elle n'a de valeur qu'après examen par une personne.</Alert>}
          <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "1.5fr 1fr" } }}>
            <Stack spacing={2}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle1" fontWeight={600}>Localisation</Typography>
                <Typography variant="body2" sx={{ fontFamily: "monospace" }}>{r.fichier ?? "—"}{r.ligne_debut ? ` · ligne ${r.ligne_debut}` : ""}{r.fonction ? ` · ${r.fonction}()` : ""}</Typography>
              </Paper>
              {r.extrait_code && (
                <Paper sx={{ p: 2 }}>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>Extrait de code</Typography>
                  <CodeBlock code={r.extrait_code} premiereLigne={r.ligne_debut ?? 1} surlignees={r.ligne_debut ? [r.ligne_debut] : []} />
                  <Typography variant="caption" color="text.secondary">Affiché en lecture seule.</Typography>
                </Paper>
              )}
            </Stack>
            <Stack spacing={2}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle1" fontWeight={600}>Critère déclencheur</Typography>
                <Typography variant="body2">{(criteres ?? []).find((c) => c.id === r.critere_id)?.nom ?? "—"}</Typography>
              </Paper>
              {r.fiabilite && (
                <Paper sx={{ p: 2 }}>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>Fiabilité de la preuve</Typography>
                  <FiabiliteBadge fiabilite={r.fiabilite} titre="Probabilité d'anomalie réelle" />
                </Paper>
              )}
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle1" fontWeight={600}>Éléments de preuve</Typography>
                <Typography variant="body2" color="text.secondary">{r.elements_preuve ?? "Aucun."}</Typography>
              </Paper>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>Votre décision</Typography>
                {r.statut_validation !== "non_valide" ? (
                  <Typography variant="body2" color="text.secondary">Décision déjà prise{r.motif_decision ? ` : ${r.motif_decision}` : "."}</Typography>
                ) : (
                  <Stack spacing={1}>
                    <TextField size="small" multiline minRows={2} label="Motif (facultatif)" value={motif} onChange={(e) => setMotif(e.target.value)} disabled={!peutDecider} />
                    <Button variant="contained" onClick={confirmer} disabled={!peutDecider}>Confirmer et créer le problème</Button>
                    <Button variant="outlined" onClick={ecarter} disabled={!peutDecider}>Écarter comme faux positif</Button>
                  </Stack>
                )}
              </Paper>
            </Stack>
          </Box>
        </>
      )}
    </Etat>
  );
}
