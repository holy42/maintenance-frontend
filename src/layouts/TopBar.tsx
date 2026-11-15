import ChampTexte from "../components/ChampTexte";
import LogoutOutlined from "@mui/icons-material/LogoutOutlined";
import MenuOutlined from "@mui/icons-material/MenuOutlined";
import NotificationsOutlined from "@mui/icons-material/NotificationsOutlined";
import PersonOutline from "@mui/icons-material/PersonOutline";
import SearchOutlined from "@mui/icons-material/SearchOutlined";
import { AppBar, Avatar, Badge, Box, IconButton, InputAdornment, ListItemIcon, Menu, MenuItem, Toolbar, useMediaQuery, useTheme } from "@mui/material";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { messageErreur } from "../api/client";
import { compteurNotifications, notifications, preferencesCanaux } from "../api/suivi";
import { useAuth } from "../context/AuthContext";
import { useNotifier } from "../context/SnackbarContext";
import { useSidebar } from "../context/SidebarContext";
import { usePolling } from "../hooks/usePolling";
import { EVENEMENT_DONNEES_MODIFIEES, EVENEMENT_PREFERENCES_NOTIFICATIONS_MODIFIEES } from "../utils/actualisation";
import { emettreSonNotification, preparerSonNotification } from "../utils/sonNotification";

export default function TopBar() {
  const theme = useTheme();
  const mobile = useMediaQuery(theme.breakpoints.down("md"));
  const { setMobileOuvert } = useSidebar();
  const { user, deconnecter } = useAuth();
  const notifier = useNotifier();
  const navigate = useNavigate();
  const [recherche, setRecherche] = useState("");
  const [ancre, setAncre] = useState<HTMLElement | null>(null);
  const [nonLues, setNonLues] = useState(0);
  const [preferencesChargees, setPreferencesChargees] = useState(false);
  const [canaux, setCanaux] = useState({ son: true, navigateur: true });
  const canauxCourants = useRef(canaux);
  const dernierIdNotification = useRef<number | null>(null);
  const erreurPollingSignalee = useRef(false);
  const erreurNotificationSignalee = useRef(false);
  const chargementEnCours = useRef(false);

  const charger = useCallback(async () => {
    if (chargementEnCours.current) return;
    chargementEnCours.current = true;
    try {
      if (!preferencesChargees) {
        const [compteur, prefs] = await Promise.all([compteurNotifications(), preferencesCanaux()]);
        setNonLues(compteur.non_lues);
        canauxCourants.current = prefs;
        setCanaux(prefs);
        dernierIdNotification.current = compteur.dernier_id ?? 0;
        setPreferencesChargees(true);
      } else {
        const [compteur, nouvelles] = await Promise.all([
          compteurNotifications(),
          notifications({ apres_id: dernierIdNotification.current ?? 0, limit: 300 }),
        ]);
        setNonLues(compteur.non_lues);
        for (const n of nouvelles) {
          dernierIdNotification.current = n.id;
          if (canauxCourants.current.son) emettreSonNotification();
          if (canauxCourants.current.navigateur && typeof Notification !== "undefined" && Notification.permission === "granted") {
            try {
              const alerte = new Notification("Maintenance des applications", { body: n.message, tag: `notification-${n.id}` });
              alerte.onclick = () => {
                window.focus();
                navigate("/notifications");
                alerte.close();
              };
              erreurNotificationSignalee.current = false;
            } catch (e) {
              if (!erreurNotificationSignalee.current) {
                notifier(`Impossible d'afficher la notification navigateur : ${messageErreur(e)}`, "error");
              }
              erreurNotificationSignalee.current = true;
            }
          }
        }
      }
      erreurPollingSignalee.current = false;
    } catch (e) {
      if (!erreurPollingSignalee.current) notifier(messageErreur(e), "error");
      erreurPollingSignalee.current = true;
    } finally {
      chargementEnCours.current = false;
    }
  }, [navigate, notifier, preferencesChargees]);
  useEffect(() => { void charger(); }, [charger]);
  useEffect(() => {
    window.addEventListener(EVENEMENT_DONNEES_MODIFIEES, charger);
    return () => window.removeEventListener(EVENEMENT_DONNEES_MODIFIEES, charger);
  }, [charger]);
  useEffect(() => {
    const actualiserCanaux = () => {
      preferencesCanaux().then((prefs) => {
        canauxCourants.current = prefs;
        setCanaux(prefs);
      }).catch((e) => notifier(messageErreur(e), "error"));
    };
    window.addEventListener(EVENEMENT_PREFERENCES_NOTIFICATIONS_MODIFIEES, actualiserCanaux);
    return () => window.removeEventListener(EVENEMENT_PREFERENCES_NOTIFICATIONS_MODIFIEES, actualiserCanaux);
  }, [notifier]);
  useEffect(() => {
    if (!preferencesChargees || !canaux.son) return;
    const preparer = () => preparerSonNotification();
    window.addEventListener("pointerdown", preparer, { once: true });
    window.addEventListener("keydown", preparer, { once: true });
    return () => {
      window.removeEventListener("pointerdown", preparer);
      window.removeEventListener("keydown", preparer);
    };
  }, [canaux.son, preferencesChargees]);
  usePolling(charger, true, 10000);

  return (
    <AppBar position="sticky" color="inherit" elevation={0} sx={{ borderBottom: 1, borderColor: "divider", bgcolor: "background.paper", backgroundImage: "none" }}>
      <Toolbar sx={{ gap: { xs: 0.75, sm: 1.5 }, minHeight: { xs: 58, sm: 68 }, px: { xs: 1, sm: 2 } }}>
        {mobile && <IconButton color="primary" onClick={() => setMobileOuvert(true)} aria-label="Ouvrir le menu"><MenuOutlined /></IconButton>}
        <ChampTexte
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
