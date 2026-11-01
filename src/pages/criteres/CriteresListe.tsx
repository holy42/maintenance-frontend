import { Button, Paper, Stack, Switch, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from "@mui/material";
import { useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { activerCritere, desactiverCritere, listCriteres, validerCritere } from "../../api/criteres";
import { messageErreur } from "../../api/client";
import Etat from "../../components/Etat";
import FiltreSelect from "../../components/FiltreSelect";
import PageHeader from "../../components/PageHeader";
import StatutChip from "../../components/StatutChip";
import { useApplication } from "../../context/ApplicationContext";
import { useAnnuaire } from "../../context/AnnuaireContext";
import { useNotifier } from "../../context/SnackbarContext";
import { useAsync } from "../../hooks/useAsync";
import { libelle, options } from "../../utils/libelles";
import { PERM } from "../../utils/permissions";

export default function CriteresListe() {
  const { application, peut, archivee } = useApplication();
  const notifier = useNotifier();
  const { nom } = useAnnuaire();
  const { data, loading, error, reload } = useAsync(() => listCriteres(application.id), [application.id]);
  const [recherche, setRecherche] = useState("");
  const [categorie, setCategorie] = useState("");
  const [origine, setOrigine] = useState("");
  const gerer = peut(PERM.CRITERE_GERER) && !archivee;

  const visibles = (data ?? []).filter((c) => (!categorie || c.categorie === categorie) && (!origine || c.origine === origine) &&
    (!recherche || c.nom.toLowerCase().includes(recherche.toLowerCase())));

  async function agir(fn: () => Promise<unknown>) {
    try { await fn(); reload(); } catch (e) { notifier(messageErreur(e), "error"); }
  }

  return (
    <>
      <PageHeader titre="Critères de vérification" sousTitre="Un critère personnalisé doit être validé avant d'être activé ; un brouillon n'est jamais appliqué."
        actions={gerer ? <Button variant="contained" component={RouterLink} to={`/applications/${application.id}/criteres/nouveau`}>Nouveau critère</Button> : undefined} />
      <Stack direction="row" spacing={1} sx={{ mb: 2 }} flexWrap="wrap" useFlexGap>
        <TextField size="small" label="Rechercher" value={recherche} onChange={(e) => setRecherche(e.target.value)} />
        <FiltreSelect label="Catégorie" valeur={categorie} onChange={setCategorie} options={options("categorie")} />
        <FiltreSelect label="Origine" valeur={origine} onChange={setOrigine} options={[{ valeur: "standard", libelle: "Standard" }, { valeur: "personnalisee", libelle: "Personnalisée" }]} />
      </Stack>
      <Etat loading={loading} error={error}>
        <Paper sx={{ overflowX: "auto" }}>
          <Table size="small">
            <TableHead><TableRow><TableCell>Critère</TableCell><TableCell>Catégorie</TableCell><TableCell>Vérifiabilité</TableCell><TableCell>Mode</TableCell><TableCell>Statut</TableCell><TableCell align="right">Activation</TableCell></TableRow></TableHead>
            <TableBody>
              {visibles.length === 0 && <TableRow><TableCell colSpan={6}><Typography color="text.secondary">Aucun critère.</Typography></TableCell></TableRow>}
              {visibles.map((c) => (
                <TableRow key={c.id} hover>
                  <TableCell>{c.nom}<Typography variant="caption" display="block" color="text.secondary">{c.origine === "standard" ? "Standard" : `Personnalisée · ${nom(c.createur_id)}`}</Typography></TableCell>
                  <TableCell>{libelle("categorie", c.categorie)}</TableCell>
                  <TableCell><StatutChip groupe="automatisabilite" valeur={c.automatisabilite} /></TableCell>
                  <TableCell>{libelle("modeVerification", c.mode_verification)}</TableCell>
                  <TableCell><StatutChip groupe="statutCritere" valeur={c.statut} /></TableCell>
                  <TableCell align="right">
                    {c.statut === "brouillon" && c.origine === "personnalisee" ? (
                      <Button size="small" disabled={!gerer} onClick={() => agir(() => validerCritere(c.id, false))}>Valider</Button>
                    ) : (
                      <Switch checked={c.statut === "actif"} disabled={!gerer} inputProps={{ "aria-label": `Activer ${c.nom}` }}
                        onChange={(e) => agir(() => (e.target.checked ? activerCritere(c.id) : desactiverCritere(c.id)))} />
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      </Etat>
    </>
  );
}
