import { Box, Button, Checkbox, FormControlLabel, List, ListItemButton, ListItemText, Paper, Stack, Typography } from "@mui/material";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { messageErreur } from "../../api/client";
import { marquerLue, marquerNonLue, notifications, toutLire } from "../../api/suivi";
import type { Notification } from "../../api/types";
import Etat from "../../components/Etat";
import FiltreSelect from "../../components/FiltreSelect";
import PageHeader from "../../components/PageHeader";
import { useApplicationOptionnelle } from "../../context/ApplicationContext";
import { useApplications } from "../../context/ApplicationsContext";
import { useNotifier } from "../../context/SnackbarContext";
import { useAsync } from "../../hooks/useAsync";
import { dateHeure } from "../../utils/format";
import { lienNotification } from "../../utils/liens";
import { libelle, options } from "../../utils/libelles";

/** Notifications internes de l'utilisateur (globales, ou limitées à l'application dans son espace). */
export default function Notifications() {
  const ctx = useApplicationOptionnelle();
  const { trouver } = useApplications();
  const navigate = useNavigate();
  const notifier = useNotifier();
  const [nonLues, setNonLues] = useState(false);
  const [type, setType] = useState("");
  const { data, loading, error, reload } = useAsync(() => notifications({ non_lues: nonLues || undefined, type_evenement: type || undefined, application_id: ctx?.application.id, limit: 200 }),
    [nonLues, type, ctx?.application.id]);

  async function agir(fn: () => Promise<unknown>) { try { await fn(); reload(); } catch (e) { notifier(messageErreur(e), "error"); } }
  async function ouvrir(n: Notification) {
    if (!n.lu) await marquerLue(n.id).catch(() => undefined);
    const lien = lienNotification(n);
    if (lien) navigate(lien); else reload();
  }

  return (
    <>
      <PageHeader titre="Notifications" actions={<Button variant="outlined" onClick={() => agir(toutLire)}>Tout marquer comme lu</Button>} />
      <Stack direction="row" spacing={1} sx={{ mb: 2 }} alignItems="center" flexWrap="wrap" useFlexGap>
        <FormControlLabel label="Non lues seulement" control={<Checkbox checked={nonLues} onChange={(e) => setNonLues(e.target.checked)} />} />
        <FiltreSelect label="Type" valeur={type} onChange={setType} options={options("evenement")} largeur={230} />
      </Stack>
      <Etat loading={loading} error={error}>
        <Paper>
          <List disablePadding>
            {(data ?? []).length === 0 && <Typography sx={{ p: 2 }} color="text.secondary">Aucune notification.</Typography>}
            {(data ?? []).map((n) => (
              <ListItemButton key={n.id} divider onClick={() => ouvrir(n)}>
                <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: n.lu ? "transparent" : "primary.main", mr: 1.5, flexShrink: 0 }} />
                <ListItemText primary={n.message} primaryTypographyProps={{ fontWeight: n.lu ? 400 : 600 }}
                  secondary={`${libelle("evenement", n.type_evenement)}${n.application_id ? ` · ${trouver(n.application_id)?.nom ?? ""}` : ""} · ${dateHeure(n.cree_le)}`} />
                <Button size="small" onClick={(e) => { e.stopPropagation(); agir(() => (n.lu ? marquerNonLue(n.id) : marquerLue(n.id))); }}>{n.lu ? "Marquer non lue" : "Marquer lue"}</Button>
              </ListItemButton>
            ))}
          </List>
        </Paper>
      </Etat>
    </>
  );
}
