import { api, donnees } from "./client";
import type { Decision, DecisionCreation, Diagnostic, Evenement, Id, Probleme, ProblemeCreation } from "./types";

export interface FiltresProblemes {
  application_id?: Id; categorie?: string; gravite?: string; priorite?: string; statut?: string;
  responsable_id?: Id; recherche?: string; limit?: number; offset?: number;
}
export const listProblemes = (params?: FiltresProblemes) => donnees<Probleme[]>(api.get("/problemes", { params }));
export const getProbleme = (id: Id) => donnees<Probleme>(api.get(`/problemes/${id}`));
export const creerProbleme = (appId: Id, d: ProblemeCreation) => donnees<Probleme>(api.post(`/applications/${appId}/problemes`, d));
export const modifierProbleme = (id: Id, d: Partial<{ titre: string; description: string; comportement_attendu: string;
  comportement_observe: string; gravite: string; priorite: string; responsable_id: Id | null; echeance: string | null }>) =>
  donnees<Probleme>(api.patch(`/problemes/${id}`, d));
export const changerStatutProbleme = (id: Id, statut: string, motif?: string) =>
  donnees<Probleme>(api.post(`/problemes/${id}/statut`, { statut, motif }));
export const listDiagnostics = (id: Id) => donnees<Diagnostic[]>(api.get(`/problemes/${id}/diagnostics`));
export const demanderDiagnostic = (id: Id) => donnees<Diagnostic>(api.post(`/problemes/${id}/diagnostics`));
export const retourSolution = (solutionId: Id, d: { utilite_percue: string; commentaire?: string; commit_associe?: string }) =>
  donnees<{ message: string }>(api.post(`/solutions/${solutionId}/retour`, d));
export const listDecisions = (id: Id) => donnees<Decision[]>(api.get(`/problemes/${id}/decisions`));
export const creerDecision = (id: Id, d: DecisionCreation) => donnees<Decision>(api.post(`/problemes/${id}/decisions`, d));
export const historiqueProbleme = (id: Id) => donnees<Evenement[]>(api.get(`/problemes/${id}/historique`));
