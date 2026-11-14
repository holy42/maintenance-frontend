import ChampTexte from "../components/ChampTexte";
import AdminPanelSettingsOutlined from "@mui/icons-material/AdminPanelSettingsOutlined";
import AppsOutlined from "@mui/icons-material/AppsOutlined";
import BarChartOutlined from "@mui/icons-material/BarChartOutlined";
import BugReportOutlined from "@mui/icons-material/BugReportOutlined";
import ChecklistOutlined from "@mui/icons-material/ChecklistOutlined";
import ChevronLeft from "@mui/icons-material/ChevronLeft";
import ChevronRight from "@mui/icons-material/ChevronRight";
import DashboardOutlined from "@mui/icons-material/DashboardOutlined";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import HistoryOutlined from "@mui/icons-material/HistoryOutlined";
import HomeOutlined from "@mui/icons-material/HomeOutlined";
import NotificationsOutlined from "@mui/icons-material/NotificationsOutlined";
import PlayArrowOutlined from "@mui/icons-material/PlayArrowOutlined";
import ScienceOutlined from "@mui/icons-material/ScienceOutlined";
import {
  Avatar, Box, Collapse, Divider, Drawer, IconButton, List, ListItemButton, ListItemIcon, ListItemText, MenuItem,
  Tooltip, Typography, useMediaQuery, useTheme,
} from "@mui/material";
import { useEffect, useState, type ReactNode } from "react";
import { Link as RouterLink, useLocation } from "react-router-dom";
import { useApplications } from "../context/ApplicationsContext";
import { useAuth } from "../context/AuthContext";
import { useEquipe } from "../context/EquipeContext";
import { useSidebar } from "../context/SidebarContext";

interface EntreeProps { to: string; label: string; icon?: ReactNode; selected: boolean; etroit: boolean; nested?: boolean; onClick?: () => void }

function Entree({ to, label, icon, selected, etroit, nested, onClick }: EntreeProps) {
  const bouton = (
    <ListItemButton component={RouterLink} to={to} selected={selected} onClick={onClick}
      sx={{
        minHeight: nested ? 36 : 42,
        justifyContent: etroit ? "center" : "flex-start",
        px: etroit ? 1 : 1.5,
        pl: nested ? 5.5 : undefined,
      }}>
      {icon && <ListItemIcon sx={{ minWidth: etroit ? 0 : 36, justifyContent: "center", "& svg": { fontSize: 20 } }}>{icon}</ListItemIcon>}
      {!etroit && <ListItemText primary={label} primaryTypographyProps={{ fontSize: nested ? 12.5 : 13.5, fontWeight: selected ? 650 : 500, noWrap: true }} />}
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

  useEffect(() => {
    if (pathname.startsWith("/applications")) setAppsOuvert(true);
    if (pathname.startsWith("/administration")) setAdminOuvert(true);
  }, [pathname]);

  const etroit = !mobile && retreci;
  const largeur = mobile ? 260 : etroit ? 68 : 248;
  const actif = (to: string, exact = false) => (exact ? pathname === to : pathname === to || pathname.startsWith(`${to}/`));
  const fermer = () => setMobileOuvert(false);
  const visibles = applications.filter((a) => equipeId === null || a.equipe_id === equipeId);
  const nomEquipe = equipes.find((e) => e.id === equipeId)?.nom ?? "Toutes les équipes";
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
    <Box sx={{ width: largeur, height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: etroit ? "center" : "space-between", px: etroit ? 0 : 1.75, py: 1.75, minHeight: 68 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, minWidth: 0 }}>
          <Box sx={{
            width: 36, height: 36, borderRadius: 2, display: "grid", placeItems: "center", flexShrink: 0,
            color: "#fff", background: "linear-gradient(145deg, #38bdf8 0%, #2563eb 100%)",
            boxShadow: "0 5px 16px rgba(37, 99, 235, .3)",
          }}><DashboardOutlined sx={{ fontSize: 21 }} /></Box>
          {!etroit && <Box sx={{ minWidth: 0 }}>
            <Typography fontWeight={750} fontSize={14} lineHeight={1.2} noWrap>Maintenance</Typography>
            <Typography sx={{ color: "rgba(203,213,225,.58)", fontSize: 10, letterSpacing: ".12em", textTransform: "uppercase", mt: 0.35 }}>Centre de pilotage</Typography>
          </Box>}
        </Box>
        {!mobile && (
          <IconButton size="small" onClick={basculer} aria-label={etroit ? "Agrandir le menu" : "Rétrécir le menu"}
            sx={{ color: "rgba(203,213,225,.72)", "&:hover": { color: "#fff", bgcolor: "rgba(148,163,184,.12)" } }}>
            {etroit ? <ChevronRight /> : <ChevronLeft />}
          </IconButton>
        )}
      </Box>

      <Box sx={{ px: etroit ? 0.5 : 1.5, pb: 1.5 }}>
        {etroit ? (
          <Tooltip title={nomEquipe} placement="right">
            <Avatar sx={{ width: 34, height: 34, mx: "auto", fontSize: 13, fontWeight: 700, bgcolor: "rgba(56,189,248,.18)", color: "#7dd3fc", border: "1px solid rgba(125,211,252,.2)" }}>{nomEquipe.charAt(0)}</Avatar>
          </Tooltip>
        ) : (
          <ChampTexte select size="small" fullWidth label="Équipe active" value={equipeId === null ? "" : String(equipeId)}
            onChange={(e) => choisir(e.target.value === "" ? null : Number(e.target.value))}
            sx={{
              "& .MuiInputLabel-root": { color: "rgba(203,213,225,.58)", fontSize: 13 },
              "& .MuiOutlinedInput-root": {
                color: "#e2e8f0", bgcolor: "rgba(148,163,184,.07)", borderRadius: 2,
                "& fieldset": { borderColor: "rgba(148, 163, 184, 0.2)" },
                "&:hover fieldset": { borderColor: "rgba(148, 163, 184, 0.45)" },
                "&.Mui-focused fieldset": { borderColor: "secondary.main" },
              },
              "& .MuiSvgIcon-root": { color: "#94a3b8" },
            }}>
            <MenuItem value="">Toutes mes équipes</MenuItem>
            {equipes.map((e) => <MenuItem key={e.id} value={String(e.id)}>{e.nom}</MenuItem>)}
          </ChampTexte>
        )}
      </Box>
      <Divider />

      <Box sx={{ flex: 1, overflowY: "auto", overflowX: "hidden", py: 1.25, "&::-webkit-scrollbar": { width: 5 }, "&::-webkit-scrollbar-thumb": { bgcolor: "rgba(148,163,184,.22)", borderRadius: 5 } }}>
        {!etroit && <Typography sx={{ px: 2.5, pb: 0.75, pt: 0.5, color: "rgba(148,163,184,.62)", fontSize: 10, fontWeight: 700, letterSpacing: ".13em", textTransform: "uppercase" }}>Espace de travail</Typography>}
        <List component="nav" aria-label="Menu global" sx={{ py: 0 }}>
          <Entree to="/" label="Accueil" icon={<HomeOutlined />} selected={actif("/", true)} etroit={etroit} onClick={fermer} />

          <Entree to="/applications" label="Applications" icon={<AppsOutlined />} selected={actif("/applications")} etroit={etroit} onClick={fermer} />
          {!etroit && (
            <>
              <ListItemButton onClick={() => setAppsOuvert(!appsOuvert)} sx={{ mx: 1, mt: 0.25, mb: 0.5, minHeight: 32, borderRadius: 1.5, pl: 2.25 }} aria-label="Déplier la liste des applications">
                <ListItemText primary="Applications suivies" primaryTypographyProps={{ fontSize: 11.5, color: "rgba(203,213,225,.62)", fontWeight: 600 }} />
                {appsOuvert ? <ExpandLess sx={{ fontSize: 18, color: "rgba(203,213,225,.62)" }} /> : <ExpandMore sx={{ fontSize: 18, color: "rgba(203,213,225,.62)" }} />}
              </ListItemButton>
              <Collapse in={appsOuvert} unmountOnExit>
                <Entree to="/applications" label="Gestion des applications" selected={pathname === "/applications"} etroit={false} nested onClick={fermer} />
                {visibles.map((a) => (
                  <ListItemButton key={a.id} component={RouterLink} to={`/applications/${a.id}`} selected={actif(`/applications/${a.id}`)}
                    onClick={fermer} sx={{ minHeight: 34, pl: 5.5 }}>
                    <Box sx={{ width: 7, height: 7, borderRadius: "50%", bgcolor: couleurPoint(a.statut), mr: 1.5, flexShrink: 0 }} />
                    <ListItemText primary={a.nom} primaryTypographyProps={{ fontSize: 12.5, fontWeight: actif(`/applications/${a.id}`) ? 650 : 450, noWrap: true }} />
                  </ListItemButton>
                ))}
              </Collapse>
            </>
          )}

          {!etroit && <Typography sx={{ px: 2.5, pb: 0.75, pt: 2, color: "rgba(148,163,184,.62)", fontSize: 10, fontWeight: 700, letterSpacing: ".13em", textTransform: "uppercase" }}>Opérations</Typography>}
          {plat.map(([to, label, icone]) => (
            <Entree key={to} to={to} label={label} icon={icone} selected={actif(to)} etroit={etroit} onClick={fermer} />
          ))}

          {user?.est_admin && (
            <>
              <Divider sx={{ my: 1.5 }} />
              {etroit ? (
                <Entree to="/administration/utilisateurs" label="Administration" icon={<AdminPanelSettingsOutlined />} selected={actif("/administration")} etroit />
              ) : (
                <>
                  <ListItemButton onClick={() => setAdminOuvert(!adminOuvert)} sx={{ minHeight: 42, px: 1.5 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}><AdminPanelSettingsOutlined /></ListItemIcon>
                    <ListItemText primary="Administration" primaryTypographyProps={{ fontSize: 13.5, fontWeight: 550 }} />
                    {adminOuvert ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
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
      {!etroit && (
        <Box sx={{ px: 2, py: 1.5, borderTop: "1px solid rgba(148,163,184,.14)" }}>
          <Typography sx={{ color: "rgba(148,163,184,.48)", fontSize: 10.5 }}>Plateforme de maintenance</Typography>
        </Box>
      )}
    </Box>
  );

  return (
    <Drawer
      variant={mobile ? "temporary" : "permanent"}
      open={mobile ? mobileOuvert : true}
      onClose={fermer}
      ModalProps={{ keepMounted: true }}
      sx={{
        width: mobile ? 0 : largeur,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: largeur,
          boxSizing: "border-box",
          overflowX: "hidden",
          transition: "width .2s",
          bgcolor: "#101827",
          color: "#e2e8f0",
          borderRightColor: "rgba(148, 163, 184, 0.14)",
          boxShadow: mobile ? "0 18px 48px rgba(2,6,23,.32)" : "none",
        },
        "& .MuiDivider-root": { borderColor: "rgba(148, 163, 184, 0.14)" },
        "& .MuiListItemIcon-root": { color: "inherit" },
        "& .MuiListItemButton-root": {
          color: "#cbd5e1",
          borderRadius: 2,
          mx: 1,
          mb: 0.4,
          transition: "background-color .16s ease, color .16s ease",
          "&:hover": { bgcolor: "rgba(148, 163, 184, 0.09)", color: "#f8fafc" },
          "&.Mui-selected": {
            color: "#fff",
            bgcolor: "rgba(255, 255, 255, 0.1)",
            boxShadow: "none",
            "&:hover": { bgcolor: "rgba(255, 255, 255, 0.15)" },
            "& .MuiListItemIcon-root": { color: "#fff" },
          },
        },
      }}
    >
      {contenu}
    </Drawer>
  );
}
