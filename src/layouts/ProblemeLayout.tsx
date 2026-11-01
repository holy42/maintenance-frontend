import AutoAwesomeOutlined from "@mui/icons-material/AutoAwesomeOutlined";
import ForumOutlined from "@mui/icons-material/ForumOutlined";
import { Button, Chip, Stack, Tab, Tabs, Typography } from "@mui/material";
import { useMemo, useState } from "react";
import { Outlet, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { messageErreur } from "../api/client";
import { listSalons } from "../api/collaboration";
import { getProbleme } from "../api/problemes";
import AssistantIAPanel from "../components/AssistantIAPanel";
import Etat from "../components/Etat";
import PageHeader from "../components/PageHeader";
import SourceBadge from "../components/SourceBadge";
import StatutChip from "../components/StatutChip";
import { useApplication } from "../context/ApplicationContext";
import { ProblemeContext, type ProblemeCtx } from "../context/ProblemeContext";
import { useNotifier } from "../context/SnackbarContext";
import { useAsync } from "../hooks/useAsync";
import { libelle } from "../utils/libelles";
import { PERM } from "../utils/permissions";

const ONGLETS = [
  { seg: "", libelle: "Résumé" },
  { seg: "diagnostic", libelle: "Diagnostic et solutions" },
  { seg: "decision", libelle: "Décision" },
  { seg: "taches", libelle: "Tâches" },
  { seg: "tests", libelle: "Tests" },
  { seg: "notes", libelle: "Notes" },
  { seg: "historique", libelle: "Historique" },
];

/** Fiche d'un problème : en-tête, onglets, salon, assistant IA (ouvert aussi par « Demander de l'aide » d'une tâche). */
export default function ProblemeLayout() {
  const { problemeId } = useParams();
  const id = Number(problemeId);
  const { application, peut } = useApplication();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [params, setParams] = useSearchParams();
  const notifier = useNotifier();
  const { data: probleme, loading, error, reload } = useAsync(() => getProbleme(id), [id]);
  const [assistantOuvert, setAssistantOuvert] = useState(params.get("assistant") === "1");

  const base = `/applications/${application.id}/problemes/${id}`;
  const segment = pathname.startsWith(base) ? pathname.slice(base.length).split("/")[1] ?? "" : "";
  const questionInitiale = params.get("question") ?? undefined;

  const contexte = useMemo<ProblemeCtx | null>(() => (probleme ? { probleme, recharger: reload } : null), [probleme, reload]);

  async function ouvrirSalon() {
    try {
      const salon = (await listSalons(application.id)).find((s) => s.probleme_id === id);
      if (salon) navigate(`/applications/${application.id}/discussions/${salon.id}`);
      else notifier("Aucun salon pour ce problème.", "warning");
    } catch (e) { notifier(messageErreur(e), "error"); }
  }

  function fermerAssistant() {
    setAssistantOuvert(false);
    if (params.has("assistant")) { params.delete("assistant"); params.delete("question"); setParams(params, { replace: true }); }
  }

  return (
    <Etat loading={loading} error={error}>
      {probleme && contexte && (
        <ProblemeContext.Provider value={contexte}>
          <PageHeader
            fil={[{ libelle: "Problèmes", to: `/applications/${application.id}/problemes` }, { libelle: probleme.code }]}
            titre={`${probleme.code} · ${probleme.titre}`}
            sousTitre={
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap sx={{ mt: 0.5 }}>
                <StatutChip groupe="statutProbleme" valeur={probleme.statut} />
                <StatutChip groupe="gravite" valeur={probleme.gravite} />
                <Chip size="small" variant="outlined" label={libelle("categorie", probleme.categorie)} />
                <SourceBadge source={probleme.source} />
              </Stack>
            }
            actions={
              <>
                <Button startIcon={<ForumOutlined />} variant="outlined" onClick={ouvrirSalon}>Salon</Button>
                <Button startIcon={<AutoAwesomeOutlined />} variant="outlined" onClick={() => setAssistantOuvert(true)}>Assistant IA</Button>
              </>
            }
          />
          <Tabs value={segment} variant="scrollable" scrollButtons="auto" sx={{ mb: 2 }}
            onChange={(_, v: string) => navigate(v ? `${base}/${v}` : base)}>
            {ONGLETS.map((o) => <Tab key={o.seg} value={o.seg} label={o.libelle} />)}
          </Tabs>
          <Outlet />
          <AssistantIAPanel
            ouvert={assistantOuvert} onClose={fermerAssistant} problemeId={id} questionInitiale={questionInitiale}
            tacheId={params.get("tache") ? Number(params.get("tache")) : null}
            sousTacheId={params.get("sous") ? Number(params.get("sous")) : null}
            peutUtiliser={peut(PERM.ASSISTANT_UTILISER)} peutProposer={peut(PERM.PROBLEME_MODIFIER)} onSolutionCreee={reload}
          />
        </ProblemeContext.Provider>
      )}
      {!loading && !error && !probleme && <Typography>Problème introuvable.</Typography>}
    </Etat>
  );
}
