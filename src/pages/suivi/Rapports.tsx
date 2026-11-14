import BoutonAction from "../../components/BoutonAction";
import { Alert, Box, LinearProgress, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography, useTheme } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useState } from "react";
import { messageErreur } from "../../api/client";
import { enregistrerRapport, rapportIaTests, rapportProblemesTaches } from "../../api/suivi";
import Etat from "../../components/Etat";
import FiltreSelect from "../../components/FiltreSelect";
import OngletsHorizontaux from "../../components/OngletsHorizontaux";
import PageHeader from "../../components/PageHeader";
import { useApplicationOptionnelle } from "../../context/ApplicationContext";
import { useApplications } from "../../context/ApplicationsContext";
import { useNotifier } from "../../context/SnackbarContext";
import { useAsync } from "../../hooks/useAsync";
import { dureeEnJours } from "../../utils/format";
import { libelle } from "../../utils/libelles";

const ONGLETS_RAPPORT = [
  { valeur: "pt", libelle: "Problèmes et tâches" },
  { valeur: "ia", libelle: "IA et tests" },
] as const;

function Indicateur({ titre, valeur, detail }: { titre: string; valeur: string | number; detail?: string }) {
  return <Paper sx={{ p: 1.5 }}><Typography variant="caption" color="text.secondary">{titre}</Typography><Typography variant="h5" component="p">{valeur}</Typography>{detail && <Typography variant="caption" color="text.secondary">{detail}</Typography>}</Paper>;
}

function Barres({ titre, lignes }: { titre: string; lignes: { libelle: string; nb: number; couleur?: string }[] }) {
  const theme = useTheme();
  const max = Math.max(1, ...lignes.map((l) => l.nb));
  const couleurs = [theme.palette.secondary.main, theme.palette.info.main, theme.palette.success.main, theme.palette.warning.main];
  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="subtitle1" fontWeight={600} gutterBottom>{titre}</Typography>
      {lignes.length === 0 && <Typography variant="body2" color="text.secondary">Aucune donnée.</Typography>}
      <Stack spacing={1}>
        {lignes.map((l, i) => {
          const couleur = l.couleur ?? couleurs[i % couleurs.length];
          return (
            <Box key={l.libelle} sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(90px, 130px) 1fr 28px", sm: "150px 1fr 32px" }, alignItems: "center", gap: 1 }}>
              <Typography variant="body2" noWrap>{l.libelle}</Typography>
              <LinearProgress variant="determinate" value={(l.nb / max) * 100} sx={{
                height: 9, borderRadius: 99, bgcolor: alpha(couleur, 0.12),
                "& .MuiLinearProgress-bar": { borderRadius: 99, bgcolor: couleur },
              }} />
              <Typography variant="body2" align="right">{l.nb}</Typography>
            </Box>
          );
        })}
      </Stack>
    </Paper>
  );
}

function Colonnes({ titre, points }: { titre: string; points: { libelle: string; nb: number; couleur: string }[] }) {
  const theme = useTheme();
  const largeur = 600;
  const hauteur = 240;
  const marge = { haut: 24, droite: 20, bas: 48, gauche: 42 };
  const aireLargeur = largeur - marge.gauche - marge.droite;
  const aireHauteur = hauteur - marge.haut - marge.bas;
  const maximum = Math.max(1, ...points.map((point) => point.nb));
  const pas = points.length ? aireLargeur / points.length : aireLargeur;
  const largeurColonne = Math.min(48, pas * 0.52);
  const baseline = marge.haut + aireHauteur;

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="subtitle1" fontWeight={600} gutterBottom>{titre}</Typography>
      {points.length === 0 ? <Typography variant="body2" color="text.secondary">Aucune donnée.</Typography> : (
        <Box sx={{ overflowX: "auto" }}>
          <svg viewBox={`0 0 ${largeur} ${hauteur}`} role="img" aria-label={titre}
            style={{ display: "block", width: "100%", minWidth: 360, height: "auto" }}>
            {[0, 1, 2, 3].map((i) => {
              const y = marge.haut + (i * aireHauteur) / 3;
              const valeur = Math.round(maximum * (1 - i / 3));
              return (
                <g key={i}>
                  <line x1={marge.gauche} x2={largeur - marge.droite} y1={y} y2={y} stroke={theme.palette.divider} strokeDasharray="3 4" />
                  <text x={marge.gauche - 8} y={y + 4} textAnchor="end" fill={theme.palette.text.secondary} fontSize="11">{valeur}</text>
                </g>
              );
            })}
            <line x1={marge.gauche} x2={largeur - marge.droite} y1={baseline} y2={baseline} stroke={theme.palette.divider} />
            {points.map((point, index) => {
              const barHeight = (point.nb / maximum) * aireHauteur;
              const x = marge.gauche + index * pas + (pas - largeurColonne) / 2;
              const y = baseline - barHeight;
              return (
                <g key={point.libelle}>
                  <rect x={x} y={y} width={largeurColonne} height={barHeight} rx="5" fill={point.couleur}>
                    <title>{point.libelle} : {point.nb}</title>
                  </rect>
                  <text x={x + largeurColonne / 2} y={Math.max(marge.haut + 12, y - 6)} textAnchor="middle" fill={theme.palette.text.primary} fontSize="12" fontWeight="600">{point.nb}</text>
                  <text x={x + largeurColonne / 2} y={baseline + 22} textAnchor="middle" fill={theme.palette.text.secondary} fontSize="12">{point.libelle}</text>
                </g>
              );
            })}
          </svg>
        </Box>
      )}
    </Paper>
  );
}

interface Segment { libelle: string; nb: number; couleur: string }

function Anneau({ titre, segments }: { titre: string; segments: Segment[] }) {
  const theme = useTheme();
  const total = segments.reduce((somme, segment) => somme + segment.nb, 0);
  const rayon = 52;
  const circonference = 2 * Math.PI * rayon;
  let decalage = 0;
  const arcs = segments.filter((segment) => segment.nb > 0).map((segment) => {
    const longueur = (segment.nb / total) * circonference;
    const arc = (
      <circle key={segment.libelle} cx="80" cy="80" r={rayon} fill="none" stroke={segment.couleur} strokeWidth="20"
        strokeDasharray={`${longueur} ${circonference - longueur}`} strokeDashoffset={-decalage}
        transform="rotate(-90 80 80)">
        <title>{segment.libelle} : {segment.nb}</title>
      </circle>
    );
    decalage += longueur;
    return arc;
  });

  return (
    <Paper sx={{ p: 2, height: "100%" }}>
      <Typography variant="subtitle1" fontWeight={600} gutterBottom>{titre}</Typography>
      {total === 0 ? <Typography variant="body2" color="text.secondary">Aucune donnée.</Typography> : (
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "160px minmax(0, 1fr)" }, alignItems: "center", gap: 1.5 }}>
          <Box sx={{ width: 160, maxWidth: "100%", mx: "auto" }}>
            <svg viewBox="0 0 160 160" role="img" aria-label={`${titre}, ${total} au total`} style={{ width: "100%", height: "auto" }}>
              <circle cx="80" cy="80" r={rayon} fill="none" stroke={theme.palette.action.hover} strokeWidth="20" />
              {arcs}
              <text x="80" y="77" textAnchor="middle" fill={theme.palette.text.primary} fontSize="24" fontWeight="700">{total}</text>
              <text x="80" y="98" textAnchor="middle" fill={theme.palette.text.secondary} fontSize="11">au total</text>
            </svg>
          </Box>
          <Stack spacing={0.75}>
            {segments.map((segment) => (
              <Stack key={segment.libelle} direction="row" spacing={1} alignItems="center">
                <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: segment.couleur, flexShrink: 0 }} />
                <Typography variant="body2" sx={{ flex: 1 }}>{segment.libelle}</Typography>
                <Typography variant="body2" fontWeight={600}>{segment.nb}</Typography>
              </Stack>
            ))}
          </Stack>
        </Box>
      )}
    </Paper>
  );
}

function Courbe({ titre, points }: { titre: string; points: { libelle: string; nb: number }[] }) {
  const theme = useTheme();
  const largeur = 640;
  const hauteur = 260;
  const marge = { haut: 20, droite: 20, bas: 42, gauche: 42 };
  const aireLargeur = largeur - marge.gauche - marge.droite;
  const aireHauteur = hauteur - marge.haut - marge.bas;
  const maximum = Math.max(1, ...points.map((point) => point.nb));
  const coordonnees = points.map((point, index) => ({
    ...point,
    x: points.length === 1 ? marge.gauche + aireLargeur / 2 : marge.gauche + (index * aireLargeur) / (points.length - 1),
    y: marge.haut + aireHauteur - (point.nb / maximum) * aireHauteur,
  }));
  const chemin = coordonnees.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
  const aire = coordonnees.length > 1
    ? `${chemin} L ${coordonnees[coordonnees.length - 1].x} ${marge.haut + aireHauteur} L ${coordonnees[0].x} ${marge.haut + aireHauteur} Z`
    : "";
  const intervalleEtiquettes = Math.max(1, Math.ceil(points.length / 8));

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="subtitle1" fontWeight={600} gutterBottom>{titre}</Typography>
      {points.length === 0 ? <Typography variant="body2" color="text.secondary">Aucune donnée.</Typography> : (
        <Box sx={{ overflowX: "auto" }}>
          <svg viewBox={`0 0 ${largeur} ${hauteur}`} role="img" aria-label={titre}
            style={{ display: "block", width: "100%", minWidth: 420, height: "auto" }}>
            {[0, 1, 2, 3].map((i) => {
              const y = marge.haut + (i * aireHauteur) / 3;
              const valeur = Math.round(maximum * (1 - i / 3));
              return (
                <g key={i}>
                  <line x1={marge.gauche} x2={largeur - marge.droite} y1={y} y2={y} stroke={theme.palette.divider} strokeDasharray="3 4" />
                  <text x={marge.gauche - 8} y={y + 4} textAnchor="end" fill={theme.palette.text.secondary} fontSize="11">{valeur}</text>
                </g>
              );
            })}
            {aire && <path d={aire} fill={theme.palette.secondary.main} fillOpacity="0.12" />}
            {chemin && <path d={chemin} fill="none" stroke={theme.palette.secondary.main} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />}
            {coordonnees.map((point, index) => (
              <g key={`${point.libelle}-${index}`}>
                <circle cx={point.x} cy={point.y} r="4.5" fill={theme.palette.secondary.main} stroke={theme.palette.background.paper} strokeWidth="2">
                  <title>{point.libelle} : {point.nb}</title>
                </circle>
                {(index % intervalleEtiquettes === 0 || index === coordonnees.length - 1) && (
                  <text x={point.x} y={hauteur - 12} textAnchor="middle" fill={theme.palette.text.secondary} fontSize="11">{point.libelle}</text>
                )}
              </g>
            ))}
          </svg>
        </Box>
      )}
    </Paper>
  );
}

interface LigneEmpilee { libelle: string; valides: number; nonValides: number; attente: number }

function BarresEmpilees({ titre, lignes }: { titre: string; lignes: LigneEmpilee[] }) {
  const theme = useTheme();
  const segments = [
    { cle: "valides" as const, label: "Validés", color: alpha(theme.palette.success.main, 0.72) },
    { cle: "nonValides" as const, label: "Non validés", color: alpha(theme.palette.error.main, 0.72) },
    { cle: "attente" as const, label: "En attente", color: alpha(theme.palette.info.main, 0.72) },
  ];

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="subtitle1" fontWeight={600} gutterBottom>{titre}</Typography>
      <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap sx={{ mb: 1.5 }}>
        {segments.map((segment) => (
          <Stack key={segment.cle} direction="row" spacing={0.75} alignItems="center">
            <Box sx={{ width: 9, height: 9, borderRadius: 1, bgcolor: segment.color }} />
            <Typography variant="caption" color="text.secondary">{segment.label}</Typography>
          </Stack>
        ))}
      </Stack>
      {lignes.length === 0 && <Typography variant="body2" color="text.secondary">Aucune donnée.</Typography>}
      <Stack spacing={1.25}>
        {lignes.map((ligne) => {
          const total = ligne.valides + ligne.nonValides + ligne.attente;
          return (
            <Box key={ligne.libelle} sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(90px, 130px) 1fr 32px", sm: "180px 1fr 40px" }, alignItems: "center", gap: 1 }}>
              <Typography variant="body2" noWrap title={ligne.libelle}>{ligne.libelle}</Typography>
              <Box role="img" aria-label={`${ligne.libelle}: ${ligne.valides} validés, ${ligne.nonValides} non validés, ${ligne.attente} en attente`}
                sx={{ display: "flex", height: 12, overflow: "hidden", borderRadius: 99, bgcolor: theme.palette.action.hover }}>
                {segments.map((segment) => {
                  const valeur = ligne[segment.cle];
                  return valeur > 0 && total > 0 ? (
                    <Box key={segment.cle} title={`${segment.label}: ${valeur}`} sx={{ width: `${(valeur / total) * 100}%`, bgcolor: segment.color }} />
                  ) : null;
                })}
              </Box>
              <Typography variant="body2" align="right">{total}</Typography>
            </Box>
          );
        })}
      </Stack>
    </Paper>
  );
}

function Bulles({ titre, points }: { titre: string; points: { libelle: string; nb: number; couleur: string }[] }) {
  const maximum = Math.max(1, ...points.map((point) => point.nb));
  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="subtitle1" fontWeight={600} gutterBottom>{titre}</Typography>
      {points.length === 0 ? <Typography variant="body2" color="text.secondary">Aucune donnée.</Typography> : (
        <Box role="img" aria-label={titre} sx={{ display: "flex", flexWrap: "wrap", justifyContent: "center", alignItems: "center", gap: 1.5, minHeight: 180 }}>
          {points.map((point) => {
            const taille = 68 + Math.round(72 * Math.sqrt(point.nb / maximum));
            return (
              <Box key={point.libelle} title={`${point.libelle} : ${point.nb}`} sx={{
                width: taille, height: taille, borderRadius: "50%", flexShrink: 0, display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center", p: 1, overflow: "hidden",
                bgcolor: alpha(point.couleur, 0.12), color: point.couleur, border: "1px solid", borderColor: alpha(point.couleur, 0.35),
              }}>
                <Typography variant="h6" component="span" fontWeight={700} lineHeight={1.1}>{point.nb}</Typography>
                <Typography variant="caption" component="span" noWrap sx={{ maxWidth: "100%" }}>{point.libelle}</Typography>
              </Box>
            );
          })}
        </Box>
      )}
    </Paper>
  );
}

function Mosaique({ titre, points }: { titre: string; points: { libelle: string; nb: number; couleur: string }[] }) {
  const total = points.reduce((somme, point) => somme + point.nb, 0);
  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="subtitle1" fontWeight={600} gutterBottom>{titre}</Typography>
      {points.length === 0 ? <Typography variant="body2" color="text.secondary">Aucune donnée.</Typography> : (
        <Box role="img" aria-label={`${titre}, ${total} au total`} sx={{ display: "flex", flexWrap: "wrap", gap: 1, minHeight: 180 }}>
          {points.map((point) => {
            const part = total ? (point.nb / total) * 100 : 0;
            return (
              <Box key={point.libelle} title={`${point.libelle} : ${point.nb} (${Math.round(part)} %)`} sx={{
                flex: `${Math.max(point.nb, 1)} 1 125px`, minWidth: 105, minHeight: 84, p: 1.25, position: "relative",
                display: "flex", flexDirection: "column", justifyContent: "space-between", overflow: "hidden",
                borderRadius: 1.5, bgcolor: alpha(point.couleur, 0.1), border: "1px solid", borderColor: alpha(point.couleur, 0.24),
              }}>
                <Typography variant="h5" component="span" fontWeight={700} color={point.couleur}>{point.nb}</Typography>
                <Typography variant="caption" color="text.secondary">{point.libelle} · {Math.round(part)} %</Typography>
                <Box sx={{ position: "absolute", bottom: 0, left: 0, height: 4, width: `${part}%`, bgcolor: point.couleur }} />
              </Box>
            );
          })}
        </Box>
      )}
    </Paper>
  );
}

function Gaufrier({ titre, segments }: { titre: string; segments: Segment[] }) {
  const total = segments.reduce((somme, segment) => somme + segment.nb, 0);
  let cumule = 0;
  let cellulesUtilisees = 0;
  const cellules = total === 0 ? [] : segments.flatMap((segment, index) => {
    cumule += segment.nb;
    const fin = index === segments.length - 1 ? 100 : Math.round((cumule / total) * 100);
    const nombre = fin - cellulesUtilisees;
    cellulesUtilisees = fin;
    return Array.from({ length: nombre }, (_, cellule) => ({ couleur: segment.couleur, libelle: segment.libelle, cellule }));
  });

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="subtitle1" fontWeight={600} gutterBottom>{titre}</Typography>
      {total === 0 ? <Typography variant="body2" color="text.secondary">Aucune donnée.</Typography> : (
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center">
          <Box role="img" aria-label={`${titre}, ${total} réponses`} sx={{
            display: "grid", gridTemplateColumns: "repeat(10, minmax(12px, 1fr))", gap: 0.5,
            width: { xs: "100%", sm: 180 }, flexShrink: 0,
          }}>
            {cellules.map((cellule, index) => (
              <Box key={index} title={cellule.libelle} sx={{ aspectRatio: "1", borderRadius: 0.5, bgcolor: cellule.couleur }} />
            ))}
          </Box>
          <Stack spacing={0.75} sx={{ flex: 1, width: "100%" }}>
            {segments.map((segment) => (
              <Stack key={segment.libelle} direction="row" spacing={1} alignItems="center">
                <Box sx={{ width: 10, height: 10, borderRadius: 0.5, bgcolor: segment.couleur, flexShrink: 0 }} />
                <Typography variant="body2" sx={{ flex: 1 }}>{segment.libelle}</Typography>
                <Typography variant="body2" fontWeight={600}>{segment.nb}</Typography>
              </Stack>
            ))}
          </Stack>
        </Stack>
      )}
    </Paper>
  );
}

function ColonneRepartie({ titre, segments }: { titre: string; segments: Segment[] }) {
  const theme = useTheme();
  const total = segments.reduce((somme, segment) => somme + segment.nb, 0);
  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="subtitle1" fontWeight={600} gutterBottom>{titre}</Typography>
      {total === 0 ? <Typography variant="body2" color="text.secondary">Aucune donnée.</Typography> : (
        <Stack direction="row" spacing={2.5} alignItems="center" justifyContent="center" sx={{ minHeight: 180 }}>
          <Box role="img" aria-label={`${titre}, ${total} au total`} sx={{
            width: 64, height: 172, display: "flex", flexDirection: "column", overflow: "hidden",
            borderRadius: 3, border: "2px solid", borderColor: theme.palette.divider, bgcolor: theme.palette.action.hover,
          }}>
            {segments.filter((segment) => segment.nb > 0).map((segment) => (
              <Box key={segment.libelle} title={`${segment.libelle} : ${segment.nb}`}
                sx={{ flex: `${segment.nb} 1 0%`, minHeight: 3, bgcolor: segment.couleur, borderBottom: "1px solid", borderColor: alpha(theme.palette.background.paper, 0.6) }} />
            ))}
          </Box>
          <Stack spacing={1}>
            {segments.map((segment) => (
              <Stack key={segment.libelle} direction="row" spacing={1} alignItems="center">
                <Box sx={{ width: 10, height: 10, borderRadius: 0.5, bgcolor: segment.couleur, flexShrink: 0 }} />
                <Typography variant="body2">{segment.libelle}</Typography>
                <Typography variant="body2" fontWeight={600}>{segment.nb}</Typography>
              </Stack>
            ))}
          </Stack>
        </Stack>
      )}
    </Paper>
  );
}

function ColonnesGroupees({ titre, lignes }: { titre: string; lignes: LigneEmpilee[] }) {
  const theme = useTheme();
  const series = [
    { cle: "valides" as const, libelle: "Validés", couleur: theme.palette.success.main },
    { cle: "nonValides" as const, libelle: "Non validés", couleur: theme.palette.error.main },
    { cle: "attente" as const, libelle: "En attente", couleur: theme.palette.info.main },
  ];
  const largeur = 640;
  const hauteur = 260;
  const marge = { haut: 24, droite: 20, bas: 48, gauche: 42 };
  const aireLargeur = largeur - marge.gauche - marge.droite;
  const aireHauteur = hauteur - marge.haut - marge.bas;
  const maximum = Math.max(1, ...lignes.flatMap((ligne) => series.map((serie) => ligne[serie.cle])));
  const pas = aireLargeur / Math.max(lignes.length, 1);
  const largeurColonne = Math.min(18, (pas * 0.72) / series.length);
  const baseline = marge.haut + aireHauteur;

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="subtitle1" fontWeight={600} gutterBottom>{titre}</Typography>
      <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap sx={{ mb: 1 }}>
        {series.map((serie) => (
          <Stack key={serie.cle} direction="row" spacing={0.75} alignItems="center">
            <Box sx={{ width: 9, height: 9, borderRadius: 0.5, bgcolor: serie.couleur }} />
            <Typography variant="caption" color="text.secondary">{serie.libelle}</Typography>
          </Stack>
        ))}
      </Stack>
      {lignes.length === 0 ? <Typography variant="body2" color="text.secondary">Aucune donnée.</Typography> : (
        <Box sx={{ overflowX: "auto" }}>
          <svg viewBox={`0 0 ${largeur} ${hauteur}`} role="img" aria-label={titre}
            style={{ display: "block", width: "100%", minWidth: 420, height: "auto" }}>
            {[0, 1, 2, 3].map((i) => {
              const y = marge.haut + (i * aireHauteur) / 3;
              return (
                <g key={i}>
                  <line x1={marge.gauche} x2={largeur - marge.droite} y1={y} y2={y} stroke={theme.palette.divider} strokeDasharray="3 4" />
                  <text x={marge.gauche - 8} y={y + 4} textAnchor="end" fill={theme.palette.text.secondary} fontSize="11">
                    {Math.round(maximum * (1 - i / 3))}
                  </text>
                </g>
              );
            })}
            <line x1={marge.gauche} x2={largeur - marge.droite} y1={baseline} y2={baseline} stroke={theme.palette.divider} />
            {lignes.map((ligne, index) => {
              const debut = marge.gauche + index * pas + (pas - largeurColonne * series.length) / 2;
              return (
                <g key={ligne.libelle}>
                  {series.map((serie, serieIndex) => {
                    const valeur = ligne[serie.cle];
                    const hauteurColonne = (valeur / maximum) * aireHauteur;
                    const x = debut + serieIndex * largeurColonne;
                    return (
                      <rect key={serie.cle} x={x} y={baseline - hauteurColonne} width={largeurColonne - 2} height={hauteurColonne}
                        rx="2" fill={serie.couleur}>
                        <title>{ligne.libelle} · {serie.libelle} : {valeur}</title>
                      </rect>
                    );
                  })}
                  <text x={marge.gauche + index * pas + pas / 2} y={baseline + 22} textAnchor="middle" fill={theme.palette.text.secondary} fontSize="11">{ligne.libelle}</text>
                </g>
              );
            })}
          </svg>
        </Box>
      )}
    </Paper>
  );
}

/** Rapports (globaux ou par application). Limite assumée : les indicateurs IA et tests sont cumulés sur toute la durée. */
export default function Rapports() {
  const theme = useTheme();
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
  const enAttente = (r?.validation_tests ?? []).reduce((a, x) => a + x.nb_en_attente, 0);
  const rouverts = (r?.problemes_rouverts ?? []).reduce((a, x) => a + x.nb_reouvertures, 0);
  const validationsParDecision = Object.values((r?.validation_par_decision ?? []).reduce<Record<string, LigneEmpilee>>((acc, ligne) => {
    const cle = ligne.type_decision;
    const courant = acc[cle] ?? { libelle: libelle("typeDecision", cle), valides: 0, nonValides: 0, attente: 0 };
    courant.valides += ligne.nb_valides;
    courant.nonValides += ligne.nb_non_valides;
    courant.attente += ligne.nb_en_attente;
    acc[cle] = courant;
    return acc;
  }, {}));
  const testsParApplication = (r?.validation_tests ?? []).map((ligne) => ({
    libelle: ctx ? "Cette application" : nomApp(ligne.application_id),
    valides: ligne.nb_valides,
    nonValides: ligne.nb_non_valides,
    attente: ligne.nb_en_attente,
  }));

  return (
    <>
      <PageHeader titre="Rapports" actions={<><BoutonAction variant="outlined" onClick={exporter}>Exporter</BoutonAction><BoutonAction variant="contained" onClick={enregistrer}>Enregistrer le rapport</BoutonAction></>} />
      <Box sx={{
        display: "flex", flexDirection: "column", flex: 1, minWidth: 0, minHeight: 0,
        bgcolor: "background.paper", borderRadius: 2, overflow: "hidden",
      }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center"
          sx={{ px: { xs: 1.5, sm: 2 }, py: 1.5, flexShrink: 0 }} flexWrap="wrap" useFlexGap>
          <OngletsHorizontaux valeur={onglet} onglets={ONGLETS_RAPPORT} onChange={setOnglet} />
          {onglet === "pt" && <FiltreSelect label="Période" valeur={jours} onChange={(v) => setJours(v || "30")} options={[{ valeur: "7", libelle: "7 jours" }, { valeur: "30", libelle: "30 jours" }, { valeur: "90", libelle: "90 jours" }, { valeur: "365", libelle: "1 an" }]} largeur={150} />}
        </Stack>
        <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto", p: { xs: 1.5, sm: 2 }, pt: 0 }}>

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
                <Colonnes titre="Problèmes par gravité" points={d.par_gravite.map((x) => ({
                  libelle: libelle("gravite", x.gravite),
                  nb: x.nb,
                  couleur: x.gravite === "critique" ? theme.palette.error.main
                    : x.gravite === "elevee" ? theme.palette.warning.main
                      : x.gravite === "faible" ? theme.palette.success.main
                        : theme.palette.info.main,
                }))} />
                <Anneau titre="Problèmes par catégorie" segments={d.par_categorie.map((x, i) => ({
                  libelle: libelle("categorie", x.categorie),
                  nb: x.nb,
                  couleur: [
                    theme.palette.primary.main,
                    theme.palette.secondary.main,
                    theme.palette.info.main,
                    theme.palette.success.main,
                    theme.palette.warning.main,
                    theme.palette.error.main,
                  ][i % 6],
                }))} />
                <Courbe titre="Évolution des problèmes créés" points={d.evolution.map((x) => ({ libelle: new Date(x.mois).toLocaleDateString("fr-FR", { month: "short" }), nb: x.nb }))} />
                <Barres titre="Tâches par statut" lignes={d.taches.map((x) => ({
                  libelle: libelle("statutTache", x.statut),
                  nb: x.nb,
                  couleur: x.statut === "terminee" ? theme.palette.success.main
                    : x.statut === "en_cours" ? theme.palette.info.main
                      : x.statut === "en_pause" ? theme.palette.warning.main
                        : x.statut === "arretee" ? theme.palette.error.main
                          : theme.palette.secondary.main,
                }))} />
                {!ctx && <Bulles titre="Problèmes par application" points={d.par_application.map((x, i) => ({
                  libelle: nomApp(x.application_id),
                  nb: x.nb,
                  couleur: [
                    theme.palette.primary.main,
                    theme.palette.secondary.main,
                    theme.palette.info.main,
                    theme.palette.success.main,
                    theme.palette.warning.main,
                    theme.palette.error.main,
                  ][i % 6],
                }))} />}
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
                <Mosaique titre="Décisions de correction" points={r.decisions_correction.map((x, i) => ({
                  libelle: libelle("typeDecision", x.type_decision),
                  nb: x.nb,
                  couleur: [
                    theme.palette.primary.main,
                    theme.palette.secondary.main,
                    theme.palette.info.main,
                    theme.palette.success.main,
                    theme.palette.warning.main,
                    theme.palette.error.main,
                  ][i % 6],
                }))} />
                <Gaufrier titre="Utilité perçue des solutions de l’IA" segments={r.utilite_solutions_ia.map((x) => ({
                  libelle: libelle("utilite", x.utilite_percue),
                  nb: x.nb,
                  couleur: x.utilite_percue === "utile" ? theme.palette.success.main
                    : x.utilite_percue === "incorrecte" ? theme.palette.error.main
                      : x.utilite_percue === "partiellement_utile" ? theme.palette.warning.main
                        : theme.palette.info.main,
                }))} />
                <ColonneRepartie titre="Résultats des tests" segments={[
                  { libelle: "Validés", nb: valides, couleur: theme.palette.success.main },
                  { libelle: "Non validés", nb: refus, couleur: theme.palette.error.main },
                  { libelle: "En attente", nb: enAttente, couleur: theme.palette.info.main },
                ]} />
                <BarresEmpilees titre="Résultats des tests par application" lignes={testsParApplication} />
                <ColonnesGroupees titre="Résultats selon la décision de correction" lignes={validationsParDecision} />
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
            </Stack>
          )}
        </Etat>
      )}
        </Box>
      </Box>
    </>
  );
}
