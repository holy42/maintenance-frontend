import { Button, Paper, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";
import { useCallback } from "react";
import { Link as RouterLink } from "react-router-dom";
import { listVerifications } from "../../api/verifications";
import type { Verification } from "../../api/types";
import Etat from "../../components/Etat";
import PageHeader from "../../components/PageHeader";
import StatutChip from "../../components/StatutChip";
import { useApplicationOptionnelle } from "../../context/ApplicationContext";
import { useApplications } from "../../context/ApplicationsContext";
import { useAnnuaire } from "../../context/AnnuaireContext";
import { useAsync } from "../../hooks/useAsync";
import { usePolling } from "../../hooks/usePolling";
import { dateHeure } from "../../utils/format";
import { PERM } from "../../utils/permissions";

/** Historique des vérifications : d'une application (espace de l'application) ou de toutes (menu global). */
export default function VerificationsListe() {
  const ctx = useApplicationOptionnelle();
  const { applications, trouver } = useApplications();
  const { nom } = useAnnuaire();
  const { data, loading, error, reload } = useAsync<Verification[]>(async () => {
    if (ctx) return listVerifications(ctx.application.id, { limit: 50 });
    const parApp = await Promise.all(applications.map((a) => listVerifications(a.id, { limit: 10 }).catch(() => [] as Verification[])));
    return parApp.flat().sort((a, b) => b.debut_le.localeCompare(a.debut_le));
  }, [ctx?.application.id, applications.length]);

  const enCours = (data ?? []).some((v) => v.statut === "en_attente" || v.statut === "en_cours");
  usePolling(useCallback(reload, [reload]), enCours);

  return (
    <>
      <PageHeader titre="Vérifications" sousTitre={enCours ? "Une vérification est en cours : la liste se met à jour toute seule." : undefined}
        actions={ctx && ctx.peut(PERM.VERIFICATION_LANCER) && !ctx.archivee
          ? <Button variant="contained" component={RouterLink} to={`/applications/${ctx.application.id}/verifications/nouvelle`}>Nouvelle vérification</Button> : undefined} />
      <Etat loading={loading && !data} error={error}>
        <Paper sx={{ overflowX: "auto" }}>
          <Table size="small">
            <TableHead><TableRow>
              <TableCell>N°</TableCell>{!ctx && <TableCell>Application</TableCell>}<TableCell>Date et auteur</TableCell><TableCell>Branche · version</TableCell>
              <TableCell>Statut</TableCell><TableCell>Résultats</TableCell><TableCell />
            </TableRow></TableHead>
            <TableBody>
              {(data ?? []).length === 0 && <TableRow><TableCell colSpan={7}><Typography color="text.secondary">Aucune vérification.</Typography></TableCell></TableRow>}
              {(data ?? []).map((v) => (
                <TableRow key={v.id} hover>
                  <TableCell>#{v.id}</TableCell>
                  {!ctx && <TableCell>{trouver(v.application_id)?.nom ?? `#${v.application_id}`}</TableCell>}
                  <TableCell>{dateHeure(v.debut_le)}<Typography variant="caption" display="block" color="text.secondary">{nom(v.declenchee_par)}</Typography></TableCell>
                  <TableCell>{v.branche} · {v.commit_analyse?.slice(0, 8) ?? "—"}</TableCell>
                  <TableCell><StatutChip groupe="statutVerification" valeur={v.statut} />{v.motif_echec && <Typography variant="caption" display="block" color="error">{v.motif_echec}</Typography>}</TableCell>
                  <TableCell>{v.resultat_global ?? "—"}</TableCell>
                  <TableCell align="right"><Button size="small" component={RouterLink} to={`/applications/${v.application_id}/verifications/${v.id}`}>Ouvrir</Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      </Etat>
    </>
  );
}
