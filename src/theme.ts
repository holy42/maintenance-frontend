import { createTheme } from "@mui/material";

/** Thème clair ou sombre selon la préférence du système. */
export const creerTheme = (sombre: boolean) =>
  createTheme({
    palette: { mode: sombre ? "dark" : "light", primary: { main: "#3f51b5" } },
    shape: { borderRadius: 10 },
    typography: { fontSize: 14, button: { textTransform: "none" } },
    components: {
      MuiButton: { defaultProps: { disableElevation: true } },
      MuiPaper: { defaultProps: { variant: "outlined" } },
    },
  });
