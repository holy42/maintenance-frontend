import AdminPanelSettingsOutlined from "@mui/icons-material/AdminPanelSettingsOutlined";
import AppsOutlined from "@mui/icons-material/AppsOutlined";
import BarChartOutlined from "@mui/icons-material/BarChartOutlined";
import BugReportOutlined from "@mui/icons-material/BugReportOutlined";
import ChecklistOutlined from "@mui/icons-material/ChecklistOutlined";
import ChevronLeft from "@mui/icons-material/ChevronLeft";
import ChevronRight from "@mui/icons-material/ChevronRight";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import HistoryOutlined from "@mui/icons-material/HistoryOutlined";
import HomeOutlined from "@mui/icons-material/HomeOutlined";
import NotificationsOutlined from "@mui/icons-material/NotificationsOutlined";
import PlayArrowOutlined from "@mui/icons-material/PlayArrowOutlined";
import ScienceOutlined from "@mui/icons-material/ScienceOutlined";
import {
  Avatar, Box, Collapse, Divider, Drawer, IconButton, List, ListItemButton, ListItemIcon, ListItemText, MenuItem, TextField,
  Tooltip, Typography, useMediaQuery, useTheme,
} from "@mui/material";
import { useState, type ReactNode } from "react";
import { Link as RouterLink, useLocation } from "react-router-dom";
import { useApplications } from "../context/ApplicationsContext";
import { useAuth } from "../context/AuthContext";
import { useEquipe } from "../context/EquipeContext";
import { useSidebar } from "../context/SidebarContext";

interface EntreeProps { to: string; label: string; icon?: ReactNode; selected: boolean; etroit: boolean; nested?: boolean; onClick?: () => void }

function Entree({ to, label, icon, selected, etroit, nested, onClick }: EntreeProps) {
  const bouton = (
    <ListItemButton component={RouterLink} to={to} selected={selected} onClick={onClick}
      sx={{ minHeight: 40, justifyContent: etroit ? "center" : "flex-start", px: etroit ? 1 : 2, pl: nested ? 6 : undefined }}>
      {icon && <ListItemIcon sx={{ minWidth: etroit ? 0 : 36, justifyContent: "center" }}>{icon}</ListItemIcon>}
      {!etroit && <ListItemText primary={label} primaryTypographyProps={{ fontSize: nested ? 13 : 14, noWrap: true }} />}
    </ListItemButton>
  );
  return etroit ? <Tooltip title={label} placement="right">{bouton}</Tooltip> : bouton;
}

export default function Sidebar() {
  const theme = useTheme();
  const mobile = useMediaQuery(theme.breakpoints.down("md"));
  const { retreci, basculer, mobileOuvert, setMobileOuvert } = useSidebar();
  const { user } = useAuth();
  const { applications } = useApplications();
  const { equipes, equipeId, choisir } = useEquipe();
  const { pathname } = useLocation();
  const [appsOuvert, setAppsOuvert] = useState(true);
  const [adminOuvert, setAdminOuvert] = useState(false);

  const etroit = !mobile && retreci;
  const largeur = mobile ? 260 : etroit ? 68 : 248;
  const actif = (to: string, exact = false) => (exact ? pathname === to : pathname === to || pathname.startsWith(`${to}/`));
  const fermer = () => setMobileOuvert(false);
  const visibles = applications.filter((a) => equipeId === null || a.equipe_id === equipeId);
  const couleurPoint = (statut: string) => (statut === "active" ? "success.main" : statut === "en_maintenance" ? "warning.main" : "text.disabled");

  const plat: [string, string, ReactNode][] = [
    ["/problemes", "Problèmes", <BugReportOutlined key="p" />],
    ["/verifications", "Vérifications", <PlayArrowOutlined key="v" />],
    ["/taches", "Tâches", <ChecklistOutlined key="t" />],
    ["/tests", "Tests", <ScienceOutlined key="e" />],
    ["/historique", "Historique", <HistoryOutlined key="h" />],
    ["/notifications", "Notifications", <NotificationsOutlined key="n" />],
    ["/rapports", "Rapports", <BarChartOutlined key="r" />],
  ];

  const contenu = (
    <Box sx={{ width: largeur, overflowX: "hidden" }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: etroit ? "center" : "space-between", px: etroit ? 0 : 2, py: 1.5 }}>
        {!etroit && <Typography fontWeight={600} noWrap>Maintenance</Typography>}
        {!mobile && (
          <IconButton size="small" onClick={basculer} aria-label={etroit ? "Agrandir le menu" : "Rétrécir le menu"}>
            {etroit ? <ChevronRight /> : <ChevronLeft />}
          </IconButton>
        )}
      </Box>

      <Box sx={{ px: etroit ? 0.5 : 2, pb: 1.5, display: "flex", justifyContent: "center" }}>
        {etroit ? (
          <Tooltip title={equipes.find((e) => e.id === equipeId)?.nom ?? "Toutes les équipes"} placement="right">
            <Avatar sx={{ width: 32, height: 32, fontSize: 14 }}>{(equipes.find((e) => e.id === equipeId)?.nom ?? "É").charAt(0)}</Avatar>
          </Tooltip>
        ) : (
          <TextField select size="small" fullWidth label="Équipe" value={equipeId === null ? "" : String(equipeId)}
            onChange={(e) => choisir(e.target.value === "" ? null : Number(e.target.value))}>
            <MenuItem value="">Toutes mes équipes</MenuItem>
            {equipes.map((e) => <MenuItem key={e.id} value={String(e.id)}>{e.nom}</MenuItem>)}
          </TextField>
        )}
      </Box>
      <Divider />

      <List component="nav" aria-label="Menu global" sx={{ py: 1 }}>
        <Entree to="/" label="Accueil" icon={<HomeOutlined />} selected={actif("/", true)} etroit={etroit} onClick={fermer} />

        <Entree to="/applications" label="Applications" icon={<AppsOutlined />} selected={actif("/applications")} etroit={etroit} onClick={fermer} />
        {!etroit && (
          <>
            <ListItemButton onClick={() => setAppsOuvert(!appsOuvert)} sx={{ py: 0, minHeight: 28 }} aria-label="Déplier la liste des applications">
              <ListItemText primary="Accès rapide" primaryTypographyProps={{ fontSize: 11, color: "text.secondary" }} sx={{ pl: 4.5 }} />
              {appsOuvert ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
            </ListItemButton>
            <Collapse in={appsOuvert} unmountOnExit>
              <Entree to="/applications" label="Gestion des applications" selected={pathname === "/applications"} etroit={false} nested onClick={fermer} />
              {visibles.map((a) => (
                <ListItemButton key={a.id} component={RouterLink} to={`/applications/${a.id}`} selected={actif(`/applications/${a.id}`)}
                  onClick={fermer} sx={{ minHeight: 34, pl: 6 }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: couleurPoint(a.statut), mr: 1.5, flexShrink: 0 }} />
                  <ListItemText primary={a.nom} primaryTypographyProps={{ fontSize: 13, noWrap: true }} />
                </ListItemButton>
              ))}
            </Collapse>
          </>
        )}

        {plat.map(([to, label, icone]) => (
          <Entree key={to} to={to} label={label} icon={icone} selected={actif(to)} etroit={etroit} onClick={fermer} />
        ))}

        {user?.est_admin && (
          <>
            <Divider sx={{ my: 1 }} />
            {etroit ? (
              <Entree to="/administration/utilisateurs" label="Administration" icon={<AdminPanelSettingsOutlined />} selected={actif("/administration")} etroit />
            ) : (
              <>
                <ListItemButton onClick={() => setAdminOuvert(!adminOuvert)}>
                  <ListItemIcon sx={{ minWidth: 36 }}><AdminPanelSettingsOutlined /></ListItemIcon>
                  <ListItemText primary="Administration" primaryTypographyProps={{ fontSize: 14 }} />
                  {adminOuvert ? <ExpandLess /> : <ExpandMore />}
                </ListItemButton>
                <Collapse in={adminOuvert} unmountOnExit>
                  <Entree to="/administration/utilisateurs" label="Utilisateurs" selected={actif("/administration/utilisateurs")} etroit={false} nested onClick={fermer} />
                  <Entree to="/administration/equipes" label="Équipes" selected={actif("/administration/equipes")} etroit={false} nested onClick={fermer} />
                  <Entree to="/administration/roles" label="Rôles et permissions" selected={actif("/administration/roles")} etroit={false} nested onClick={fermer} />
                  <Entree to="/administration/modele-fiabilite" label="Modèle de fiabilité" selected={actif("/administration/modele-fiabilite")} etroit={false} nested onClick={fermer} />
                </Collapse>
              </>
            )}
          </>
        )}
      </List>
    </Box>
  );

  return (
    <Drawer
      variant={mobile ? "temporary" : "permanent"}
      open={mobile ? mobileOuvert : true}
      onClose={fermer}
      ModalProps={{ keepMounted: true }}
      sx={{ width: mobile ? 0 : largeur, flexShrink: 0, "& .MuiDrawer-paper": { width: largeur, boxSizing: "border-box", overflowX: "hidden", transition: "width .2s" } }}
    >
      {contenu}
    </Drawer>
  );
}
