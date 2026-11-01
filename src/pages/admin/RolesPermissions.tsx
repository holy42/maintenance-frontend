import LockOutlined from "@mui/icons-material/LockOutlined";
import { Alert, Button, Checkbox, Paper, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { definirPermissions, listPermissions, listRoles, permissionsDuRole } from "../../api/administration";
import { messageErreur } from "../../api/client";
import Etat from "../../components/Etat";
import PageHeader from "../../components/PageHeader";
import { useNotifier } from "../../context/SnackbarContext";
import { useAsync } from "../../hooks/useAsync";

/** Matrice permissions × rôles. L'administrateur de la plateforme a tous les droits et ne peut pas les perdre. */
export default function RolesPermissions() {
  const notifier = useNotifier();
  const { data, loading, error } = useAsync(async () => {
    const [roles, permissions] = await Promise.all([listRoles(), listPermissions()]);
    const matrice: Record<number, number[]> = {};
    for (const r of roles) matrice[r.id] = (await permissionsDuRole(r.id)).map((p) => p.id);
    return { roles, permissions, matrice };
  });
  const [matrice, setMatrice] = useState<Record<number, number[]>>({});
  const [modifies, setModifies] = useState<Set<number>>(new Set());

  useEffect(() => { if (data) setMatrice(data.matrice); }, [data]);

  function basculer(roleId: number, permissionId: number, coche: boolean) {
    const actuel = new Set(matrice[roleId] ?? []);
    if (coche) actuel.add(permissionId); else actuel.delete(permissionId);
    setMatrice({ ...matrice, [roleId]: [...actuel] });
    setModifies(new Set(modifies).add(roleId));
  }

  async function enregistrer() {
    try {
      for (const roleId of modifies) await definirPermissions(roleId, matrice[roleId] ?? []);
      setModifies(new Set());
      notifier("Permissions enregistrées.");
    } catch (e) { notifier(messageErreur(e), "error"); }
  }

  return (
    <>
      <PageHeader titre="Rôles et permissions" fil={[{ libelle: "Administration" }, { libelle: "Rôles et permissions" }]}
        actions={<Button variant="contained" onClick={enregistrer} disabled={modifies.size === 0}>Enregistrer</Button>} />
      <Alert severity="info" sx={{ mb: 2 }}>Les permissions sont appliquées par le serveur à chaque requête, selon le rôle de la personne dans l'équipe de l'application.</Alert>
      <Etat loading={loading} error={error}>
        <Paper sx={{ overflowX: "auto" }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Permission</TableCell>
                {(data?.roles ?? []).map((r) => <TableCell key={r.id} align="center">{r.nom}</TableCell>)}
                <TableCell align="center">administrateur</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(data?.permissions ?? []).map((p) => (
                <TableRow key={p.id} hover>
                  <TableCell><Typography variant="body2">{p.description ?? p.code}</Typography><Typography variant="caption" color="text.secondary">{p.code}</Typography></TableCell>
                  {(data?.roles ?? []).map((r) => (
                    <TableCell key={r.id} align="center">
                      <Checkbox checked={(matrice[r.id] ?? []).includes(p.id)} onChange={(e) => basculer(r.id, p.id, e.target.checked)} inputProps={{ "aria-label": `${p.code} pour ${r.nom}` }} />
                    </TableCell>
                  ))}
                  <TableCell align="center"><LockOutlined fontSize="small" color="disabled" titleAccess="Toujours accordée" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      </Etat>
    </>
  );
}
