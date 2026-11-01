import { Box } from "@mui/material";
import { Outlet } from "react-router-dom";
import { SidebarProvider } from "../context/SidebarContext";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";

/** Niveau 1 : menu global (rétractable) à gauche, barre du haut, contenu. */
export default function GlobalLayout() {
  return (
    <SidebarProvider>
      <Box sx={{ display: "flex", minHeight: "100vh" }}>
        <Sidebar />
        <Box component="main" sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
          <TopBar />
          <Box sx={{ p: { xs: 2, md: 3 }, flex: 1 }}><Outlet /></Box>
        </Box>
      </Box>
    </SidebarProvider>
  );
}
