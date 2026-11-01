import { Box, Chip, LinearProgress, Stack, Tooltip, Typography } from "@mui/material";
import type { Fiabilite } from "../api/types";

const COULEUR = { faible: "error", moyen: "warning", eleve: "success" } as const;

function explicationSource(f: Fiabilite): string {
  return f.appris
    ? "Estimée par le modèle de fiabilité entraîné sur les décisions passées."
    : "Estimation par règles fixées à la main : aucun modèle entraîné n'est encore actif.";
}

/** Version compacte (listes) : pourcentage et niveau. Contour seul quand l'estimation n'est pas apprise. */
export function FiabiliteChip({ fiabilite }: { fiabilite: Fiabilite | null | undefined }) {
  if (!fiabilite) return <Typography variant="caption" color="text.secondary">—</Typography>;
  return (
    <Tooltip title={`Fiabilité estimée : ${explicationSource(fiabilite)}`}>
      <Chip size="small" color={COULEUR[fiabilite.niveau]} variant={fiabilite.appris ? "filled" : "outlined"}
        label={`${fiabilite.pourcentage} % · ${fiabilite.libelle_niveau}`} />
    </Tooltip>
  );
}

/**
 * Fiabilité ESTIMÉE par notre modèle (distincte de la « confiance déclarée » par Gemini, affichée ailleurs).
 * Étape 3 : probabilité que l'anomalie soit réelle. Étape 6 : probabilité que la solution soit validée au test.
 */
export default function FiabiliteBadge({ fiabilite, titre = "Fiabilité estimée" }: { fiabilite: Fiabilite | null | undefined; titre?: string }) {
  if (!fiabilite) return null;
  const question = fiabilite.etape === 3 ? "que l'anomalie soit réelle" : "que la solution soit validée au test";
  const verite = fiabilite.etiquette === null || fiabilite.etiquette === undefined ? null
    : fiabilite.etape === 3 ? (fiabilite.etiquette ? "Décision humaine : anomalie réelle." : "Décision humaine : faux positif.")
      : (fiabilite.etiquette ? "Résultat du test : solution validée." : "Résultat du test : solution non validée.");
  return (
    <Stack spacing={0.75}>
      <Stack direction="row" spacing={1} alignItems="center">
        <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: "nowrap" }}>{titre}</Typography>
        <Box sx={{ flex: 1, minWidth: 80 }}><LinearProgress variant="determinate" value={fiabilite.pourcentage} color={COULEUR[fiabilite.niveau]} /></Box>
        <Typography variant="caption">{fiabilite.pourcentage} %</Typography>
        <Chip size="small" color={COULEUR[fiabilite.niveau]} variant={fiabilite.appris ? "filled" : "outlined"} label={fiabilite.libelle_niveau} />
      </Stack>
      <Typography variant="caption" color="text.secondary">
        Probabilité estimée {question}. {explicationSource(fiabilite)} Ce n'est pas une certitude.
      </Typography>
      {fiabilite.facteurs.length > 0 && (
        <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
          {fiabilite.facteurs.map((f) => (
            <Typography key={f.variable} component="li" variant="caption">
              {f.libelle} : <strong>{f.sens}</strong> la fiabilité
            </Typography>
          ))}
        </Box>
      )}
      {verite && <Typography variant="caption" color="text.secondary">{verite}</Typography>}
    </Stack>
  );
}
