import BoutonAction from "../../components/BoutonAction";
import DoneAllOutlined from "@mui/icons-material/DoneAllOutlined";
import MarkEmailReadOutlined from "@mui/icons-material/MarkEmailReadOutlined";
import MarkEmailUnreadOutlined from "@mui/icons-material/MarkEmailUnreadOutlined";
import { Box, Checkbox, Chip, FormControlLabel, IconButton, ListItemButton, Paper, Stack, Typography } from "@mui/material";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { messageErreur } from "../../api/client";
import { marquerLue, marquerNonLue, notifications, toutLire } from "../../api/suivi";
import type { Notification } from "../../api/types";
import Etat from "../../components/Etat";
import EvenementIcone from "../../components/EvenementIcone";
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
  const nombreNonLues = (data ?? []).filter((n) => !n.lu).length;

  async function agir(fn: () => Promise<unknown>) {
    try {
      await fn();
      reload();
    } catch (e) { notifier(messageErreur(e), "error"); }
  }
  async function ouvrir(n: Notification) {
    if (!n.lu) {
      try {
        await marquerLue(n.id);
        reload();
      } catch (e) {
        notifier(messageErreur(e), "error");
        return;
      }
    }
    const lien = lienNotification(n);
    if (lien) navigate(lien); else reload();
  }

  return (
    <>
      <PageHeader titre="Notifications"
        sousTitre={`${(data ?? []).length} notification(s) · ${nombreNonLues} non lue(s)`}
        actions={<BoutonAction variant="outlined" startIcon={<DoneAllOutlined />} disabled={nombreNonLues === 0} onClick={() => agir(toutLire)}>Tout marquer comme lu</BoutonAction>} />
      <Box sx={{ p: { xs: 1.5, sm: 2 }, mb: 2 }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ xs: "stretch", sm: "center" }} flexWrap="wrap" useFlexGap>
          <FormControlLabel label="Non lues seulement" control={<Checkbox checked={nonLues} onChange={(e) => setNonLues(e.target.checked)} />} />
          <FiltreSelect label="Type" valeur={type} onChange={setType} options={options("evenement")} largeur={230} />
          {nombreNonLues > 0 && <Chip color="secondary" label={`${nombreNonLues} à lire`} sx={{ ml: { sm: "auto" } }} />}
        </Stack>
      </Box>
      <Etat loading={loading} error={error}>
        {(data ?? []).length === 0 ? (
          <Paper sx={{ p: 5, textAlign: "center", borderStyle: "dashed" }}>
            <Typography variant="h6" fontWeight={700}>Aucune notification</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>Les nouvelles activités apparaîtront ici.</Typography>
          </Paper>
        ) : (
          <Stack spacing={1.25}>
            {(data ?? []).map((n) => (
              <Paper key={n.id} sx={(theme) => ({
                overflow: "hidden",
                borderColor: n.lu ? theme.palette.divider : theme.palette.secondary.light,
                bgcolor: n.lu ? "background.paper" : theme.palette.mode === "light" ? "rgba(66, 153, 224, 0.045)" : "rgba(66, 153, 224, 0.09)",
              })}>
                <ListItemButton onClick={() => ouvrir(n)} sx={{ p: { xs: 1.5, sm: 2 }, gap: 1.5, alignItems: "flex-start" }}>
                  <EvenementIcone type={n.type_evenement.startsWith("session_test") ? "session_test" : n.type_evenement.split("_")[0]} action={n.type_evenement} />
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                      <Typography variant="subtitle2" fontWeight={n.lu ? 500 : 700}>{libelle("evenement", n.type_evenement)}</Typography>
                      {!n.lu && <Chip size="small" color="secondary" label="Nouveau" />}
                    </Stack>
                    <Typography variant="body2" sx={{ mt: 0.5, overflowWrap: "anywhere" }}>{n.message}</Typography>
                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
                      {n.application_id && <Chip size="small" variant="outlined" label={trouver(n.application_id)?.nom ?? `Application #${n.application_id}`} />}
                      <Typography variant="caption" color="text.secondary">{dateHeure(n.cree_le)}</Typography>
                    </Stack>
                  </Box>
                  <IconButton size="small" aria-label={n.lu ? "Marquer comme non lue" : "Marquer comme lue"}
                    title={n.lu ? "Marquer comme non lue" : "Marquer comme lue"}
                    onClick={(e) => { e.stopPropagation(); agir(() => (n.lu ? marquerNonLue(n.id) : marquerLue(n.id))); }}
                    sx={{ flexShrink: 0, color: "secondary.main" }}>
                    {n.lu ? <MarkEmailUnreadOutlined /> : <MarkEmailReadOutlined />}
                  </IconButton>
                </ListItemButton>
              </Paper>
            ))}
          </Stack>
        )}
      </Etat>
    </>
  );
}
