import { alpha, createTheme } from "@mui/material/styles";

/** Thème clair ou sombre selon la préférence du système. */
export const creerTheme = (sombre: boolean) =>
  createTheme({
    palette: {
      mode: sombre ? "dark" : "light",
      primary: { main: "#3182ce" },
      secondary: { main: "#4299e0" },
      ...(sombre ? {} : { background: { default: "#f4f7fb", paper: "#ffffff" } }),
    },
    shape: { borderRadius: 10 },
    typography: { fontSize: 14, button: { textTransform: "none" } },
    components: {
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: {
            minHeight: 40,
            borderRadius: 8,
            fontWeight: 600,
            "&:focus-visible": { outline: "2px solid #4299e0", outlineOffset: 2 },
          },
          sizeSmall: { minHeight: 34 },
        },
      },
      MuiTextField: {
        defaultProps: { variant: "outlined", size: "small", color: "secondary" },
        styleOverrides: { root: { marginBlock: "2px" } },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: ({ theme }) => ({
            borderRadius: theme.shape.borderRadius,
            "& .MuiOutlinedInput-notchedOutline": { transition: "border-color .15s, border-width .15s" },
            "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: theme.palette.text.secondary },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: theme.palette.secondary.main, borderWidth: 2 },
            "&.Mui-error.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: theme.palette.error.main },
          }),
        },
      },
      MuiInputLabel: {
        styleOverrides: {
          root: { fontWeight: 500 },
          outlined: ({ theme }) => ({ "&.Mui-focused": { color: theme.palette.secondary.main } }),
        },
      },
      MuiFormHelperText: {
        styleOverrides: {
          root: { marginLeft: 0, lineHeight: 1.4 },
        },
      },
      MuiFormControlLabel: {
        styleOverrides: {
          root: { marginLeft: 0, marginRight: 0, marginBlock: "2px", minHeight: 40 },
          label: { lineHeight: 1.4 },
        },
      },
      MuiCheckbox: { defaultProps: { color: "secondary" } },
      MuiRadio: { defaultProps: { color: "secondary" } },
      MuiSwitch: { defaultProps: { color: "secondary" } },
      MuiPaper: { defaultProps: { variant: "outlined" } },
      MuiChip: {
        styleOverrides: {
          root: { fontWeight: 600, borderRadius: 8 },
          colorDefault: ({ theme }) => ({
            backgroundColor: alpha(theme.palette.text.primary, theme.palette.mode === "light" ? 0.045 : 0.12),
            color: theme.palette.text.secondary,
          }),
          colorPrimary: ({ theme }) => ({
            backgroundColor: alpha(theme.palette.primary.main, theme.palette.mode === "light" ? 0.12 : 0.2),
            color: theme.palette.mode === "light" ? theme.palette.primary.dark : theme.palette.primary.light,
          }),
          colorSecondary: ({ theme }) => ({
            backgroundColor: alpha(theme.palette.secondary.main, theme.palette.mode === "light" ? 0.12 : 0.2),
            color: theme.palette.mode === "light" ? theme.palette.secondary.dark : theme.palette.secondary.light,
          }),
          colorError: ({ theme }) => ({
            backgroundColor: alpha(theme.palette.error.main, theme.palette.mode === "light" ? 0.12 : 0.2),
            color: theme.palette.mode === "light" ? theme.palette.error.dark : theme.palette.error.light,
          }),
          colorWarning: ({ theme }) => ({
            backgroundColor: alpha(theme.palette.warning.main, theme.palette.mode === "light" ? 0.14 : 0.22),
            color: theme.palette.mode === "light" ? theme.palette.warning.dark : theme.palette.warning.light,
          }),
          colorInfo: ({ theme }) => ({
            backgroundColor: alpha(theme.palette.info.main, theme.palette.mode === "light" ? 0.12 : 0.2),
            color: theme.palette.mode === "light" ? theme.palette.info.dark : theme.palette.info.light,
          }),
          colorSuccess: ({ theme }) => ({
            backgroundColor: alpha(theme.palette.success.main, theme.palette.mode === "light" ? 0.12 : 0.2),
            color: theme.palette.mode === "light" ? theme.palette.success.dark : theme.palette.success.light,
          }),
        },
      },
      MuiDialogTitle: { styleOverrides: { root: { fontWeight: 700, paddingBottom: 8 } } },
      MuiDialogActions: { styleOverrides: { root: { padding: "12px 24px 20px" } } },
      MuiTableCell: {
        styleOverrides: {
          root: ({ theme }) => ({ borderColor: theme.palette.divider }),
          head: ({ theme }) => ({
            backgroundColor: alpha(theme.palette.secondary.main, theme.palette.mode === "light" ? 0.09 : 0.16),
            color: theme.palette.text.secondary,
            fontSize: "0.8rem",
            fontWeight: 700,
            letterSpacing: "0.04em",
            whiteSpace: "nowrap",
            paddingTop: 14,
            paddingBottom: 14,
          }),
          body: { paddingTop: 12, paddingBottom: 12 },
        },
      },
      MuiTableRow: {
        styleOverrides: {
          root: ({ theme }) => ({
            "&:last-child td, &:last-child th": { borderBottom: 0 },
            "&:nth-of-type(even) td": {
              backgroundColor: alpha(theme.palette.secondary.main, theme.palette.mode === "light" ? 0.025 : 0.06),
            },
            "&.Mui-selected td": {
              backgroundColor: alpha(theme.palette.primary.main, theme.palette.mode === "light" ? 0.12 : 0.2),
            },
            "&.MuiTableRow-hover:hover td": {
              backgroundColor: `${alpha(theme.palette.secondary.main, theme.palette.mode === "light" ? 0.09 : 0.14)} !important`,
            },
          }),
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: ({ theme }) => ({
            borderRadius: 8,
            "&:hover": { backgroundColor: alpha(theme.palette.secondary.main, theme.palette.mode === "light" ? 0.08 : 0.16) },
            "&.Mui-selected": {
              backgroundColor: alpha(theme.palette.secondary.main, theme.palette.mode === "light" ? 0.12 : 0.2),
              "&:hover": { backgroundColor: alpha(theme.palette.secondary.main, theme.palette.mode === "light" ? 0.16 : 0.24) },
            },
          }),
        },
      },
    },
  });
