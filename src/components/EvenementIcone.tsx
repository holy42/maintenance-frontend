import AppsOutlined from "@mui/icons-material/AppsOutlined";
import AutoAwesomeOutlined from "@mui/icons-material/AutoAwesomeOutlined";
import BugReportOutlined from "@mui/icons-material/BugReportOutlined";
import ChatBubbleOutline from "@mui/icons-material/ChatBubbleOutline";
import CheckCircleOutline from "@mui/icons-material/CheckCircleOutline";
import ChecklistOutlined from "@mui/icons-material/ChecklistOutlined";
import CloudOutlined from "@mui/icons-material/CloudOutlined";
import DescriptionOutlined from "@mui/icons-material/DescriptionOutlined";
import ForumOutlined from "@mui/icons-material/ForumOutlined";
import GroupsOutlined from "@mui/icons-material/GroupsOutlined";
import HistoryOutlined from "@mui/icons-material/HistoryOutlined";
import PersonOutline from "@mui/icons-material/PersonOutline";
import PlayArrowOutlined from "@mui/icons-material/PlayArrowOutlined";
import PlayCircleOutline from "@mui/icons-material/PlayCircleOutline";
import ScienceOutlined from "@mui/icons-material/ScienceOutlined";
import SettingsOutlined from "@mui/icons-material/SettingsOutlined";
import SubdirectoryArrowRightOutlined from "@mui/icons-material/SubdirectoryArrowRightOutlined";
import TaskAltOutlined from "@mui/icons-material/TaskAltOutlined";
import { Box } from "@mui/material";
import { alpha } from "@mui/material/styles";
import type { ReactElement } from "react";
import { couleurEvenement } from "../utils/libelles";

const ICONES: Record<string, ReactElement> = {
  probleme: <BugReportOutlined fontSize="small" />,
  tache: <ChecklistOutlined fontSize="small" />,
  sous_tache: <SubdirectoryArrowRightOutlined fontSize="small" />,
  critere: <TaskAltOutlined fontSize="small" />,
  verification: <PlayArrowOutlined fontSize="small" />,
  resultat: <CheckCircleOutline fontSize="small" />,
  solution: <AutoAwesomeOutlined fontSize="small" />,
  note: <DescriptionOutlined fontSize="small" />,
  message: <ForumOutlined fontSize="small" />,
  salon: <ChatBubbleOutline fontSize="small" />,
  session_test: <ScienceOutlined fontSize="small" />,
  test: <PlayCircleOutline fontSize="small" />,
  application: <AppsOutlined fontSize="small" />,
  depot: <CloudOutlined fontSize="small" />,
  equipe: <GroupsOutlined fontSize="small" />,
  role: <SettingsOutlined fontSize="small" />,
  utilisateur: <PersonOutline fontSize="small" />,
};

export default function EvenementIcone({ type, action }: { type: string; action: string }) {
  const ton = couleurEvenement(action);
  return (
    <Box aria-hidden="true" sx={(theme) => ({
      display: "grid",
      placeItems: "center",
      width: 40,
      height: 40,
      borderRadius: 2,
      flexShrink: 0,
      color: theme.palette[ton].main,
      bgcolor: alpha(theme.palette[ton].main, theme.palette.mode === "light" ? 0.12 : 0.2),
    })}>
      {ICONES[type] ?? <HistoryOutlined fontSize="small" />}
    </Box>
  );
}
