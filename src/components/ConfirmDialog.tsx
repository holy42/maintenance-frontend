import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from "@mui/material";

export default function ConfirmDialog({ ouvert, titre, texte, confirmer = "Confirmer", onConfirm, onClose }: {
  ouvert: boolean; titre: string; texte: string; confirmer?: string; onConfirm: () => void; onClose: () => void;
}) {
  return (
    <Dialog open={ouvert} onClose={onClose}>
      <DialogTitle>{titre}</DialogTitle>
      <DialogContent><DialogContentText>{texte}</DialogContentText></DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Annuler</Button>
        <Button variant="contained" onClick={() => { onConfirm(); onClose(); }}>{confirmer}</Button>
      </DialogActions>
    </Dialog>
  );
}
