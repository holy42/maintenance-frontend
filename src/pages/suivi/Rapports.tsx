import { Alert, Box, Button, LinearProgress, Paper, Stack, Tab, Table, TableBody, TableCell, TableHead, TableRow, Tabs, Typography } from "@mui/material";
import { useState } from "react";
import { messageErreur } from "../../api/client";
import { enregistrerRapport, rapportIaTests, rapportProblemesTaches } from "../../api/suivi";
import Etat from "../../components/Etat";
import FiltreSelect from "../../components/FiltreSelect";
import PageHeader from "../../components/PageHeader";
import { useApplicationOptionnelle } from "../../context/ApplicationContext";
import { useApplications } from "../../context/ApplicationsContext";
import { useNotifier } from "../../context/SnackbarContext";
import { useAsync } from "../../hooks/useAsync";
import { dureeEnJours } from "../../utils/format";
import { libelle } from "../../utils/libelles";

function Indicateur({ titre, valeur, detail }: { titre: string; valeur: string | number; detail?: string }) {
  return <Paper sx={{ p: 1.5 }}><Typography variant="caption" color="text.secondary">{titre}</Typography><Typography variant="h5" component="p">{valeur}</Typography>{detail && <Typography variant="caption" color="text.secondary">{detail}</Typography>}</Paper>;
}

function Barres({ titre, lignes }: { titre: string; lignes: { libelle: string; nb: number }[] }) {
  const max = Math.max(1, ...lignes.map((l) => l.nb));
  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="subtitle1" fontWeight={600} gutterBottom>{titre}</Typography>
      {lignes.length === 0 && <Typography variant="body2" color="text.secondary">Aucune donnée.</Typography>}
      <Stack spacing={1}>
        {lignes.map((l) => (
          <Box key={l.libelle} sx={{ display: "grid", gridTemplateColumns: "150px 1fr 32px", alignItems: "center", gap: 1 }}>
            <Typography variant="body2" noWrap>{l.libelle}</Typography>
            <LinearProgress variant="determinate" value={(l.nb / max) * 100} />
            <Typography variant="body2" align="right">{l.nb}</Typography>
          </Box>
        ))}
      </Stack>
    </Paper>
  );
}

/** Rapports (globaux ou par application). Limite assumée : les indicateurs IA et tests sont cumulés sur toute la durée. */
export default function Rapports() {
  const ctx = useApplicationOptionnelle();
  const { trouver } = useApplications();
  const notifier = useNotifier();
  const [onglet, setOnglet] = useState<"pt" | "ia">("pt");
  const [jours, setJours] = useState("30");
  const appId = ctx?.application.id;
  const pt = useAsync(() => (onglet === "pt" ? rapportProblemesTaches({ application_id: appId, jours: Number(jours) }) : Promise.resolve(null)), [onglet, appId, jours]);
  const ia = useAsync(() => (onglet === "ia" ? rapportIaTests({ application_id: appId }) : Promise.resolve(null)), [onglet, appId]);
  const nomApp = (id: number) => trouver(id)?.nom ?? `#${id}`;

  async function enregistrer() {
    try { await enregistrerRapport({ type: onglet === "pt" ? "problemes_taches" : "ia_tests", application_id: appId, jours: Number(jours) }); notifier("Rapport enregistré."); }
    catch (e) { notifier(messageErreur(e), "error"); }
  }
  function exporter() {
    const contenu = JSON.stringify(onglet === "pt" ? pt.data : ia.data, null, 2);
    const lien = document.createElement("a");
    lien.href = URL.createObjectURL(new Blob([contenu], { type: "application/json" }));
    lien.download = `rapport-${onglet === "pt" ? "problemes-taches" : "ia-tests"}.json`;
    lien.click();
    URL.revokeObjectURL(lien.href);
  }

  const d = pt.data;
  const r = ia.data;
  const valides = (r?.validation_tests ?? []).reduce((a, x) => a + x.nb_valides, 0);
  const refus = (r?.validation_tests ?? []).reduce((a, x) => a + x.nb_non_valides, 0);
  const rouverts = (r?.problemes_rouverts ?? []).reduce((a, x) => a + x.nb_reouvertures, 0);

  return (
    <>
      <PageHeader titre="Rapports" actions={<><Button variant="outlined" onClick={exporter}>Exporter</Button><Button variant="contained" onClick={enregistrer}>Enregistrer le rapport</Button></>} />
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }} flexWrap="wrap" useFlexGap>
        <Tabs value={onglet} onChange={(_, v: "pt" | "ia") => setOnglet(v)}><Tab value="pt" label="Problèmes et tâches" /><Tab value="ia" label="IA et tests" /></Tabs>
        {onglet === "pt" && <FiltreSelect label="Période" valeur={jours} onChange={(v) => setJours(v || "30")} options={[{ valeur: "7", libelle: "7 jours" }, { valeur: "30", libelle: "30 jours" }, { valeur: "90", libelle: "90 jours" }, { valeur: "365", libelle: "1 an" }]} largeur={150} />}
      </Stack>

      {onglet === "pt" && (
        <Etat loading={pt.loading} error={pt.error}>
          {d && (
            <Stack spacing={2}>
              <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" } }}>
                <Indicateur titre="Problèmes créés" valeur={d.problemes_crees} detail={`sur ${d.periode_jours} jours`} />
                <Indicateur titre="Problèmes terminés" valeur={d.problemes_termines} />
                <Indicateur titre="Résolution moyenne" valeur={dureeEnJours(d.temps_moyen_resolution.length ? d.temps_moyen_resolution[0].duree_moyenne : null)} detail="par gravité ci-dessous" />
                <Indicateur titre="Tâches en retard" valeur={d.taches.reduce((a, x) => a + x.nb_en_retard, 0)} />
              </Box>
              <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" } }}>
                <Barres titre="Problèmes par gravité" lignes={d.par_gravite.map((x) => ({ libelle: libelle("gravite", x.gravite), nb: x.nb }))} />
                <Barres titre="Problèmes par catégorie" lignes={d.par_categorie.map((x) => ({ libelle: libelle("categorie", x.categorie), nb: x.nb }))} />
                <Barres titre="Évolution des problèmes créés (par mois)" lignes={d.evolution.map((x) => ({ libelle: new Date(x.mois).toLocaleDateString("fr-FR", { month: "short", year: "numeric" }), nb: x.nb }))} />
                <Barres titre="Tâches par statut" lignes={d.taches.map((x) => ({ libelle: libelle("statutTache", x.statut), nb: x.nb }))} />
                {!ctx && <Barres titre="Problèmes par application" lignes={d.par_application.map((x) => ({ libelle: nomApp(x.application_id), nb: x.nb }))} />}
              </Box>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>Temps moyen de résolution</Typography>
                <Table size="small"><TableHead><TableRow><TableCell>Gravité</TableCell><TableCell>Résolus</TableCell><TableCell>Durée moyenne</TableCell></TableRow></TableHead>
                  <TableBody>{d.temps_moyen_resolution.map((x) => <TableRow key={x.gravite ?? "-"}><TableCell>{libelle("gravite", x.gravite)}</TableCell><TableCell>{x.nb_resolus}</TableCell><TableCell>{dureeEnJours(x.duree_moyenne)}</TableCell></TableRow>)}</TableBody></Table>
                <Typography variant="caption" color="text.secondary">Calculé sur les problèmes passés à « terminé », jusqu'à leur dernière clôture.</Typography>
              </Paper>
            </Stack>
          )}
        </Etat>
      )}

      {onglet === "ia" && (
        <Etat loading={ia.loading} error={ia.error}>
          {r && (
            <Stack spacing={2}>
              <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" } }}>
                <Indicateur titre="Taux de validation des tests" valeur={valides + refus > 0 ? `${Math.round((100 * valides) / (valides + refus))} %` : "—"} detail={`${valides} sur ${valides + refus} jugés`} />
                <Indicateur titre="Problèmes rouverts" valeur={rouverts} />
                <Indicateur titre="Solutions IA évaluées" valeur={r.utilite_solutions_ia.reduce((a, x) => a + x.nb, 0)} />
                <Indicateur titre="Décisions de correction" valeur={r.decisions_correction.reduce((a, x) => a + x.nb, 0)} />
              </Box>
              <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" } }}>
                <Barres titre="Décisions de correction" lignes={r.decisions_correction.map((x) => ({ libelle: libelle("typeDecision", x.type_decision), nb: x.nb }))} />
                <Barres titre="Utilité perçue des solutions de l'IA" lignes={r.utilite_solutions_ia.map((x) => ({ libelle: libelle("utilite", x.utilite_percue), nb: x.nb }))} />
              </Box>
              <Paper sx={{ p: 2, overflowX: "auto" }}>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>Résultat du test selon le type de décision</Typography>
                <Table size="small"><TableHead><TableRow>{!ctx && <TableCell>Application</TableCell>}<TableCell>Décision</TableCell><TableCell>Validés</TableCell><TableCell>Non validés</TableCell><TableCell>En attente</TableCell></TableRow></TableHead>
                  <TableBody>{r.validation_par_decision.map((x, i) => <TableRow key={i}>{!ctx && <TableCell>{nomApp(x.application_id)}</TableCell>}<TableCell>{libelle("typeDecision", x.type_decision)}</TableCell><TableCell>{x.nb_valides}</TableCell><TableCell>{x.nb_non_valides}</TableCell><TableCell>{x.nb_en_attente}</TableCell></TableRow>)}</TableBody></Table>
              </Paper>
              <Paper sx={{ p: 2, overflowX: "auto" }}>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>Faux positifs (décisions humaines, sans vérité de référence)</Typography>
                <Table size="small"><TableHead><TableRow>{!ctx && <TableCell>Application</TableCell>}<TableCell>Catégorie</TableCell><TableCell>Problèmes</TableCell><TableCell>Faux positifs</TableCell><TableCell>Taux</TableCell></TableRow></TableHead>
                  <TableBody>{r.faux_positifs.map((x, i) => <TableRow key={i}>{!ctx && <TableCell>{nomApp(x.application_id)}</TableCell>}<TableCell>{libelle("categorie", x.categorie)}</TableCell><TableCell>{x.nb_total}</TableCell><TableCell>{x.nb_faux_positifs}</TableCell><TableCell>{x.taux_pct} %</TableCell></TableRow>)}</TableBody></Table>
              </Paper>
              <Alert severity="info"><strong>Comment lire ces indicateurs :</strong> {r.avertissement}</Alert>
            </Stack>
          )}
        </Etat>
      )}
    </>
  );
}
