import { Box, Paper, Typography } from "@mui/material";
import { Outlet } from "react-router-dom";

export default function AuthLayout() {
  return (
    <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", p: 2, bgcolor: "action.hover" }}>
      <Paper sx={{ width: "100%", maxWidth: 380, p: 3 }}>
        <Typography variant="h6" component="p" textAlign="center">Plateforme de maintenance des applications</Typography>
        <Box sx={{ mt: 2 }}><Outlet /></Box>
      </Paper>
    </Box>
  );
}
