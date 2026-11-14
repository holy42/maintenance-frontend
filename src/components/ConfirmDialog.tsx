import BoutonAction from "./BoutonAction";
import { Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from "@mui/material";

export default function ConfirmDialog({ ouvert, titre, texte, confirmer = "Confirmer", onConfirm, onClose }: {
  ouvert: boolean; titre: string; texte: string; confirmer?: string; onConfirm: () => void; onClose: () => void;
}) {
  return (
    <Dialog open={ouvert} onClose={onClose}>
      <DialogTitle>{titre}</DialogTitle>
      <DialogContent><DialogContentText>{texte}</DialogContentText></DialogContent>
      <DialogActions>
        <BoutonAction onClick={onClose}>Annuler</BoutonAction>
        <BoutonAction variant="contained" onClick={() => { onConfirm(); onClose(); }}>{confirmer}</BoutonAction>
      </DialogActions>
    </Dialog>
  );
}
