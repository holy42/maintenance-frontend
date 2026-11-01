import { Button, Checkbox, FormControlLabel, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";
import { useState, type ReactNode } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { messageErreur } from "../../api/client";
import { prendreSession, sessionsApplication } from "../../api/tests";
import type { Session } from "../../api/types";
import Etat from "../../components/Etat";
import PageHeader from "../../components/PageHeader";
import StatutChip from "../../components/StatutChip";
import { useApplicationOptionnelle } from "../../context/ApplicationContext";
import { useAnnuaire } from "../../context/AnnuaireContext";
import { useApplications } from "../../context/ApplicationsContext";
import { useAuth } from "../../context/AuthContext";
import { useNotifier } from "../../context/SnackbarContext";
import { useAsync } from "../../hooks/useAsync";
import { dateHeure } from "../../utils/format";
import { PERM } from "../../utils/permissions";

function Bloc({ titre, lignes, action }: { titre: string; lignes: Session[]; action?: (s: Session) => ReactNode }) {
  const { nom } = useAnnuaire();
  const { trouver } = useApplications();
  const ctx = useApplicationOptionnelle();
  return (
    <Paper sx={{ mb: 2, overflowX: "auto" }}>
      <Typography variant="subtitle1" fontWeight={600} sx={{ p: 2, pb: 0 }}>{titre} · {lignes.length}</Typography>
      <Table size="small">
        <TableHead><TableRow><TableCell>Problème</TableCell>{!ctx && <TableCell>Application</TableCell>}<TableCell>Passage</TableCell><TableCell>Testé par</TableCell><TableCell>Statut</TableCell><TableCell>Demandé le</TableCell><TableCell /></TableRow></TableHead>
        <TableBody>
          {lignes.length === 0 && <TableRow><TableCell colSpan={7}><Typography color="text.secondary" variant="body2">Aucun.</Typography></TableCell></TableRow>}
          {lignes.map((s) => (
            <TableRow key={s.id} hover>
              <TableCell>{s.probleme_code ?? "—"} · {s.probleme_titre ?? ""}</TableCell>
              {!ctx && <TableCell>{trouver(s.application_id)?.nom ?? `#${s.application_id}`}</TableCell>}
              <TableCell>n°{s.numero} · {s.branche_testee}</TableCell>
              <TableCell>{s.testeur_id ? nom(s.testeur_id) : "—"}</TableCell>
              <TableCell><StatutChip groupe="statutSession" valeur={s.statut} /></TableCell>
              <TableCell>{dateHeure(s.demande_le)}</TableCell>
              <TableCell align="right">{action?.(s) ?? <Button size="small" component={RouterLink} to={`/applications/${s.application_id}/tests/${s.id}`}>Ouvrir</Button>}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  );
}

/** File de tests ouverte à tous les testeurs ; le testeur qui prend un test est enregistré. */
export default function TestsListe() {
  const ctx = useApplicationOptionnelle();
  const { applications } = useApplications();
  const { user } = useAuth();
  const navigate = useNavigate();
  const notifier = useNotifier();
  const [mes, setMes] = useState(false);
  const { data, loading, error, reload } = useAsync<Session[]>(async () => {
    if (ctx) return sessionsApplication(ctx.application.id, { mes_tests: mes || undefined });
    const parApp = await Promise.all(applications.map((a) => sessionsApplication(a.id, { mes_tests: mes || undefined }).catch(() => [] as Session[])));
    return parApp.flat();
  }, [ctx?.application.id, applications.length, mes]);

  const peutTester = ctx ? ctx.peut(PERM.TEST_VALIDER) : true;   // vue globale : le serveur décide
  async function prendre(s: Session) {
    try { await prendreSession(s.id); navigate(`/applications/${s.application_id}/tests/${s.id}`); } catch (e) { notifier(messageErreur(e), "error"); reload(); }
  }

  const tous = data ?? [];
  return (
    <>
      <PageHeader titre="Tests" sousTitre="Un seul test par problème ; chaque passage garde le nom du testeur et son résultat." />
      <Stack direction="row" sx={{ mb: 1 }}><FormControlLabel label="Mes tests uniquement" control={<Checkbox checked={mes} onChange={(e) => setMes(e.target.checked)} />} /></Stack>
      <Etat loading={loading} error={error}>
        <Bloc titre="À tester" lignes={tous.filter((s) => s.statut === "a_tester")}
          action={(s) => (peutTester ? <Button size="small" variant="contained" onClick={() => prendre(s)}>Prendre en charge</Button> : null)} />
        <Bloc titre="En cours" lignes={tous.filter((s) => s.statut === "en_cours")}
          action={(s) => (s.testeur_id === user?.id ? <Button size="small" variant="outlined" component={RouterLink} to={`/applications/${s.application_id}/tests/${s.id}`}>Reprendre</Button> : null)} />
        <Bloc titre="Terminés" lignes={tous.filter((s) => s.statut === "valide" || s.statut === "non_valide")} />
      </Etat>
    </>
  );
}
