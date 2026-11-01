import { Box, Button, Paper, Stack, TextField, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { archiverApplication, membresApplication, modifierApplication } from "../../api/applications";
import { messageErreur } from "../../api/client";
import ChampSelect from "../../components/ChampSelect";
import ConfirmDialog from "../../components/ConfirmDialog";
import { useApplication } from "../../context/ApplicationContext";
import { useNotifier } from "../../context/SnackbarContext";
import { useAsync } from "../../hooks/useAsync";
import { liste } from "../../utils/format";
import { PERM } from "../../utils/permissions";

export default function Parametres() {
  const { application, peut, archivee, recharger } = useApplication();
  const navigate = useNavigate();
  const notifier = useNotifier();
  const { data: membres } = useAsync(() => membresApplication(application.id), [application.id]);
  const [nom, setNom] = useState(application.nom);
  const [description, setDescription] = useState(application.description ?? "");
  const [responsable, setResponsable] = useState(application.responsable_id ? String(application.responsable_id) : "");
  const [technologies, setTechnologies] = useState(application.technologies.join(", "));
  const [confirmation, setConfirmation] = useState(false);
  const modifiable = peut(PERM.APPLICATION_CONFIGURER) && !archivee;

  useEffect(() => {
    setNom(application.nom); setDescription(application.description ?? "");
    setResponsable(application.responsable_id ? String(application.responsable_id) : ""); setTechnologies(application.technologies.join(", "));
  }, [application]);

  async function enregistrer() {
    try {
      await modifierApplication(application.id, { nom, description, responsable_id: responsable ? Number(responsable) : null, technologies: liste(technologies) });
      notifier("Paramètres enregistrés."); recharger();
    } catch (e) { notifier(messageErreur(e), "error"); }
  }

  async function archiver() {
    try { await archiverApplication(application.id); notifier("Application archivée."); recharger(); navigate("/applications"); }
    catch (e) { notifier(messageErreur(e), "error"); }
  }

  return (
    <Stack spacing={2} sx={{ maxWidth: 760 }}>
      <Paper sx={{ p: 2 }}>
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>Informations générales</Typography>
        <Stack spacing={2}>
          <TextField size="small" label="Nom" value={nom} onChange={(e) => setNom(e.target.value)} disabled={!modifiable} />
          <TextField size="small" label="Description" multiline minRows={2} value={description} onChange={(e) => setDescription(e.target.value)} disabled={!modifiable} />
          <ChampSelect label="Responsable" valeur={responsable} onChange={setResponsable} vide="Aucun" disabled={!modifiable}
            options={(membres ?? []).map((m) => ({ valeur: String(m.utilisateur_id), libelle: m.identifiant }))} />
          <TextField size="small" label="Technologies (séparées par des virgules)" value={technologies} onChange={(e) => setTechnologies(e.target.value)} disabled={!modifiable}
            helperText="Elles déterminent les outils d'analyse utilisables (ex. php)." />
          <Box><Button variant="contained" onClick={enregistrer} disabled={!modifiable || !nom.trim()}>Enregistrer les paramètres</Button></Box>
        </Stack>
      </Paper>
      <Paper sx={{ p: 2, borderColor: "error.main" }}>
        <Typography variant="subtitle1" fontWeight={600} color="error">Zone sensible</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ my: 1 }}>
          Archiver rend l'application consultable en lecture seule. L'historique est conservé et ne peut pas être supprimé : il n'existe pas de suppression d'application.
        </Typography>
        <Button color="error" variant="outlined" disabled={!modifiable} onClick={() => setConfirmation(true)}>Archiver l'application</Button>
      </Paper>
      <ConfirmDialog ouvert={confirmation} titre="Archiver l'application ?" texte="Elle passera en lecture seule. Vous pourrez la restaurer depuis la gestion des applications." confirmer="Archiver" onConfirm={archiver} onClose={() => setConfirmation(false)} />
    </Stack>
  );
}
