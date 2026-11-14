import AddOutlined from "@mui/icons-material/AddOutlined";
import ArrowBackOutlined from "@mui/icons-material/ArrowBackOutlined";
import ArrowForwardOutlined from "@mui/icons-material/ArrowForwardOutlined";
import AutoAwesomeOutlined from "@mui/icons-material/AutoAwesomeOutlined";
import CheckOutlined from "@mui/icons-material/CheckOutlined";
import CloseOutlined from "@mui/icons-material/CloseOutlined";
import ContentCopyOutlined from "@mui/icons-material/ContentCopyOutlined";
import DeleteOutline from "@mui/icons-material/DeleteOutline";
import DownloadOutlined from "@mui/icons-material/DownloadOutlined";
import EditOutlined from "@mui/icons-material/EditOutlined";
import EmailOutlined from "@mui/icons-material/EmailOutlined";
import GroupsOutlined from "@mui/icons-material/GroupsOutlined";
import HelpOutline from "@mui/icons-material/HelpOutline";
import LinkOutlined from "@mui/icons-material/LinkOutlined";
import LockResetOutlined from "@mui/icons-material/LockResetOutlined";
import LoginOutlined from "@mui/icons-material/LoginOutlined";
import PauseOutlined from "@mui/icons-material/PauseOutlined";
import PlayArrowOutlined from "@mui/icons-material/PlayArrowOutlined";
import RefreshOutlined from "@mui/icons-material/RefreshOutlined";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import ScienceOutlined from "@mui/icons-material/ScienceOutlined";
import SendOutlined from "@mui/icons-material/SendOutlined";
import ShareOutlined from "@mui/icons-material/ShareOutlined";
import StopOutlined from "@mui/icons-material/StopOutlined";
import TaskAltOutlined from "@mui/icons-material/TaskAltOutlined";
import VisibilityOutlined from "@mui/icons-material/VisibilityOutlined";
import { Children, type ReactNode, isValidElement } from "react";
import MuiButton, { type ButtonTypeMap } from "@mui/material/Button";
import type { OverridableComponent } from "@mui/material/OverridableComponent";

type Props = ButtonTypeMap<{ to?: string }>["props"] & {
  component?: React.ElementType;
  to?: string;
};

const BaseButton = MuiButton as OverridableComponent<ButtonTypeMap<{ to?: string }>>;

function texteDesEnfants(children: ReactNode): string {
  return Children.toArray(children).map((child) => {
    if (typeof child === "string" || typeof child === "number") return String(child);
    if (isValidElement<{ children?: ReactNode }>(child)) return texteDesEnfants(child.props.children);
    return "";
  }).join(" ");
}

function iconePourAction(texte: string): ReactNode {
  const action = texte.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase();

  if (/annuler|fermer/.test(action)) return <CloseOutlined />;
  if (/connexion|connecter/.test(action)) return <LoginOutlined />;
  if (/mot de passe|reinitialiser/.test(action)) return <LockResetOutlined />;
  if (/supprimer|retirer|desactiver|archiver|ecarter/.test(action)) return <DeleteOutline />;
  if (/reactiver|restaurer|activer/.test(action)) return <RefreshOutlined />;
  if (/valider|confirmer|terminer|choisir|prendre en charge|marquer comme lu|^ok$/.test(action)) return <TaskAltOutlined />;
  if (/enregistrer|sauvegarder/.test(action)) return <SaveOutlined />;
  if (/entrainer/.test(action)) return <ScienceOutlined />;
  if (/attribuer/.test(action)) return <GroupsOutlined />;
  if (/ajouter|creer|nouveau|nouvelle/.test(action)) return /membre|equipe|salon/.test(action) ? <GroupsOutlined /> : <AddOutlined />;
  if (/lancer|demarrer|recommencer|reprendre|tester/.test(action)) return <PlayArrowOutlined />;
  if (/pause|mettre en pause/.test(action)) return <PauseOutlined />;
  if (/arreter/.test(action)) return <StopOutlined />;
  if (/exporter|telecharger/.test(action)) return <DownloadOutlined />;
  if (/envoyer|publier|demander/.test(action)) return <SendOutlined />;
  if (/partager/.test(action)) return <ShareOutlined />;
  if (/copier/.test(action)) return <ContentCopyOutlined />;
  if (/assistant|ia|proposer|aide/.test(action)) return <AutoAwesomeOutlined />;
  if (/examiner|ouvrir|voir|afficher|consulter|detail/.test(action)) return <VisibilityOutlined />;
  if (/precedent|retour/.test(action)) return <ArrowBackOutlined />;
  if (/suivant/.test(action)) return <ArrowForwardOutlined />;
  if (/e-mail|email/.test(action)) return <EmailOutlined />;
  if (/lien/.test(action)) return <LinkOutlined />;
  if (/modifier|editer/.test(action)) return <EditOutlined />;
  if (/aide/.test(action)) return <HelpOutline />;
  return <ArrowForwardOutlined />;
}

const BoutonAction: OverridableComponent<ButtonTypeMap<{ to?: string }>> = (props: Props) => {
  const texte = texteDesEnfants(props.children);
  const startIcon = props.startIcon ?? (props.endIcon ? undefined : iconePourAction(texte));
  return <BaseButton {...props} startIcon={startIcon} />;
};

export default BoutonAction;
