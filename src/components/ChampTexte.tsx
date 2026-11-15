import AdminPanelSettingsOutlined from "@mui/icons-material/AdminPanelSettingsOutlined";
import CalendarMonthOutlined from "@mui/icons-material/CalendarMonthOutlined";
import CodeOutlined from "@mui/icons-material/CodeOutlined";
import EditNoteOutlined from "@mui/icons-material/EditNoteOutlined";
import EmailOutlined from "@mui/icons-material/EmailOutlined";
import FilterAltOutlined from "@mui/icons-material/FilterAltOutlined";
import GroupOutlined from "@mui/icons-material/GroupOutlined";
import LinkOutlined from "@mui/icons-material/LinkOutlined";
import LockOutlined from "@mui/icons-material/LockOutlined";
import NumbersOutlined from "@mui/icons-material/NumbersOutlined";
import PersonOutline from "@mui/icons-material/PersonOutline";
import SearchOutlined from "@mui/icons-material/SearchOutlined";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { IconButton, InputAdornment, TextField as MuiTextField, type TextFieldProps } from "@mui/material";
import { useState, type ReactNode } from "react";

function iconePourChamp(props: TextFieldProps): ReactNode {
  const libelle = [props.label, props.placeholder]
    .filter((valeur): valeur is string => typeof valeur === "string")
    .join(" ")
    .toLocaleLowerCase();

  if (props.type === "password" || libelle.includes("mot de passe") || libelle.includes("jeton")) return <LockOutlined fontSize="small" color="action" />;
  if (props.type === "email" || libelle.includes("e-mail") || libelle.includes("email")) return <EmailOutlined fontSize="small" color="action" />;
  if (props.type === "search" || libelle.includes("recherch")) return <SearchOutlined fontSize="small" color="action" />;
  if (props.type === "date" || libelle.includes("échéance") || libelle.includes("période")) return <CalendarMonthOutlined fontSize="small" color="action" />;
  if (libelle.includes("url") || libelle.includes("lien") || libelle.includes("pull request")) return <LinkOutlined fontSize="small" color="action" />;
  if (libelle.includes("code") || libelle.includes("commit") || libelle.includes("branche") || libelle.includes("technolog")) return <CodeOutlined fontSize="small" color="action" />;
  if (libelle.includes("équipe") || libelle.includes("rôle") || libelle.includes("permission")) return <GroupOutlined fontSize="small" color="action" />;
  if (libelle.includes("administrateur") || libelle.includes("admin")) return <AdminPanelSettingsOutlined fontSize="small" color="action" />;
  if (libelle.includes("identifiant") || libelle.includes("utilisateur") || libelle.includes("membre") || libelle.includes("auteur") || libelle.includes("responsable")) return <PersonOutline fontSize="small" color="action" />;
  if (libelle.includes("statut") || libelle.includes("catégorie") || libelle.includes("priorité") || libelle.includes("gravité") || libelle.includes("source") || props.select) {
    return <FilterAltOutlined fontSize="small" color="action" />;
  }
  if (libelle.includes("durée") || libelle.includes("nombre") || libelle.includes("ligne") || libelle.includes("(h)")) return <NumbersOutlined fontSize="small" color="action" />;
  return <EditNoteOutlined fontSize="small" color="action" />;
}

export default function ChampTexte(props: TextFieldProps) {
  const [motDePasseVisible, setMotDePasseVisible] = useState(false);
  const inputProps = props.InputProps ?? {};
  const startAdornment = inputProps.startAdornment ?? (
    <InputAdornment position="start">{iconePourChamp(props)}</InputAdornment>
  );
  const endAdornment = props.type === "password" ? (
    <>
      {inputProps.endAdornment}
      <InputAdornment position="end">
        <IconButton
          aria-label={motDePasseVisible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
          aria-pressed={motDePasseVisible}
          edge="end"
          onClick={() => setMotDePasseVisible((visible) => !visible)}
          onMouseDown={(event) => event.preventDefault()}
          type="button"
        >
          {motDePasseVisible ? <VisibilityOff /> : <Visibility />}
        </IconButton>
      </InputAdornment>
    </>
  ) : inputProps.endAdornment;

  return (
    <MuiTextField
      {...props}
      type={props.type === "password" && motDePasseVisible ? "text" : props.type}
      InputProps={{ ...inputProps, startAdornment, endAdornment }}
    />
  );
}
