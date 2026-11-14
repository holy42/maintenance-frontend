import { Box, Tab, Tabs } from "@mui/material";

interface Onglet<T extends string> {
  valeur: T;
  libelle: string;
}

export default function OngletsHorizontaux<T extends string>({
  valeur,
  onglets,
  onChange,
}: {
  valeur: T | false;
  onglets: readonly Onglet<T>[];
  onChange: (valeur: T) => void;
}) {
  return (
    <Box sx={{ flexShrink: 0, bgcolor: "background.paper", borderBottom: 1, borderColor: "divider", mb : 3 }}>
      <Tabs
        value={valeur}
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
        onChange={(_, nouvelleValeur: string) => {
          const onglet = onglets.find((item) => item.valeur === nouvelleValeur);
          if (onglet) onChange(onglet.valeur);
        }}
        sx={{
          px: { xs: 0.5, sm: 1 },
          minHeight: 48,
          "& .MuiTabs-indicator": { display: "none" },
          "& .MuiTab-root": {
            minHeight: 48,
            minWidth: "auto",
            px: { xs: 1.5, sm: 2 },
            mx: 0.25,
            borderRadius: 0,
            fontWeight: 600,
            fontSize: 12.5,
            textTransform: "none",
            whiteSpace: "nowrap",
            color: "text.secondary",
            "&.Mui-selected": {
              color: "primary.main",
              bgcolor: "rgba(49,130,206,.08)",
              boxShadow: "inset 0 -2px 0 currentColor",
            },
            "&:hover": { color: "primary.main", bgcolor: "action.hover" },
          },
          "& .MuiTabs-scrollButtons": { color: "text.secondary", width: 30 },
        }}
      >
        {onglets.map((onglet) => (
          <Tab key={onglet.valeur} value={onglet.valeur} label={onglet.libelle} />
        ))}
      </Tabs>
    </Box>
  );
}
