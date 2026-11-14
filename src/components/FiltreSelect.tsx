import ChampTexte from "./ChampTexte";
import FilterAltOutlined from "@mui/icons-material/FilterAltOutlined";
import { MenuItem, InputAdornment } from "@mui/material";

/** Liste déroulante de filtre, avec l'option « Tous ». */
export default function FiltreSelect({ label, valeur, onChange, options, largeur = 170 }: {
  label: string; valeur: string; onChange: (v: string) => void; options: { valeur: string; libelle: string }[]; largeur?: number;
}) {
  return (
    <ChampTexte select size="small" label={label} value={valeur} onChange={(e) => onChange(e.target.value)}
      sx={{ minWidth: { xs: "100%", sm: largeur }, flex: { xs: "1 1 100%", sm: "0 1 auto" }, "& .MuiSelect-select": { py: 1 } }}
      InputProps={{ startAdornment: <InputAdornment position="start"><FilterAltOutlined fontSize="small" color="secondary" /></InputAdornment> }}>
      <MenuItem value="">Tous</MenuItem>
      {options.map((o) => <MenuItem key={o.valeur} value={o.valeur}>{o.libelle}</MenuItem>)}
    </ChampTexte>
  );
}
