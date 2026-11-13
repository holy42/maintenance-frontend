import { Box } from "@mui/material";
import { Outlet } from "react-router-dom";
import { SidebarProvider } from "../context/SidebarContext";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";

/** Niveau 1 : menu global (rétractable) à gauche, barre du haut, contenu. */
export default function GlobalLayout() {
  return (
    <SidebarProvider>
      <Box sx={{
        display: "flex", minHeight: "100vh",
        "@supports (height: 100dvh)": { minHeight: "100dvh" },
      }}>
        <Sidebar />
        <Box component="main" sx={{ flex: 1, minWidth: 0, minHeight: 0, display: "flex", flexDirection: "column", bgcolor: "background.default" }}>
          <TopBar />
          <Box sx={{ p: { xs: 1.5, sm: 2, lg: 3 }, flex: 1, minWidth: 0, minHeight: 0, display: "flex", flexDirection: "column" }}>
            <Outlet />
          </Box>
        </Box>
      </Box>
    </SidebarProvider>
  );
}
