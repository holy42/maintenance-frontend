import AutoAwesomeOutlined from "@mui/icons-material/AutoAwesomeOutlined";
import BuildOutlined from "@mui/icons-material/BuildOutlined";
import PersonOutline from "@mui/icons-material/PersonOutline";
import { Chip, Tooltip } from "@mui/material";
import type { ReactElement } from "react";
import { libelle } from "../utils/libelles";

const ICONES: Record<string, ReactElement> = { outil: <BuildOutlined />, ia: <AutoAwesomeOutlined />, humain: <PersonOutline /> };

/** Distingue ce que dit un outil, ce que suppose l'IA et ce qu'un humain a saisi. */
export default function SourceBadge({ source }: { source: string }) {
  const puce = <Chip size="small" icon={ICONES[source]} label={libelle("source", source)} color={source === "ia" ? "warning" : "default"} variant="outlined" />;
  return source === "ia" ? <Tooltip title="Hypothèse de l'IA, non vérifiée">{puce}</Tooltip> : puce;
}
