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
  usePolling(charger, true, 60000);

  return (
    <AppBar position="sticky" color="inherit" elevation={0} sx={{ borderBottom: 1, borderColor: "divider" }}>
      <Toolbar sx={{ gap: 1 }}>
        {mobile && <IconButton onClick={() => setMobileOuvert(true)} aria-label="Ouvrir le menu"><MenuOutlined /></IconButton>}
        <TextField
          size="small" placeholder="Rechercher un problème (code ou titre)" value={recherche} sx={{ flex: 1, maxWidth: 460 }}
          onChange={(e) => setRecherche(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && recherche.trim()) navigate(`/problemes?recherche=${encodeURIComponent(recherche.trim())}`); }}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchOutlined fontSize="small" /></InputAdornment> }}
        />
        <Box sx={{ flex: 1 }} />
        <IconButton onClick={() => navigate("/notifications")} aria-label={`Notifications (${nonLues} non lues)`}>
          <Badge badgeContent={nonLues} color="error"><NotificationsOutlined /></Badge>
        </IconButton>
        <IconButton onClick={(e) => setAncre(e.currentTarget)} aria-label="Menu du compte">
          <Avatar sx={{ width: 32, height: 32, fontSize: 14 }}>{(user?.identifiant ?? "?").slice(0, 2).toUpperCase()}</Avatar>
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
