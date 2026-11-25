import { Alert, Box, Button, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";
import { useCallback, useState } from "react";
import { Link as RouterLink, useParams } from "react-router-dom";
import { listCriteres } from "../../api/criteres";
import { criteresManuels, getVerification, resultatsVerification } from "../../api/verifications";
import Etat from "../../components/Etat";
import FiltreSelect from "../../components/FiltreSelect";
import PageHeader from "../../components/PageHeader";
import { FiabiliteChip } from "../../components/FiabiliteBadge";
import SourceBadge from "../../components/SourceBadge";
import StatutChip from "../../components/StatutChip";
import { useApplication } from "../../context/ApplicationContext";
import { useAsync } from "../../hooks/useAsync";
import { usePolling } from "../../hooks/usePolling";
import { dateHeure } from "../../utils/format";
import { options } from "../../utils/libelles";

function Compteur({ titre, valeur }: { titre: string; valeur: number }) {
  return <Paper sx={{ p: 1.5 }}><Typography variant="caption" color="text.secondary">{titre}</Typography><Typography variant="h5" component="p">{valeur}</Typography></Paper>;
}

/** Résultats d'une vérification : on distingue outil, hypothèse de l'IA et décision humaine. */
export default function VerificationResultats() {
  const { application } = useApplication();
  const id = Number(useParams().verificationId);
  const [categorie, setCategorie] = useState("");
  const [source, setSource] = useState("");
  const [validation, setValidation] = useState("");
  const [critere, setCritere] = useState("");
  const { data: v, loading, error, reload } = useAsync(() => getVerification(id), [id]);
  const enCours = v?.statut === "en_attente" || v?.statut === "en_cours";
  usePolling(useCallback(reload, [reload]), Boolean(enCours));
  const { data: tous } = useAsync(() => resultatsVerification(id), [id, v?.statut]);
  const { data: resultats } = useAsync(() => resultatsVerification(id, { categorie: categorie || undefined, source: source || undefined, statut_validation: validation || undefined }), [id, categorie, source, validation, v?.statut]);
  const { data: criteres } = useAsync(() => listCriteres(application.id), [application.id]);
  const { data: manuels } = useAsync(() => criteresManuels(id), [id]);

  const nomCritere = new Map((criteres ?? []).map((c) => [c.id, c.nom]));
  const optionsCriteres = [...new Set((tous ?? []).map((r) => r.critere_id).filter((x): x is number => x != null))]
    .map((cid) => ({ valeur: String(cid), libelle: nomCritere.get(cid) ?? `Critère ${cid}` }));
  const affiches = (resultats ?? []).filter((r) => !critere || String(r.critere_id) === critere);   // le filtre « Critère » se fait ici, sans changer l'API

  const nb = (f: (r: NonNullable<typeof tous>[number]) => boolean) => (tous ?? []).filter(f).length;
  const base = `/applications/${application.id}/verifications/${id}`;

  return (
    <Etat loading={loading && !v} error={error}>
      {v && (
        <>
          <PageHeader titre={`Vérification n°${v.id}`} fil={[{ libelle: "Vérifications", to: `/applications/${application.id}/verifications` }, { libelle: `n°${v.id}` }]}
            sousTitre={`Branche ${v.branche} · version ${v.commit_analyse?.slice(0, 8) ?? "—"} · ${dateHeure(v.debut_le)}`}
            actions={<StatutChip groupe="statutVerification" valeur={v.statut} taille="medium" />} />
          {enCours && <Alert severity="info" sx={{ mb: 2 }}>Analyse en cours… cette page se met à jour toute seule.</Alert>}
          {v.statut === "echouee" && <Alert severity="error" sx={{ mb: 2 }}>Vérification échouée : {v.motif_echec ?? "cause inconnue"}.</Alert>}

          <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", md: "repeat(4, minmax(0, 1fr))" }, mb: 2 }}>
            <Compteur titre="Résultats d'outils" valeur={nb((r) => r.source === "outil")} />
            <Compteur titre="Hypothèses de l'IA" valeur={nb((r) => r.source === "ia")} />
            <Compteur titre="Confirmés" valeur={nb((r) => r.statut_validation === "confirme")} />
            <Compteur titre="Écartés" valeur={nb((r) => r.statut_validation === "ecarte")} />
          </Box>

          <Stack direction="row" spacing={1} sx={{ mb: 1 }} flexWrap="wrap" useFlexGap>
            <FiltreSelect label="Catégorie" valeur={categorie} onChange={setCategorie} options={options("categorie")} />
            <FiltreSelect label="Critère" valeur={critere} onChange={setCritere} options={optionsCriteres} largeur={260} />
            <FiltreSelect label="Source" valeur={source} onChange={setSource} options={[{ valeur: "outil", libelle: "Outil" }, { valeur: "ia", libelle: "IA" }, { valeur: "humain", libelle: "Humain" }]} />
            <FiltreSelect label="Statut" valeur={validation} onChange={setValidation} options={options("validation")} />
          </Stack>  
          <Paper sx={{ overflowX: "auto" }}>
            <Table size="small">
              <TableHead><TableRow><TableCell>Gravité</TableCell><TableCell>Critère</TableCell><TableCell>Source</TableCell><TableCell>Résultat</TableCell><TableCell>Fiabilité estimée</TableCell><TableCell>Statut</TableCell><TableCell /></TableRow></TableHead>
              <TableBody>
                {affiches.length === 0 && <TableRow><TableCell colSpan={7}><Typography color="text.secondary">{enCours ? "En attente des résultats…" : "Aucun résultat."}</Typography></TableCell></TableRow>}
                {affiches.map((r) => (
                  <TableRow key={r.id} hover>
                    <TableCell><StatutChip groupe="gravite" valeur={r.gravite} /></TableCell>
                    <TableCell sx={{ maxWidth: 200 }}>{r.critere_id != null ? (nomCritere.get(r.critere_id) ?? `Critère ${r.critere_id}`) : "—"}</TableCell>
                    <TableCell><SourceBadge source={r.source} />{r.outil && <Typography variant="caption" display="block" color="text.secondary">{r.outil}</Typography>}</TableCell>
                    <TableCell>{r.message}<Typography variant="caption" display="block" color="text.secondary" sx={{ fontFamily: "monospace" }}>{r.fichier}{r.ligne_debut ? `:${r.ligne_debut}` : ""}</Typography></TableCell>
                    <TableCell><FiabiliteChip fiabilite={r.fiabilite} /></TableCell>
                    <TableCell><StatutChip groupe="validation" valeur={r.statut_validation} /></TableCell>
                    <TableCell align="right"><Button size="small" component={RouterLink} to={`${base}/resultats/${r.id}`}>Examiner</Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>

          {(manuels ?? []).length > 0 && (
            <Paper sx={{ p: 2, mt: 2 }}>
              <Typography variant="subtitle1" fontWeight={600}>À vérifier à la main (non exécutés automatiquement)</Typography>
              {(manuels ?? []).map((c) => <Typography key={c.id} variant="body2" sx={{ mt: 0.5 }}>• {c.nom}</Typography>)}
              <Typography variant="caption" color="text.secondary">Si vous constatez un écart, créez un problème manuellement depuis la rubrique « Problèmes ».</Typography>
            </Paper>
          )}
        </>
      )}
    </Etat>
  );
}
