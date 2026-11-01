import { MenuItem, TextField } from "@mui/material";

/** Liste déroulante de filtre, avec l'option « Tous ». */
export default function FiltreSelect({ label, valeur, onChange, options, largeur = 170 }: {
  label: string; valeur: string; onChange: (v: string) => void; options: { valeur: string; libelle: string }[]; largeur?: number;
}) {
  return (
    <TextField select size="small" label={label} value={valeur} onChange={(e) => onChange(e.target.value)} sx={{ minWidth: largeur }}>
      <MenuItem value="">Tous</MenuItem>
      {options.map((o) => <MenuItem key={o.valeur} value={o.valeur}>{o.libelle}</MenuItem>)}
    </TextField>
  );
}
