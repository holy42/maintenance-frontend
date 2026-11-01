import ArchiveOutlined from "@mui/icons-material/ArchiveOutlined";
import EditOutlined from "@mui/icons-material/EditOutlined";
import OpenInNewOutlined from "@mui/icons-material/OpenInNewOutlined";
import UnarchiveOutlined from "@mui/icons-material/UnarchiveOutlined";
import {
  Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Paper, Stack, Table, TableBody, TableCell, TableHead,
  TableRow, TextField, Tooltip, Typography,
} from "@mui/material";
import { useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { archiverApplication, creerApplication, modifierApplication, restaurerApplication } from "../../api/applications";
import { messageErreur } from "../../api/client";
import type { Application } from "../../api/types";
import ChampSelect from "../../components/ChampSelect";
import FiltreSelect from "../../components/FiltreSelect";
import PageHeader from "../../components/PageHeader";
import StatutChip from "../../components/StatutChip";
import { useApplications } from "../../context/ApplicationsContext";
import { useAnnuaire } from "../../context/AnnuaireContext";
import { useEquipe } from "../../context/EquipeContext";
import { useNotifier } from "../../context/SnackbarContext";
import { liste } from "../../utils/format";
import { options } from "../../utils/libelles";

/** Gestion des applications : liste, recherche, création, modification, archivage. */
export default function ApplicationsGestion() {
  const notifier = useNotifier();
  const { applications, recharger } = useApplications();
  const { equipes, equipeId } = useEquipe();
  const { nom } = useAnnuaire();
  const [recherche, setRecherche] = useState("");
  const [statut, setStatut] = useState("");
  const [dialogue, setDialogue] = useState<{ edition: Application | null } | null>(null);
  const [form, setForm] = useState({ nom: "", description: "", equipe: "", technologies: "" });

  const visibles = applications.filter((a) =>
    (equipeId === null || a.equipe_id === equipeId) && (!statut || a.statut === statut) &&
    (!recherche || a.nom.toLowerCase().includes(recherche.toLowerCase())));

  function ouvrir(a: Application | null) {
    setForm(a ? { nom: a.nom, description: a.description ?? "", equipe: String(a.equipe_id), technologies: a.technologies.join(", ") }
              : { nom: "", description: "", equipe: equipeId ? String(equipeId) : "", technologies: "php" });
    setDialogue({ edition: a });
  }

  async function enregistrer() {
    try {
      if (dialogue?.edition) await modifierApplication(dialogue.edition.id, { nom: form.nom, description: form.description, technologies: liste(form.technologies) });
      else await creerApplication({ equipe_id: Number(form.equipe), nom: form.nom, description: form.description || undefined, technologies: liste(form.technologies) });
      setDialogue(null); notifier("Application enregistrée."); recharger();
    } catch (e) { notifier(messageErreur(e), "error"); }
  }

  async function changerStatut(a: Application) {
    try { await (a.statut === "archivee" ? restaurerApplication(a.id) : archiverApplication(a.id)); notifier(a.statut === "archivee" ? "Application restaurée." : "Application archivée."); recharger(); }
    catch (e) { notifier(messageErreur(e), "error"); }
  }

  return (
    <>
      <PageHeader titre="Gestion des applications" fil={[{ libelle: "Applications" }, { libelle: "Gestion des applications" }]}
        actions={<Button variant="contained" onClick={() => ouvrir(null)}>Nouvelle application</Button>} />
      <Stack direction="row" spacing={1} sx={{ mb: 2 }} flexWrap="wrap" useFlexGap>
        <TextField size="small" label="Rechercher" value={recherche} onChange={(e) => setRecherche(e.target.value)} />
        <FiltreSelect label="Statut" valeur={statut} onChange={setStatut} options={options("statutApplication")} />
      </Stack>
      <Paper sx={{ overflowX: "auto" }}>
        <Table size="small">
          <TableHead><TableRow><TableCell>Application</TableCell><TableCell>Statut</TableCell><TableCell>Responsable</TableCell><TableCell align="right">Actions</TableCell></TableRow></TableHead>
          <TableBody>
            {visibles.length === 0 && <TableRow><TableCell colSpan={4}><Typography color="text.secondary">Aucune application.</Typography></TableCell></TableRow>}
            {visibles.map((a) => (
              <TableRow key={a.id} hover sx={{ opacity: a.statut === "archivee" ? 0.65 : 1 }}>
                <TableCell>
                  {a.nom}
                  <Stack direction="row" spacing={0.5} sx={{ mt: 0.5 }}>{a.technologies.map((t) => <Chip key={t} size="small" variant="outlined" label={t} />)}</Stack>
                </TableCell>
                <TableCell><StatutChip groupe="statutApplication" valeur={a.statut} /></TableCell>
                <TableCell>{nom(a.responsable_id)}</TableCell>
                <TableCell align="right">
                  <Tooltip title="Ouvrir l'espace"><IconButton component={RouterLink} to={`/applications/${a.id}`} aria-label="Ouvrir l'espace"><OpenInNewOutlined /></IconButton></Tooltip>
                  <Tooltip title="Modifier"><span><IconButton onClick={() => ouvrir(a)} disabled={a.statut === "archivee"} aria-label="Modifier"><EditOutlined /></IconButton></span></Tooltip>
                  <Tooltip title={a.statut === "archivee" ? "Restaurer" : "Archiver"}>
                    <IconButton onClick={() => changerStatut(a)} aria-label={a.statut === "archivee" ? "Restaurer" : "Archiver"}>{a.statut === "archivee" ? <UnarchiveOutlined /> : <ArchiveOutlined />}</IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      <Dialog open={dialogue !== null} onClose={() => setDialogue(null)} fullWidth maxWidth="sm">
        <DialogTitle>{dialogue?.edition ? "Modifier l'application" : "Nouvelle application"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField size="small" label="Nom" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} />
            <TextField size="small" label="Description" multiline minRows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            {!dialogue?.edition && <ChampSelect label="Équipe propriétaire" valeur={form.equipe} onChange={(v) => setForm({ ...form, equipe: v })} options={equipes.map((e) => ({ valeur: String(e.id), libelle: e.nom }))} />}
            <TextField size="small" label="Technologies (séparées par des virgules)" helperText="Elles déterminent les outils d'analyse utilisables, ex. php" value={form.technologies} onChange={(e) => setForm({ ...form, technologies: e.target.value })} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogue(null)}>Annuler</Button>
          <Button variant="contained" disabled={!form.nom.trim() || (!dialogue?.edition && !form.equipe)} onClick={enregistrer}>Enregistrer</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
