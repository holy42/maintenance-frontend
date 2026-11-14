import ChampTexte from "../../components/ChampTexte";
import { Alert, Box, Chip, Collapse, ListItemButton, Paper, Stack, Typography } from "@mui/material";
import ExpandMore from "@mui/icons-material/ExpandMore";
import HistoryOutlined from "@mui/icons-material/HistoryOutlined";
import { useState } from "react";
import { historique } from "../../api/suivi";
import Etat from "../../components/Etat";
import EvenementIcone from "../../components/EvenementIcone";
import FiltreSelect from "../../components/FiltreSelect";
import PageHeader from "../../components/PageHeader";
import { useApplicationOptionnelle } from "../../context/ApplicationContext";
import { useAnnuaire } from "../../context/AnnuaireContext";
import { useApplications } from "../../context/ApplicationsContext";
import { useAsync } from "../../hooks/useAsync";
import { dateHeure } from "../../utils/format";
import { couleurEvenement, libelleEvenement } from "../../utils/libelles";

const TYPES = ["probleme", "tache", "sous_tache", "critere", "verification", "resultat", "solution", "note", "message", "salon", "session_test", "test", "application", "depot", "equipe", "role", "utilisateur"];

/** Journal de TOUTES les activités, quel que soit l'auteur. Lecture seule : aucune ligne ne peut être modifiée ni supprimée. */
export default function Historique() {
  const ctx = useApplicationOptionnelle();
  const { personnes, nom } = useAnnuaire();
  const { trouver } = useApplications();
  const [type, setType] = useState("");
  const [auteur, setAuteur] = useState("");
  const [action, setAction] = useState("");
  const [jours, setJours] = useState("30");
  const [ouvert, setOuvert] = useState<number | null>(null);
  const { data, loading, error } = useAsync(() => historique({
    application_id: ctx?.application.id, type_element: type || undefined, auteur_id: auteur ? Number(auteur) : undefined, action: action || undefined,
    jours: jours ? Number(jours) : undefined, limit: 300 }), [ctx?.application.id, type, auteur, action, jours]);
  const json = (v: Record<string, unknown> | null) => (v ? JSON.stringify(v, null, 1) : "—");

  return (
    <>
      <PageHeader titre="Historique" sousTitre="Journal en ajout seul : toutes les activités de l'application, quel que soit l'auteur." />
      <Box sx={{ p: { xs: 1.5, md: 2 }, mb: 2 }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={1.25} alignItems={{ md: "center" }} flexWrap="wrap" useFlexGap>
          <FiltreSelect label="Élément" valeur={type} onChange={setType} options={TYPES.map((t) => ({ valeur: t, libelle: t.replace(/_/g, " ") }))} />
          <FiltreSelect label="Auteur" valeur={auteur} onChange={setAuteur} options={personnes.map((p) => ({ valeur: String(p.id), libelle: p.identifiant }))} />
          <ChampTexte label="Action" value={action} onChange={(e) => setAction(e.target.value.trim())} sx={{ flex: "1 1 180px" }} />
          <FiltreSelect label="Période" valeur={jours} onChange={setJours} options={[{ valeur: "7", libelle: "7 jours" }, { valeur: "30", libelle: "30 jours" }, { valeur: "90", libelle: "90 jours" }, { valeur: "365", libelle: "1 an" }]} largeur={140} />
        </Stack>
      </Box>
      <Etat loading={loading} error={error}>
        <Stack spacing={1.25}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="subtitle2" color="text.secondary">JOURNAL DES ACTIVITÉS</Typography>
            <Chip size="small" label={`${(data ?? []).length} événement(s)`} color="secondary" variant="outlined" />
          </Stack>
          {(data ?? []).length === 0 && (
            <Paper sx={{ p: 4, textAlign: "center", bgcolor: "rgba(66, 153, 224, 0.035)" }}>
              <HistoryOutlined color="disabled" sx={{ fontSize: 36, mb: 1 }} />
              <Typography fontWeight={600}>Aucun événement pour cette période</Typography>
              <Typography variant="body2" color="text.secondary">Essayez d’élargir la période ou d’ajuster les filtres.</Typography>
            </Paper>
          )}
          {(data ?? []).map((e) => {
            const ton = couleurEvenement(e.action);
            const estOuvert = ouvert === e.id;
            return (
              <Paper key={e.id} sx={{ overflow: "hidden", borderColor: estOuvert ? "secondary.light" : "divider" }}>
                <ListItemButton onClick={() => setOuvert(estOuvert ? null : e.id)} aria-expanded={estOuvert}
                  sx={{ p: { xs: 1.5, sm: 2 }, alignItems: "flex-start", gap: 1.5 }}>
                  <EvenementIcone type={e.type_element} action={e.action} />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} spacing={0.75}>
                      <Typography variant="subtitle2" fontWeight={700}>{libelleEvenement(e.action)}</Typography>
                      <Chip size="small" color={ton} variant="outlined" label={e.type_element.replace(/_/g, " ")} />
                    </Stack>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      {dateHeure(e.cree_le)} · {e.auteur_id ? nom(e.auteur_id) : "Système"}
                      {!ctx && e.application_id ? ` · ${trouver(e.application_id)?.nom ?? `#${e.application_id}`}` : ""}
                      {` · ${e.type_element.replace(/_/g, " ")} n°${e.element_id}`}
                    </Typography>
                  </Box>
                  <ExpandMore fontSize="small" sx={{ mt: 1, color: "text.secondary", transform: estOuvert ? "rotate(180deg)" : "none", transition: "transform .2s" }} />
                </ListItemButton>
                <Collapse in={estOuvert} unmountOnExit>
                  <Box sx={{ px: { xs: 1.5, sm: 2 }, pb: 2, pt: 0 }}>
                    <Stack direction={{ xs: "column", md: "row" }} spacing={1.25}>
                      {[
                        ["Ancienne valeur", json(e.ancienne_valeur)],
                        ["Nouvelle valeur", json(e.nouvelle_valeur)],
                      ].map(([titre, valeur]) => (
                        <Paper key={titre} sx={{ p: 1.5, flex: 1, minWidth: 0, bgcolor: "rgba(66, 153, 224, 0.045)" }}>
                          <Typography variant="caption" color="text.secondary" fontWeight={700}>{titre}</Typography>
                          <Box component="pre" sx={{ m: 0, mt: 0.5, fontSize: 12, whiteSpace: "pre-wrap", overflowWrap: "anywhere", color: "text.primary" }}>{valeur}</Box>
                        </Paper>
                      ))}
                      {e.commentaire && (
                        <Paper sx={{ p: 1.5, flex: 1, minWidth: 0, bgcolor: "rgba(66, 153, 224, 0.045)" }}>
                          <Typography variant="caption" color="text.secondary" fontWeight={700}>Commentaire</Typography>
                          <Typography variant="body2" sx={{ mt: 0.5, overflowWrap: "anywhere" }}>{e.commentaire}</Typography>
                        </Paper>
                      )}
                    </Stack>
                  </Box>
                </Collapse>
              </Paper>
            );
          })}
        </Stack>
      </Etat>
    </>
  );
}
