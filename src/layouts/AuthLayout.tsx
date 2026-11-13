import HandymanOutlined from "@mui/icons-material/HandymanOutlined";
import { Box, Paper, Stack, ThemeProvider, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { Outlet } from "react-router-dom";
import { creerTheme } from "../theme";

const themeConnexion = creerTheme(false);

export default function AuthLayout() {
  return (
    <ThemeProvider theme={themeConnexion}>
      <Box sx={{
        minHeight: "100vh", display: "grid", placeItems: "center", p: { xs: 2, sm: 3 }, position: "relative",
        overflow: "hidden", isolation: "isolate", bgcolor: "#fff",
      }}>
        <Box aria-hidden="true" sx={(theme) => ({
          position: "absolute", zIndex: -1, width: { xs: 220, sm: 340 }, height: { xs: 220, sm: 340 }, borderRadius: "50%",
          top: { xs: -100, sm: -140 }, right: { xs: -80, sm: "8%" },
          border: `1px solid ${alpha(theme.palette.secondary.main, 0.12)}`, bgcolor: alpha(theme.palette.secondary.main, 0.035),
        })} />
        <Box aria-hidden="true" sx={(theme) => ({
          position: "absolute", zIndex: -1, width: { xs: 250, sm: 390 }, height: { xs: 250, sm: 390 }, borderRadius: "50%",
          bottom: { xs: -145, sm: -190 }, left: { xs: -110, sm: "9%" },
          border: `1px solid ${alpha(theme.palette.secondary.main, 0.1)}`, bgcolor: alpha(theme.palette.secondary.main, 0.03),
        })} />
        <Paper component="main" sx={{
          width: "100%", maxWidth: 460, p: { xs: 3, sm: 4.5 }, position: "relative", overflow: "hidden",
          borderRadius: 4, bgcolor: "#fff", color: "#1a365d", boxShadow: "0 22px 64px rgba(15, 42, 77, 0.12)",
          borderColor: "rgba(49, 130, 206, 0.16)",
        }}>
          <Box sx={{ position: "absolute", top: 0, left: 0, right: 0, height: 5, background: "linear-gradient(90deg, #3182ce, #4299e0)" }} />
          <Stack alignItems="center" spacing={1.25}>
            <Box sx={{
              width: 52, height: 52, display: "grid", placeItems: "center", borderRadius: 2.5,
              color: "#fff", background: "linear-gradient(135deg, #3182ce, #4299e0)", boxShadow: "0 8px 20px rgba(49, 130, 206, 0.24)",
            }}>
              <HandymanOutlined fontSize="large" />
            </Box>
            <Box>
              <Typography variant="subtitle1" textAlign="center" fontWeight={800}>Plateforme de maintenance</Typography>
              <Typography variant="caption" display="block" textAlign="center" color="text.secondary" sx={{ letterSpacing: "0.12em", textTransform: "uppercase" }}>
                Fiabilité · Suivi · Qualité
              </Typography>
            </Box>
          </Stack>
          <Box sx={{ mt: 3.5 }}><Outlet /></Box>
        </Paper>
      </Box>
    </ThemeProvider>
  );
}
