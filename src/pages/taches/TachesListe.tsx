import { Box, Button, Checkbox, FormControlLabel, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import { useState } from "react";
import { Link as RouterLink } from "react-router-dom";
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
  const [vue, setVue] = useState<"liste" | "kanban">("liste");
  const [statut, setStatut] = useState("");
  const [mes, setMes] = useState(false);
  const [retard, setRetard] = useState(false);
  const { data, loading, error } = useAsync(() => listTaches({ application_id: ctx?.application.id, statut: statut || undefined, mes_taches: mes || undefined, en_retard: retard || undefined }),
    [ctx?.application.id, statut, mes, retard]);
  const lien = (t: Tache) => `/applications/${t.application_id}/taches/${t.id}`;

  return (
    <>
      <PageHeader titre="Tâches" sousTitre="Une tâche se crée à partir d'un problème (onglet « Tâches » de sa fiche)."
        actions={ctx ? <Button variant="outlined" component={RouterLink} to={`/applications/${ctx.application.id}/problemes`}>Choisir un problème</Button> : undefined} />
      <Stack direction="row" spacing={1} sx={{ mb: 2 }} alignItems="center" flexWrap="wrap" useFlexGap>
        <ToggleButtonGroup exclusive size="small" value={vue} onChange={(_, v: "liste" | "kanban" | null) => v && setVue(v)}>
          <ToggleButton value="liste">Liste</ToggleButton><ToggleButton value="kanban">Kanban</ToggleButton>
        </ToggleButtonGroup>
        <FiltreSelect label="Statut" valeur={statut} onChange={setStatut} options={options("statutTache")} largeur={150} />
        <FormControlLabel label="Mes tâches" control={<Checkbox checked={mes} onChange={(e) => setMes(e.target.checked)} />} />
        <FormControlLabel label="En retard" control={<Checkbox checked={retard} onChange={(e) => setRetard(e.target.checked)} />} />
      </Stack>
      <Etat loading={loading} error={error}>
        {vue === "liste" ? (
          <Paper sx={{ overflowX: "auto" }}>
            <Table size="small">
              <TableHead><TableRow><TableCell>Tâche</TableCell>{!ctx && <TableCell>Application</TableCell>}<TableCell>Responsable</TableCell><TableCell>Statut</TableCell><TableCell>Échéance</TableCell><TableCell>Étapes</TableCell></TableRow></TableHead>
              <TableBody>
                {(data ?? []).length === 0 && <TableRow><TableCell colSpan={6}><Typography color="text.secondary">Aucune tâche.</Typography></TableCell></TableRow>}
                {(data ?? []).map((t) => (
                  <TableRow key={t.id} hover>
                    <TableCell><RouterLink to={lien(t)}>{t.titre}</RouterLink></TableCell>
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
          <Box sx={{ display: "flex", gap: 1.5, overflowX: "auto", pb: 1 }}>
            {COLONNES.map((c) => {
              const taches = (data ?? []).filter((t) => t.statut === c);
              return (
                <Paper key={c} sx={{ minWidth: 230, flex: 1, p: 1, bgcolor: "action.hover" }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>{libelle("statutTache", c)} · {taches.length}</Typography>
                  <Stack spacing={1}>
                    {taches.map((t) => (
                      <Paper key={t.id} sx={{ p: 1, borderColor: enRetard(t.echeance, t.statut) ? "error.main" : undefined }}>
                        <RouterLink to={lien(t)}>{t.titre}</RouterLink>
                        <Typography variant="caption" display="block" color="text.secondary">{nom(t.responsable_id)} · {date(t.echeance)} · {avancement(t)}</Typography>
                      </Paper>
                    ))}
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
