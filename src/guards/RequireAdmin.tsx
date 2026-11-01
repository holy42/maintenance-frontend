import { Alert } from "@mui/material";
import { Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/** Confort d'affichage uniquement : le serveur refuse de toute façon les routes d'administration aux non-administrateurs. */
export default function RequireAdmin() {
  const { user } = useAuth();
  if (!user?.est_admin) return <Alert severity="warning">Cette section est réservée à l'administrateur de la plateforme.</Alert>;
  return <Outlet />;
}
