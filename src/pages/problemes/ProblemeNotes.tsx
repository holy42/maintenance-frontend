import BoutonAction from "../../components/BoutonAction";
import ChampTexte from "../../components/ChampTexte";
import DeleteOutline from "@mui/icons-material/DeleteOutline";
import EditOutlined from "@mui/icons-material/EditOutlined";
import StickyNote2Outlined from "@mui/icons-material/StickyNote2Outlined";
import { alpha } from "@mui/material/styles";
import { Chip, IconButton, Paper, Stack, Typography } from "@mui/material";
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
      <Stack spacing={1.5} sx={{ maxWidth: 960, width: "100%", mx: "auto" }}>
        <Paper sx={{ p: { xs: 1.75, sm: 2.5 }, borderRadius: 2.5, borderColor: "white", }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
            <Typography variant="subtitle1" fontWeight={700}>Ajouter une note</Typography>
          </Stack>
          <ChampTexte multiline minRows={3} fullWidth size="small" placeholder="Votre note" value={contenu} onChange={(e) => setContenu(e.target.value)} disabled={!peutEcrire} />
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ xs: "stretch", sm: "center" }} justifyContent="space-between" sx={{ mt: 1.25 }}>
            <ChampSelect fullWidth label="Type" valeur={type} onChange={setType} options={options("typeNote")} disabled={!peutEcrire} />
            <BoutonAction variant="contained" sx={{ flexShrink: 0 }} disabled={!peutEcrire || !contenu.trim()}
              onClick={() => agir(async () => { await ajouterNoteProbleme(probleme.id, contenu.trim(), type); setContenu(""); })}>Ajouter la note</BoutonAction>
          </Stack>
        </Paper>
        {(data ?? []).slice().reverse().map((n) => (
          <Paper key={n.id} sx={{
            p: { xs: 1.5, sm: 2 }, borderRadius: 2, borderColor: "divider", opacity: n.supprime_le ? 0.65 : 1,
            borderLeft: 3, borderLeftColor: (theme) => alpha(theme.palette.secondary.main, 0.7),
          }}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }}>
              <Typography variant="body2" sx={{ overflowWrap: "anywhere" }}><strong>{nom(n.auteur_id)}</strong> · {dateHeure(n.cree_le)}{n.modifie_le ? ` · modifiée le ${dateHeure(n.modifie_le)}` : ""}</Typography>
              <Chip size="small" variant="outlined" label={libelle("typeNote", n.type)} />
            </Stack>
            {n.supprime_le ? (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Note supprimée par son auteur le {dateHeure(n.supprime_le)} (son contenu reste conservé dans l'historique).</Typography>
            ) : edition?.id === n.id ? (
              <Stack spacing={1} sx={{ mt: 1 }}>
                <ChampTexte multiline size="small" value={edition.texte} onChange={(e) => setEdition({ id: n.id, texte: e.target.value })} />
                <Stack direction="row" spacing={1}>
                  <BoutonAction size="small" variant="contained" onClick={() => agir(async () => { await modifierNote(n.id, edition.texte); setEdition(null); })}>Enregistrer</BoutonAction>
                  <BoutonAction size="small" onClick={() => setEdition(null)}>Annuler</BoutonAction>
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
