import { MenuItem, TextField } from "@mui/material";

/** Liste déroulante de formulaire (valeur obligatoire ou option vide facultative). */
export default function ChampSelect({ label, valeur, onChange, options, vide, disabled, fullWidth = true }: {
  label: string; valeur: string; onChange: (v: string) => void; options: { valeur: string; libelle: string }[];
  vide?: string; disabled?: boolean; fullWidth?: boolean;
}) {
  return (
    <TextField select size="small" label={label} value={valeur} onChange={(e) => onChange(e.target.value)} disabled={disabled} fullWidth={fullWidth}>
      {vide !== undefined && <MenuItem value="">{vide}</MenuItem>}
      {options.map((o) => <MenuItem key={o.valeur} value={o.valeur}>{o.libelle}</MenuItem>)}
    </TextField>
  );
}
