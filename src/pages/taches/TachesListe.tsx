import BoutonAction from "../../components/BoutonAction";
import ArrowForwardOutlined from "@mui/icons-material/ArrowForwardOutlined";
import ChecklistOutlined from "@mui/icons-material/ChecklistOutlined";
import CalendarTodayOutlined from "@mui/icons-material/CalendarTodayOutlined";
import ViewKanbanOutlined from "@mui/icons-material/ViewKanbanOutlined";
import { alpha } from "@mui/material/styles";
import { Box, Checkbox, Chip, FormControlLabel, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import { useState } from "react";
import { Link as RouterLink, useSearchParams } from "react-router-dom";
import { listTaches } from "../../api/taches";
import type { Tache } from "../../api/types";
import Etat from "../../components/Etat";
import FiltreSelect from "../../components/FiltreSelect";
import PageHeader from "../../components/PageHeader";
import StatutChip from "../../components/StatutChip";
import { useApplicationOptionnelle } from "../../context/ApplicationContext";
import { useAnnuaire } from "../../context/AnnuaireContext";
import { useApplications } from "../../context/ApplicationsContext";
import { useAsync } from "../../hooks/useAsync";
import { date, enRetard } from "../../utils/format";
import { libelle, options } from "../../utils/libelles";

const COLONNES = ["a_faire", "en_cours", "en_pause", "arretee", "terminee"];
const avancement = (t: Tache) => `${t.sous_taches.filter((s) => s.statut === "terminee").length}/${t.sous_taches.length}`;

/** Tâches en liste ou en Kanban (sans glisser-déposer : on change l'état depuis la fiche de la tâche). */
export default function TachesListe() {
  const ctx = useApplicationOptionnelle();
  const { trouver } = useApplications();
  const { nom } = useAnnuaire();
  const [params, setParams] = useSearchParams();
  const vue = params.get("vue") === "kanban" ? "kanban" : "liste";
  const [statut, setStatut] = useState("");
  const [mes, setMes] = useState(false);
  const [retard, setRetard] = useState(false);
  const { data, loading, error } = useAsync(() => listTaches({ application_id: ctx?.application.id, statut: statut || undefined, mes_taches: mes || undefined, en_retard: retard || undefined }),
    [ctx?.application.id, statut, mes, retard]);
  const lien = (t: Tache) => `/applications/${t.application_id}/taches/${t.id}`;

  return (
    <>
      <PageHeader titre="Tâches" sousTitre="Une tâche se crée à partir d'un problème (onglet « Tâches » de sa fiche)."
        actions={ctx ? <BoutonAction variant="outlined" component={RouterLink} to={`/applications/${ctx.application.id}/problemes`}>Choisir un problème</BoutonAction> : undefined} />
      <Box sx={{ p: { xs: 1, sm: 1.5 }, mb: 2 }}>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap>
          <ToggleButtonGroup exclusive size="small" value={vue} aria-label="Mode d’affichage des tâches" onChange={(_, v: "liste" | "kanban" | null) => {
            if (!v) return;
            setParams((courants) => {
              const suivants = new URLSearchParams(courants);
              if (v === "liste") suivants.delete("vue");
              else suivants.set("vue", v);
              return suivants;
            });
          }}
            sx={{ "& .MuiToggleButton-root": { px: 1.5, fontWeight: 600 } }}>
            <ToggleButton value="liste">Liste</ToggleButton>
            <ToggleButton value="kanban"><ViewKanbanOutlined fontSize="small" sx={{ mr: 0.75 }} />Kanban</ToggleButton>
          </ToggleButtonGroup>
          <FiltreSelect label="Statut" valeur={statut} onChange={setStatut} options={options("statutTache")} largeur={150} />
          <FormControlLabel label="Mes tâches" control={<Checkbox checked={mes} onChange={(e) => setMes(e.target.checked)} />} />
          <FormControlLabel label="En retard" control={<Checkbox checked={retard} onChange={(e) => setRetard(e.target.checked)} />} />
        </Stack>
      </Box>
      <Etat loading={loading} error={error}>
        {vue === "liste" ? (
          <Paper sx={{ overflowX: "auto", borderRadius: 2 }}>
            <Table size="small">
              <TableHead><TableRow><TableCell>Tâche</TableCell>{!ctx && <TableCell>Application</TableCell>}<TableCell>Responsable</TableCell><TableCell>Statut</TableCell><TableCell>Échéance</TableCell><TableCell>Étapes</TableCell></TableRow></TableHead>
              <TableBody>
                {(data ?? []).length === 0 && <TableRow><TableCell colSpan={6}><Typography color="text.secondary">Aucune tâche.</Typography></TableCell></TableRow>}
                {(data ?? []).map((t) => (
                  <TableRow key={t.id} hover>
                    <TableCell sx={{ minWidth: 250 }}>
                      <BoutonAction component={RouterLink} to={lien(t)} color="inherit" variant="text"
                        startIcon={<ChecklistOutlined fontSize="small" />}
                        sx={{
                          width: "100%", justifyContent: "flex-start", textAlign: "left", color: "text.primary",
                          px: 1, py: 0.5, minHeight: 38,
                          "& .MuiButton-startIcon": { color: "secondary.main" },
                          "&:hover": { bgcolor: "rgba(66, 153, 224, 0.08)", color: "primary.main" },
                        }}>
                        <Typography component="span" variant="body2" fontWeight={600} noWrap sx={{ flex: 1, minWidth: 0 }}>{t.titre}</Typography>
                      </BoutonAction>
                    </TableCell>
                    {!ctx && <TableCell>{trouver(t.application_id)?.nom ?? `#${t.application_id}`}</TableCell>}
                    <TableCell>{nom(t.responsable_id)}</TableCell>
                    <TableCell><StatutChip groupe="statutTache" valeur={t.statut} /></TableCell>
                    <TableCell sx={{ color: enRetard(t.echeance, t.statut) ? "error.main" : "inherit" }}>{date(t.echeance)}{enRetard(t.echeance, t.statut) ? " · en retard" : ""}</TableCell>
                    <TableCell>{avancement(t)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        ) : (
          <Box sx={{ display: "flex", gap: 1.5, overflowX: "auto", pb: 1.5, alignItems: "stretch" }}>
            {COLONNES.map((c) => {
              const taches = (data ?? []).filter((t) => t.statut === c);
              const terminee = c === "terminee";
              return (
                <Paper key={c} sx={{
                  minWidth: { xs: 265, sm: 245 }, maxWidth: 340, flex: "1 0 245px", p: 1.25,
                  bgcolor: (theme) => alpha(theme.palette.secondary.main, theme.palette.mode === "light" ? 0.055 : 0.09),
                  borderColor: "divider", borderRadius: 2,
                }}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 0.5, pb: 1.25, mb: 1.25, borderBottom: 1, borderColor: "divider" }}>
                    <Typography variant="subtitle2" fontWeight={700}>{libelle("statutTache", c)}</Typography>
                    <Chip size="small" label={taches.length} color={terminee ? "success" : "primary"} variant="outlined" />
                  </Stack>
                  <Stack spacing={1.25}>
                    {taches.map((t) => (
                      <Paper key={t.id} sx={{
                        p: 1.5, borderRadius: 1.5, borderLeft: 3,
                        borderLeftColor: enRetard(t.echeance, t.statut) ? "error.main" : terminee ? "success.main" : "secondary.main",
                        boxShadow: 1, transition: "transform .15s, box-shadow .15s",
                        "&:hover": { transform: "translateY(-2px)", boxShadow: 3 },
                      }}>
                        <BoutonAction component={RouterLink} to={lien(t)} color="inherit" variant="text"
                          endIcon={<ArrowForwardOutlined fontSize="small" />}
                          sx={{ width: "100%", justifyContent: "space-between", textAlign: "left", color: "text.primary", p: 0, minHeight: 32, mb: 1, "&:hover": { color: "primary.main", bgcolor: "transparent" } }}>
                          <Typography component="span" variant="body2" fontWeight={700}>{t.titre}</Typography>
                        </BoutonAction>
                        {!ctx && <Typography variant="caption" display="block" color="text.secondary" sx={{ mb: 0.75 }}>{trouver(t.application_id)?.nom ?? `Application #${t.application_id}`}</Typography>}
                        <Stack spacing={0.75}>
                          <Typography variant="caption" color="text.secondary">{nom(t.responsable_id)}</Typography>
                          <Stack direction="row" alignItems="center" spacing={0.5} flexWrap="wrap" useFlexGap>
                            <CalendarTodayOutlined sx={{ fontSize: 14, color: enRetard(t.echeance, t.statut) ? "error.main" : "text.secondary" }} />
                            <Typography variant="caption" color={enRetard(t.echeance, t.statut) ? "error.main" : "text.secondary"}>{date(t.echeance)}</Typography>
                            <Chip size="small" label={`Étapes ${avancement(t)}`} sx={{ ml: "auto", height: 22 }} />
                          </Stack>
                        </Stack>
                      </Paper>
                    ))}
                    {taches.length === 0 && <Typography variant="caption" color="text.secondary" sx={{ textAlign: "center", py: 2 }}>Aucune tâche</Typography>}
                  </Stack>
                </Paper>
              );
            })}
          </Box>
        )}
      </Etat>
    </>
  );
}
