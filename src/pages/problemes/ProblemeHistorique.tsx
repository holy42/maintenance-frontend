import HistoryOutlined from "@mui/icons-material/HistoryOutlined";
import { Box, Chip, Paper, Stack, Typography } from "@mui/material";
import { historiqueProbleme } from "../../api/problemes";
import Etat from "../../components/Etat";
import EvenementIcone from "../../components/EvenementIcone";
import { useAnnuaire } from "../../context/AnnuaireContext";
import { useProbleme } from "../../context/ProblemeContext";
import { useAsync } from "../../hooks/useAsync";
import { dateHeure } from "../../utils/format";
import { couleurEvenement, libelleEvenement } from "../../utils/libelles";

/** Chronologie du problème (et de ses tâches) : lecture seule, journal en ajout seul. */
export default function ProblemeHistorique() {
  const { probleme } = useProbleme();
  const { nom } = useAnnuaire();
  const { data, loading, error } = useAsync(() => historiqueProbleme(probleme.id), [probleme.id]);
  const resume = (v: Record<string, unknown> | null) => (v ? Object.entries(v).map(([k, x]) => `${k} : ${typeof x === "object" ? JSON.stringify(x) : String(x)}`).join(", ") : "");

  return (
    <Etat loading={loading} error={error}>
      <Stack spacing={1.25} sx={{ maxWidth: 1100, width: "100%", mx: "auto" }}>
        {(data ?? []).length === 0 && (
          <Paper sx={{ p: 4, textAlign: "center", bgcolor: "rgba(66, 153, 224, 0.035)" }}>
            <HistoryOutlined color="disabled" sx={{ fontSize: 36, mb: 1 }} />
            <Typography fontWeight={600}>Aucun événement pour ce problème</Typography>
            <Typography variant="body2" color="text.secondary">Les changements apparaîtront ici au fil du suivi.</Typography>
          </Paper>
        )}
        {(data ?? []).map((e) => {
          const ton = couleurEvenement(e.action);
          const auteur = nom(e.auteur_id);
          return (
            <Paper key={e.id} sx={{ p: { xs: 1.5, sm: 2 }, borderColor: "divider" }}>
              <Stack direction="row" spacing={1.5} alignItems="flex-start">
                <EvenementIcone type={e.type_element} action={e.action} />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} spacing={0.5}>
                    <Typography variant="subtitle2" fontWeight={700}>{libelleEvenement(e.action)}</Typography>
                    <Chip size="small" color={ton} variant="outlined" label={e.type_element.replace(/_/g, " ")} />
                  </Stack>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                    {dateHeure(e.cree_le)} · {auteur === "—" ? "Système" : auteur}
                  </Typography>
                  {(e.ancienne_valeur || e.nouvelle_valeur || e.commentaire) && (
                    <Paper sx={{ p: 1.5, mt: 1.25, bgcolor: "rgba(66, 153, 224, 0.045)", border: 0 }}>
                      <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" } }}>
                        {e.ancienne_valeur && (
                          <Box>
                            <Typography variant="caption" color="text.secondary" fontWeight={700}>Avant</Typography>
                            <Typography variant="body2" sx={{ overflowWrap: "anywhere" }}>{resume(e.ancienne_valeur)}</Typography>
                          </Box>
                        )}
                        {e.nouvelle_valeur && (
                          <Box>
                            <Typography variant="caption" color="text.secondary" fontWeight={700}>Après</Typography>
                            <Typography variant="body2" sx={{ overflowWrap: "anywhere" }}>{resume(e.nouvelle_valeur)}</Typography>
                          </Box>
                        )}
                        {e.commentaire && (
                          <Box sx={{ gridColumn: { md: "1 / -1" } }}>
                            <Typography variant="caption" color="text.secondary" fontWeight={700}>Commentaire</Typography>
                            <Typography variant="body2" sx={{ overflowWrap: "anywhere" }}>{e.commentaire}</Typography>
                          </Box>
                        )}
                      </Box>
                    </Paper>
                  )}
                </Box>
              </Stack>
            </Paper>
          );
        })}
      </Stack>
      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
        Les statuts sont tracés avec leur auteur. Le journal ne peut être ni modifié ni supprimé.
      </Typography>
    </Etat>
  );
}
