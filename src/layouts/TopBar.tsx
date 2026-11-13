import LogoutOutlined from "@mui/icons-material/LogoutOutlined";
import MenuOutlined from "@mui/icons-material/MenuOutlined";
import NotificationsOutlined from "@mui/icons-material/NotificationsOutlined";
import PersonOutline from "@mui/icons-material/PersonOutline";
import SearchOutlined from "@mui/icons-material/SearchOutlined";
import { AppBar, Avatar, Badge, Box, IconButton, InputAdornment, ListItemIcon, Menu, MenuItem, TextField, Toolbar, useMediaQuery, useTheme } from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { compteurNotifications } from "../api/suivi";
import { useAuth } from "../context/AuthContext";
import { useSidebar } from "../context/SidebarContext";
import { usePolling } from "../hooks/usePolling";
import { EVENEMENT_DONNEES_MODIFIEES } from "../utils/actualisation";

export default function TopBar() {
  const theme = useTheme();
  const mobile = useMediaQuery(theme.breakpoints.down("md"));
  const { setMobileOuvert } = useSidebar();
  const { user, deconnecter } = useAuth();
  const navigate = useNavigate();
  const [recherche, setRecherche] = useState("");
  const [ancre, setAncre] = useState<HTMLElement | null>(null);
  const [nonLues, setNonLues] = useState(0);

  const charger = useCallback(() => {
    compteurNotifications().then((c) => setNonLues(c.non_lues)).catch(() => undefined);
  }, []);
  useEffect(charger, [charger]);
  useEffect(() => {
    window.addEventListener(EVENEMENT_DONNEES_MODIFIEES, charger);
    return () => window.removeEventListener(EVENEMENT_DONNEES_MODIFIEES, charger);
  }, [charger]);
  usePolling(charger, true, 60000);

  return (
    <AppBar position="sticky" color="inherit" elevation={0} sx={{ borderBottom: 1, borderColor: "divider", bgcolor: "background.paper", backgroundImage: "none" }}>
      <Toolbar sx={{ gap: { xs: 0.75, sm: 1.5 }, minHeight: { xs: 58, sm: 68 }, px: { xs: 1, sm: 2 } }}>
        {mobile && <IconButton color="primary" onClick={() => setMobileOuvert(true)} aria-label="Ouvrir le menu"><MenuOutlined /></IconButton>}
        <TextField
          size="small" placeholder={mobile ? "Rechercher un problème" : "Rechercher un problème (code ou titre)"} value={recherche}
          sx={{ flex: { xs: 1, sm: "0 1 460px" }, maxWidth: 460, "& .MuiOutlinedInput-root": { bgcolor: "action.hover", borderRadius: 3 } }}
          onChange={(e) => setRecherche(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && recherche.trim()) navigate(`/problemes?recherche=${encodeURIComponent(recherche.trim())}`); }}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchOutlined fontSize="small" /></InputAdornment> }}
        />
        <Box sx={{ flex: 1, display: { xs: "none", sm: "block" } }} />
        <IconButton color="primary" onClick={() => navigate("/notifications")} aria-label={`Notifications (${nonLues} non lues)`}>
          <Badge badgeContent={nonLues} color="error"><NotificationsOutlined /></Badge>
        </IconButton>
        <IconButton onClick={(e) => setAncre(e.currentTarget)} aria-label="Menu du compte" sx={{ p: 0.5 }}>
          <Avatar sx={{ width: 34, height: 34, fontSize: 14, bgcolor: "primary.dark", boxShadow: 1 }}>{(user?.identifiant ?? "?").slice(0, 2).toUpperCase()}</Avatar>
        </IconButton>
        <Menu anchorEl={ancre} open={Boolean(ancre)} onClose={() => setAncre(null)}>
          <MenuItem onClick={() => { setAncre(null); navigate("/compte"); }}>
            <ListItemIcon><PersonOutline fontSize="small" /></ListItemIcon>Mon compte
          </MenuItem>
          <MenuItem onClick={deconnecter}>
            <ListItemIcon><LogoutOutlined fontSize="small" /></ListItemIcon>Se déconnecter
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}
