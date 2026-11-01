import { Box } from "@mui/material";

/** Code en lecture seule, avec numéros de ligne et lignes surlignées. */
export default function CodeBlock({ code, premiereLigne = 1, surlignees = [] }: { code: string; premiereLigne?: number; surlignees?: number[] }) {
  const lignes = code.split("\n");
  return (
    <Box component="pre" sx={{ m: 0, p: 1, borderRadius: 1, overflowX: "auto", bgcolor: "action.hover", fontFamily: "monospace", fontSize: 12.5 }}>
      {lignes.map((l, i) => {
        const n = premiereLigne + i;
        return (
          <Box key={n} component="div" sx={{ px: 1, display: "flex", bgcolor: surlignees.includes(n) ? "warning.light" : "transparent",
            color: surlignees.includes(n) ? "warning.contrastText" : "inherit" }}>
            <Box component="span" sx={{ width: 36, flexShrink: 0, opacity: 0.6, userSelect: "none" }}>{n}</Box>
            <span>{l || " "}</span>
          </Box>
        );
      })}
    </Box>
  );
}
