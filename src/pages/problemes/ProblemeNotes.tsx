import DeleteOutline from "@mui/icons-material/DeleteOutline";
import EditOutlined from "@mui/icons-material/EditOutlined";
import { Button, Chip, IconButton, Paper, Stack, TextField, Typography } from "@mui/material";
import { useState } from "react";
import { messageErreur } from "../../api/client";
import { ajouterNoteProbleme, modifierNote, notesProbleme, supprimerNote } from "../../api/collaboration";
import ChampSelect from "../../components/ChampSelect";
import Etat from "../../components/Etat";
import { useApplication } from "../../context/ApplicationContext";
import { useAnnuaire } from "../../context/AnnuaireContext";
import { useAuth } from "../../context/AuthContext";
import { useProbleme } from "../../context/ProblemeContext";
import { useNotifier } from "../../context/SnackbarContext";
import { useAsync } from "../../hooks/useAsync";
import { dateHeure } from "../../utils/format";
import { libelle, options } from "../../utils/libelles";
import { PERM } from "../../utils/permissions";

/** Notes internes et commentaires de correction. Seul l'auteur modifie ou supprime sa note (suppression logique). */
export default function ProblemeNotes() {
  const { peut, archivee } = useApplication();
  const { probleme } = useProbleme();
  const { user } = useAuth();
  const { nom } = useAnnuaire();
  const notifier = useNotifier();
  const { data, loading, error, reload } = useAsync(() => notesProbleme(probleme.id), [probleme.id]);
  const [contenu, setContenu] = useState("");
  const [type, setType] = useState("note_interne");
  const [edition, setEdition] = useState<{ id: number; texte: string } | null>(null);
  const peutEcrire = peut(PERM.DISCUSSION_PARTICIPER) && !archivee;

  async function agir(fn: () => Promise<unknown>) {
    try { await fn(); reload(); } catch (e) { notifier(messageErreur(e), "error"); }
  }

  return (
    <Etat loading={loading} error={error}>
      <Stack spacing={2}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>Ajouter une note</Typography>
          <TextField multiline minRows={3} fullWidth size="small" placeholder="Votre note" value={contenu} onChange={(e) => setContenu(e.target.value)} disabled={!peutEcrire} />
          <Stack direction="row" justifyContent="space-between" sx={{ mt: 1 }}>
            <ChampSelect fullWidth={false} label="Type" valeur={type} onChange={setType} options={options("typeNote")} disabled={!peutEcrire} />
            <Button variant="contained" disabled={!peutEcrire || !contenu.trim()}
              onClick={() => agir(async () => { await ajouterNoteProbleme(probleme.id, contenu.trim(), type); setContenu(""); })}>Ajouter la note</Button>
          </Stack>
        </Paper>
        {(data ?? []).slice().reverse().map((n) => (
          <Paper key={n.id} sx={{ p: 2, opacity: n.supprime_le ? 0.65 : 1 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="body2"><strong>{nom(n.auteur_id)}</strong> · {dateHeure(n.cree_le)}{n.modifie_le ? ` · modifiée le ${dateHeure(n.modifie_le)}` : ""}</Typography>
              <Chip size="small" variant="outlined" label={libelle("typeNote", n.type)} />
            </Stack>
            {n.supprime_le ? (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Note supprimée par son auteur le {dateHeure(n.supprime_le)} (son contenu reste conservé dans l'historique).</Typography>
            ) : edition?.id === n.id ? (
              <Stack spacing={1} sx={{ mt: 1 }}>
                <TextField multiline size="small" value={edition.texte} onChange={(e) => setEdition({ id: n.id, texte: e.target.value })} />
                <Stack direction="row" spacing={1}>
                  <Button size="small" variant="contained" onClick={() => agir(async () => { await modifierNote(n.id, edition.texte); setEdition(null); })}>Enregistrer</Button>
                  <Button size="small" onClick={() => setEdition(null)}>Annuler</Button>
                </Stack>
              </Stack>
            ) : (
              <>
                <Typography variant="body2" sx={{ mt: 1, whiteSpace: "pre-wrap" }}>{n.contenu}</Typography>
                {n.auteur_id === user?.id && !archivee && (
                  <Stack direction="row" sx={{ mt: 0.5 }}>
                    <IconButton size="small" onClick={() => setEdition({ id: n.id, texte: n.contenu })} aria-label="Modifier"><EditOutlined fontSize="small" /></IconButton>
                    <IconButton size="small" onClick={() => agir(() => supprimerNote(n.id))} aria-label="Supprimer"><DeleteOutline fontSize="small" /></IconButton>
                  </Stack>
                )}
              </>
            )}
          </Paper>
        ))}
      </Stack>
    </Etat>
  );
}
