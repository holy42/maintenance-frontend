import { Chip } from "@mui/material";
import { couleur, libelle, type GroupeLibelle } from "../utils/libelles";

export default function StatutChip({ groupe, valeur, taille = "small" }: { groupe: GroupeLibelle; valeur?: string | null; taille?: "small" | "medium" }) {
  return <Chip size={taille} label={libelle(groupe, valeur)} color={couleur(groupe, valeur)} variant={couleur(groupe, valeur) === "default" ? "outlined" : "filled"} />;
}
