import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { Link as RouterLink, useNavigate, useSearchParams } from "react-router-dom";
import { membresApplication } from "../../api/applications";
import { messageErreur } from "../../api/client";
import { creerProbleme, listProblemes } from "../../api/problemes";
import type { Categorie, Gravite, Priorite } from "../../api/types";
import ChampSelect from "../../components/ChampSelect";
import Etat from "../../components/Etat";
import FiltreSelect from "../../components/FiltreSelect";
import PageHeader from "../../components/PageHeader";
import StatutChip from "../../components/StatutChip";
import { useApplicationOptionnelle } from "../../context/ApplicationContext";
import { useAnnuaire } from "../../context/AnnuaireContext";
import { useApplications } from "../../context/ApplicationsContext";
import { useNotifier } from "../../context/SnackbarContext";
import { useAsync } from "../../hooks/useAsync";
import { libelle, options } from "../../utils/libelles";
import { PERM } from "../../utils/permissions";

/** Liste des problèmes : d'une application (espace de l'application) ou de toutes (menu global, origine conservée). */
export default function ProblemesListe() {
  const ctx = useApplicationOptionnelle();
  const { trouver } = useApplications();
  const { nom } = useAnnuaire();
  const notifier = useNotifier();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [saisie, setSaisie] = useState(params.get("recherche") ?? "");
  const [recherche, setRecherche] = useState(saisie);
  const [categorie, setCategorie] = useState("");
  const [gravite, setGravite] = useState("");
  const [priorite, setPriorite] = useState("");
  const [statut, setStatut] = useState("");
  const [creation, setCreation] = useState(false);
  const [form, setForm] = useState({ titre: "", categorie: "fonctionnel", gravite: "", priorite: "", description: "", attendu: "", observe: "", responsable: "", echeance: "" });
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => { const t = window.setTimeout(() => setRecherche(saisie), 400); return () => window.clearTimeout(t); }, [saisie]);
  useEffect(() => { setSaisie(params.get("recherche") ?? ""); }, [params]);

  const { data, loading, error } = useAsync(() => listProblemes({
    application_id: ctx?.application.id, categorie: categorie || undefined, gravite: gravite || undefined,
    priorite: priorite || undefined, statut: statut || undefined, recherche: recherche || undefined, limit: 200,
  }), [ctx?.application.id, categorie, gravite, priorite, statut, recherche]);
  const { data: membres } = useAsync(() => (ctx ? membresApplication(ctx.application.id) : Promise.resolve([])), [ctx?.application.id]);

  async function creer() {
    if (!ctx) return;
    if (!form.titre.trim()) { setErreur("Le titre est obligatoire."); return; }
    try {
      const p = await creerProbleme(ctx.application.id, {
        titre: form.titre.trim(), categorie: form.categorie as Categorie, description: form.description || undefined,
        comportement_attendu: form.attendu || undefined, comportement_observe: form.observe || undefined,
        gravite: (form.gravite || undefined) as Gravite | undefined, priorite: (form.priorite || undefined) as Priorite | undefined,
        responsable_id: form.responsable ? Number(form.responsable) : undefined, echeance: form.echeance || undefined,
      });
      notifier(`Problème ${p.code} créé.`); setCreation(false); navigate(`/applications/${ctx.application.id}/problemes/${p.id}`);
    } catch (e) { setErreur(messageErreur(e)); }
  }

  return (
    <>
      <PageHeader titre="Problèmes"
        actions={ctx && ctx.peut(PERM.PROBLEME_MODIFIER) && !ctx.archivee ? <Button variant="contained" onClick={() => setCreation(true)}>Nouveau problème</Button> : undefined} />
      <Stack direction="row" spacing={1} sx={{ mb: 2 }} flexWrap="wrap" useFlexGap>
        <TextField size="small" label="Code ou titre" value={saisie} onChange={(e) => setSaisie(e.target.value)} />
        <FiltreSelect label="Catégorie" valeur={categorie} onChange={setCategorie} options={options("categorie")} />
        <FiltreSelect label="Gravité" valeur={gravite} onChange={setGravite} options={options("gravite")} largeur={140} />
        <FiltreSelect label="Priorité" valeur={priorite} onChange={setPriorite} options={options("priorite")} largeur={140} />
        <FiltreSelect label="Statut" valeur={statut} onChange={setStatut} options={options("statutProbleme")} largeur={150} />
      </Stack>
      <Etat loading={loading} error={error}>
        <Paper sx={{ overflowX: "auto" }}>
          <Table size="small">
            <TableHead><TableRow>
              <TableCell>Code</TableCell><TableCell>Titre</TableCell>{!ctx && <TableCell>Application</TableCell>}
              <TableCell>Catégorie</TableCell><TableCell>Gravité</TableCell><TableCell>Statut</TableCell><TableCell>Responsable</TableCell>
            </TableRow></TableHead>
            <TableBody>
              {(data ?? []).length === 0 && <TableRow><TableCell colSpan={7}><Typography color="text.secondary">Aucun problème.</Typography></TableCell></TableRow>}
              {(data ?? []).map((p) => (
                <TableRow key={p.id} hover>
                  <TableCell>{p.code}</TableCell>
                  <TableCell><RouterLink to={`/applications/${p.application_id}/problemes/${p.id}`}>{p.titre}</RouterLink></TableCell>
                  {!ctx && <TableCell>{trouver(p.application_id)?.nom ?? `#${p.application_id}`}</TableCell>}
                  <TableCell>{libelle("categorie", p.categorie)}</TableCell>
                  <TableCell><StatutChip groupe="gravite" valeur={p.gravite} /></TableCell>
                  <TableCell><StatutChip groupe="statutProbleme" valeur={p.statut} /></TableCell>
                  <TableCell>{nom(p.responsable_id)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      </Etat>

      <Dialog open={creation} onClose={() => setCreation(false)} fullWidth maxWidth="sm">
        <DialogTitle>Nouveau problème</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField size="small" label="Titre" value={form.titre} onChange={(e) => setForm({ ...form, titre: e.target.value })} error={Boolean(erreur)} helperText={erreur ?? undefined} />
            <Stack direction="row" spacing={1}>
              <ChampSelect label="Catégorie" valeur={form.categorie} onChange={(v) => setForm({ ...form, categorie: v })} options={options("categorie")} />
              <ChampSelect label="Gravité" valeur={form.gravite} onChange={(v) => setForm({ ...form, gravite: v })} vide="—" options={options("gravite")} />
              <ChampSelect label="Priorité" valeur={form.priorite} onChange={(v) => setForm({ ...form, priorite: v })} vide="—" options={options("priorite")} />
            </Stack>
            <TextField size="small" label="Description" multiline minRows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <TextField size="small" label="Comportement attendu" value={form.attendu} onChange={(e) => setForm({ ...form, attendu: e.target.value })} />
            <TextField size="small" label="Comportement observé" value={form.observe} onChange={(e) => setForm({ ...form, observe: e.target.value })} />
            <Stack direction="row" spacing={1}>
              <ChampSelect label="Responsable" valeur={form.responsable} onChange={(v) => setForm({ ...form, responsable: v })} vide="Aucun" options={(membres ?? []).map((m) => ({ valeur: String(m.utilisateur_id), libelle: m.identifiant }))} />
              <TextField size="small" type="date" label="Échéance" InputLabelProps={{ shrink: true }} fullWidth value={form.echeance} onChange={(e) => setForm({ ...form, echeance: e.target.value })} />
            </Stack>
            <Typography variant="caption" color="text.secondary">Création manuelle : le problème a la source « humain » et aucun résultat d'analyse d'origine.</Typography>
          </Stack>
        </DialogContent>
        <DialogActions><Button onClick={() => setCreation(false)}>Annuler</Button><Button variant="contained" onClick={creer}>Créer</Button></DialogActions>
      </Dialog>
    </>
  );
}
