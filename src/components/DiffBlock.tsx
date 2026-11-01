import { Box } from "@mui/material";

/** Extrait de code proposé : lignes « + » en vert, lignes « - » en rouge. Jamais appliqué au dépôt. */
export default function DiffBlock({ diff }: { diff: string }) {
  return (
    <Box component="pre" sx={{ m: 0, py: 1, borderRadius: 1, overflowX: "auto", bgcolor: "action.hover", fontFamily: "monospace", fontSize: 12.5 }}>
      {diff.split("\n").map((l, i) => (
        <Box key={i} component="div" sx={{ px: 1.5, bgcolor: l.startsWith("+") ? "success.light" : l.startsWith("-") ? "error.light" : "transparent",
          color: l.startsWith("+") ? "success.contrastText" : l.startsWith("-") ? "error.contrastText" : "inherit" }}>
          {l || " "}
        </Box>
      ))}
    </Box>
  );
}
