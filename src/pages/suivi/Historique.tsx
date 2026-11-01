import { Alert, Collapse, IconButton, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from "@mui/material";
import ExpandMore from "@mui/icons-material/ExpandMore";
import { Fragment, useState } from "react";
import { historique } from "../../api/suivi";
import Etat from "../../components/Etat";
import FiltreSelect from "../../components/FiltreSelect";
import PageHeader from "../../components/PageHeader";
import { useApplicationOptionnelle } from "../../context/ApplicationContext";
import { useAnnuaire } from "../../context/AnnuaireContext";
import { useApplications } from "../../context/ApplicationsContext";
import { useAsync } from "../../hooks/useAsync";
import { dateHeure } from "../../utils/format";

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
      <Alert severity="info" sx={{ mb: 2 }}>Aucune ligne ne peut être modifiée ni supprimée. Le contenu des notes et messages supprimés y reste conservé.</Alert>
      <Stack direction="row" spacing={1} sx={{ mb: 2 }} flexWrap="wrap" useFlexGap>
        <FiltreSelect label="Élément" valeur={type} onChange={setType} options={TYPES.map((t) => ({ valeur: t, libelle: t.replace(/_/g, " ") }))} />
        <FiltreSelect label="Auteur" valeur={auteur} onChange={setAuteur} options={personnes.map((p) => ({ valeur: String(p.id), libelle: p.identifiant }))} />
        <TextField size="small" label="Action" value={action} onChange={(e) => setAction(e.target.value.trim())} />
        <FiltreSelect label="Période" valeur={jours} onChange={setJours} options={[{ valeur: "7", libelle: "7 jours" }, { valeur: "30", libelle: "30 jours" }, { valeur: "90", libelle: "90 jours" }, { valeur: "365", libelle: "1 an" }]} largeur={140} />
      </Stack>
      <Etat loading={loading} error={error}>
        <Paper sx={{ overflowX: "auto" }}>
          <Table size="small">
            <TableHead><TableRow><TableCell /><TableCell>Date</TableCell><TableCell>Auteur</TableCell>{!ctx && <TableCell>Application</TableCell>}<TableCell>Élément</TableCell><TableCell>Action</TableCell></TableRow></TableHead>
            <TableBody>
              {(data ?? []).length === 0 && <TableRow><TableCell colSpan={6}><Typography color="text.secondary">Aucun événement.</Typography></TableCell></TableRow>}
              {(data ?? []).map((e) => (
                <Fragment key={e.id}>
                  <TableRow hover onClick={() => setOuvert(ouvert === e.id ? null : e.id)} sx={{ cursor: "pointer" }}>
                    <TableCell padding="checkbox"><IconButton size="small" aria-label="Détail"><ExpandMore fontSize="small" sx={{ transform: ouvert === e.id ? "rotate(180deg)" : "none" }} /></IconButton></TableCell>
                    <TableCell>{dateHeure(e.cree_le)}</TableCell>
                    <TableCell>{e.auteur_id ? nom(e.auteur_id) : "Système"}</TableCell>
                    {!ctx && <TableCell>{e.application_id ? trouver(e.application_id)?.nom ?? `#${e.application_id}` : "—"}</TableCell>}
                    <TableCell>{e.type_element.replace(/_/g, " ")} n°{e.element_id}</TableCell>
                    <TableCell>{e.action.replace(/_/g, " ")}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={6} sx={{ py: 0, border: ouvert === e.id ? undefined : 0 }}>
                      <Collapse in={ouvert === e.id} unmountOnExit>
                        <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ py: 1 }}>
                          <div><Typography variant="caption" color="text.secondary">Ancienne valeur</Typography><pre style={{ margin: 0, fontSize: 12 }}>{json(e.ancienne_valeur)}</pre></div>
                          <div><Typography variant="caption" color="text.secondary">Nouvelle valeur</Typography><pre style={{ margin: 0, fontSize: 12 }}>{json(e.nouvelle_valeur)}</pre></div>
                          {e.commentaire && <div><Typography variant="caption" color="text.secondary">Commentaire</Typography><Typography variant="body2">{e.commentaire}</Typography></div>}
                        </Stack>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </Fragment>
              ))}
            </TableBody>
          </Table>
        </Paper>
      </Etat>
    </>
  );
}
