import { Box, Button, Paper, Stack, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { vueEnsemble } from "../../api/applications";
import Etat from "../../components/Etat";
import StatutChip from "../../components/StatutChip";
import { useApplication } from "../../context/ApplicationContext";
import { useAsync } from "../../hooks/useAsync";
import { dateHeure } from "../../utils/format";

function Indicateur({ titre, valeur, detail, alerte }: { titre: string; valeur: number; detail?: string; alerte?: boolean }) {
  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="body2" color="text.secondary">{titre}</Typography>
      <Typography variant="h4" component="p">{valeur}</Typography>
      {detail && <Typography variant="caption" color={alerte ? "warning.main" : "text.secondary"}>{detail}</Typography>}
    </Paper>
  );
}

/** Tableau de bord limité à l'application sélectionnée. */
export default function VueEnsemble() {
  const { application } = useApplication();
  const { data, loading, error } = useAsync(() => vueEnsemble(application.id), [application.id]);
  const base = `/applications/${application.id}`;

  return (
    <Etat loading={loading} error={error}>
      {data && (
        <Stack spacing={2}>
          <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" } }}>
            <Indicateur titre="Problèmes ouverts" valeur={data.problemes_ouverts} />
            <Indicateur titre="Critiques" valeur={data.problemes_critiques} alerte={data.problemes_critiques > 0} />
            <Indicateur titre="Tâches en cours" valeur={data.taches_en_cours} detail={`${data.taches_en_retard} en retard`} alerte={data.taches_en_retard > 0} />
            <Indicateur titre="Tests en attente" valeur={data.tests_en_attente} />
          </Box>
          <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" } }}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle1" fontWeight={600}>Dernière vérification</Typography>
              {data.derniere_verification ? (
                <Stack spacing={0.5} sx={{ mt: 1 }}>
                  <Typography variant="body2">{dateHeure(data.derniere_verification.debut_le)} · branche {data.derniere_verification.branche}</Typography>
                  <Typography variant="body2" color="text.secondary">Version {data.derniere_verification.commit?.slice(0, 8) ?? "—"}</Typography>
                  <Typography variant="body2">{data.derniere_verification.resultat_global ?? "—"}</Typography>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <StatutChip groupe="statutVerification" valeur={data.derniere_verification.statut} />
                    <Button component={RouterLink} to={`${base}/verifications/${data.derniere_verification.id}`} size="small">Voir le détail</Button>
                  </Stack>
                </Stack>
              ) : <Typography color="text.secondary" variant="body2" sx={{ mt: 1 }}>Aucune vérification pour l'instant.</Typography>}
            </Paper>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle1" fontWeight={600}>Corrections en attente de test</Typography>
              <Typography variant="h4" component="p" sx={{ mt: 1 }}>{data.corrections_en_attente_de_test}</Typography>
              <Button component={RouterLink} to={`${base}/tests`} size="small">Voir les tests</Button>
            </Paper>
          </Box>
        </Stack>
      )}
    </Etat>
  );
}
