import { Alert, Box, Button, Chip, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";
import { useState } from "react";
import { activerModeleFiabilite, apercuFiabilite, entrainerModeleFiabilite, listModelesFiabilite, telechargerJeuDonnees } from "../../api/fiabilite";
import { messageErreur } from "../../api/client";
import type { ApercuFiabilite, ModeleFiabiliteVersion, RapportMetriques } from "../../api/types";
import ChampSelect from "../../components/ChampSelect";
import Etat from "../../components/Etat";
import PageHeader from "../../components/PageHeader";
import { useNotifier } from "../../context/SnackbarContext";
import { useAsync } from "../../hooks/useAsync";
import { dateHeure } from "../../utils/format";

const ETAPES: { etape: 3 | 6; titre: string; question: string }[] = [
  { etape: 3, titre: "Étape 3 : preuves de l'analyse de code", question: "L'anomalie détectée est-elle réelle ? (vérité : décision humaine)" },
  { etape: 6, titre: "Étape 6 : solutions de Gemini", question: "La solution sera-t-elle validée au test ? (vérité : retour du testeur)" },
];
const ALGOS = [
  { valeur: "auto", libelle: "Automatique (le plus simple sauf amélioration nette)" },
  { valeur: "logistique", libelle: "Régression logistique" },
  { valeur: "foret", libelle: "Forêt aléatoire" },
];
const ALGO_LIBELLE: Record<string, string> = {
  logistique: "Régression logistique", foret: "Forêt aléatoire", constant: "Référence : prédiction constante",
  confiance_declaree_par_gemini: "Référence : confiance déclarée par Gemini", sklearn_logistique: "scikit-learn : logistique", sklearn_foret: "scikit-learn : forêt",
};
const n3 = (v: number | null | undefined) => (v === null || v === undefined ? "—" : v.toFixed(3));

function Comparaison({ modeles, recommande }: { modeles: Record<string, RapportMetriques>; recommande?: string }) {
  return (
    <Table size="small">
      <TableHead><TableRow><TableCell>Modèle (validation croisée)</TableCell><TableCell align="right">AUC</TableCell><TableCell align="right">IC 95 % de l'AUC</TableCell><TableCell align="right">Brier</TableCell><TableCell align="right">Calibration (ECE)</TableCell></TableRow></TableHead>
      <TableBody>
        {Object.entries(modeles).map(([nom, m]) => (
          <TableRow key={nom} selected={nom === recommande}>
            <TableCell>{ALGO_LIBELLE[nom] ?? nom}{nom === recommande ? " (retenu)" : ""}</TableCell>
            <TableCell align="right">{n3(m.auc)}</TableCell>
            <TableCell align="right">{m.auc_ic95 ? `${n3(m.auc_ic95[0])} – ${n3(m.auc_ic95[1])}` : "—"}</TableCell>
            <TableCell align="right">{n3(m.brier)}</TableCell>
            <TableCell align="right">{n3(m.ece)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function Etape({ etape, titre, question, apercu, versions, recharger }: {
  etape: 3 | 6; titre: string; question: string; apercu?: ApercuFiabilite; versions: ModeleFiabiliteVersion[]; recharger: () => void;
}) {
  const notifier = useNotifier();
  const [algo, setAlgo] = useState<"auto" | "logistique" | "foret">("auto");
  const [attente, setAttente] = useState(false);
  const [detail, setDetail] = useState<number | null>(null);
  const suffisant = !!apercu && apercu.exemples_etiquetes >= apercu.minimum_requis
    && apercu.reels >= apercu.minimum_par_classe && apercu.faux >= apercu.minimum_par_classe;
  const vue = versions.find((v) => v.id === detail) ?? versions[0];
  const active = versions.find((v) => v.actif);

  async function entrainer() {
    setAttente(true);
    try { const v = await entrainerModeleFiabilite(etape, algo); notifier(`Version ${v.version} entraînée (inactive : à activer après lecture des métriques).`); setDetail(v.id); recharger(); }
    catch (e) { notifier(messageErreur(e), "error"); }
    finally { setAttente(false); }
  }
  async function activer(id: number) {
    try { await activerModeleFiabilite(id); notifier("Version activée."); recharger(); } catch (e) { notifier(messageErreur(e), "error"); }
  }

  return (
    <Paper sx={{ p: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" useFlexGap spacing={1}>
        <Box><Typography variant="subtitle1" fontWeight={600}>{titre}</Typography><Typography variant="body2" color="text.secondary">{question}</Typography></Box>
        <Chip size="small" color={active ? "success" : "default"} variant={active ? "filled" : "outlined"}
          label={active ? `Modèle actif : version ${active.version} (${ALGO_LIBELLE[active.algorithme] ?? active.algorithme})` : "Aucun modèle actif : estimation par règles (non apprise)"} />
      </Stack>

      <Typography variant="body2" sx={{ mt: 1.5 }}>
        Exemples étiquetés : <strong>{apercu?.exemples_etiquetes ?? 0}</strong> ({apercu?.reels ?? 0} vrais, {apercu?.faux ?? 0} faux).
        Minimum requis pour entraîner : {apercu?.minimum_requis ?? "—"} exemples, dont {apercu?.minimum_par_classe ?? "—"} de chaque classe.
      </Typography>
      {!suffisant && <Alert severity="info" sx={{ mt: 1 }}>Jeu de données insuffisant : l'entraînement serait refusé. Avec trop peu d'exemples, les métriques ne seraient pas fiables.</Alert>}

      <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mt: 1.5 }} alignItems={{ sm: "center" }}>
        <Box sx={{ minWidth: 320 }}><ChampSelect label="Algorithme" valeur={algo} onChange={(v) => setAlgo(v as typeof algo)} options={ALGOS.map((a) => ({ valeur: a.valeur, libelle: a.libelle }))} /></Box>
        <Button variant="contained" onClick={entrainer} disabled={attente || !suffisant}>{attente ? "Entraînement…" : "Entraîner une nouvelle version"}</Button>
        <Button variant="outlined" onClick={() => telechargerJeuDonnees(etape).catch((e) => notifier(messageErreur(e), "error"))}>Exporter le jeu de données (CSV)</Button>
      </Stack>

      {versions.length > 0 && (
        <Table size="small" sx={{ mt: 2 }}>
          <TableHead><TableRow><TableCell>Version</TableCell><TableCell>Algorithme</TableCell><TableCell align="right">Exemples</TableCell><TableCell align="right">AUC</TableCell><TableCell align="right">Brier</TableCell><TableCell>Entraînée le</TableCell><TableCell align="right" /></TableRow></TableHead>
          <TableBody>
            {versions.map((v) => {
              const m = v.metriques?.validation_croisee_apres_calibration;
              return (
                <TableRow key={v.id} hover selected={vue?.id === v.id} onClick={() => setDetail(v.id)} sx={{ cursor: "pointer" }}>
                  <TableCell>{v.version}{v.actif && <Chip size="small" color="success" label="active" sx={{ ml: 1 }} />}</TableCell>
                  <TableCell>{ALGO_LIBELLE[v.algorithme] ?? v.algorithme}</TableCell>
                  <TableCell align="right">{v.nb_exemples ?? "—"}</TableCell>
                  <TableCell align="right">{n3(m?.auc)}</TableCell>
                  <TableCell align="right">{n3(m?.brier)}</TableCell>
                  <TableCell>{dateHeure(v.entraine_le)}</TableCell>
                  <TableCell align="right">{!v.actif && <Button size="small" onClick={(e) => { e.stopPropagation(); activer(v.id); }}>Activer</Button>}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}

      {vue?.metriques?.comparaison && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom>Comparaison des modèles pour la version {vue.version}</Typography>
          <Comparaison modeles={vue.metriques.comparaison.modeles} recommande={vue.metriques.comparaison.recommande} />
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
            Prédictions « hors échantillon » (validation croisée répétée). Les métriques « après calibration » sont légèrement optimistes : le calibreur est ajusté sur ces mêmes prédictions.
            Une version entraînée reste inactive tant qu'elle n'a pas été activée ici.
          </Typography>
        </Box>
      )}
    </Paper>
  );
}

/** Modèle de fiabilité : jeu de données étiqueté, entraînement, comparaison des algorithmes, activation des versions. */
export default function ModelesFiabilite() {
  const apercus = useAsync(apercuFiabilite);
  const modeles = useAsync(listModelesFiabilite);
  const recharger = () => { apercus.reload(); modeles.reload(); };
  return (
    <>
      <PageHeader titre="Modèle de fiabilité" fil={[{ libelle: "Administration" }, { libelle: "Modèle de fiabilité" }]} />
      <Alert severity="info" sx={{ mb: 2 }}>
        Ce modèle ne détecte ni ne diagnostique rien : il estime seulement la fiabilité des réponses des autres outils (analyse de code, Gemini).
        Tant qu'aucune version n'est active, un score de départ par règles fixées à la main est utilisé (affiché comme « non appris »).
      </Alert>
      <Etat loading={apercus.loading || modeles.loading} error={apercus.error ?? modeles.error}>
        <Stack spacing={2}>
          {ETAPES.map((e) => (
            <Etape key={e.etape} {...e} apercu={(apercus.data ?? []).find((a) => a.etape === e.etape)}
              versions={(modeles.data ?? []).filter((v) => v.etape === e.etape)} recharger={recharger} />
          ))}
        </Stack>
      </Etat>
    </>
  );
}
