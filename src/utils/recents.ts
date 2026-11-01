const CLE = "maintenance.applications_recentes";

export function noterApplicationRecente(id: number): void {
  const actuelles = lireApplicationsRecentes().filter((x) => x !== id);
  localStorage.setItem(CLE, JSON.stringify([id, ...actuelles].slice(0, 5)));
}

export function lireApplicationsRecentes(): number[] {
  try {
    const v = JSON.parse(localStorage.getItem(CLE) ?? "[]");
    return Array.isArray(v) ? v.filter((x): x is number => typeof x === "number") : [];
  } catch {
    return [];
  }
}
