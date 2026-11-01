import { api, donnees } from "./client";
import type { Critere, Id, Probleme, Resultat, Verification, VerificationCreation } from "./types";

export const listVerifications = (appId: Id, params?: { statut?: string; branche?: string; limit?: number }) =>
  donnees<Verification[]>(api.get(`/applications/${appId}/verifications`, { params }));
export const lancerVerification = (appId: Id, d: VerificationCreation) =>
  donnees<Verification>(api.post(`/applications/${appId}/verifications`, d));
export const getVerification = (id: Id) => donnees<Verification>(api.get(`/verifications/${id}`));
export const resultatsVerification = (id: Id, params?: { categorie?: string; source?: string; statut_validation?: string }) =>
  donnees<Resultat[]>(api.get(`/verifications/${id}/resultats`, { params }));
export const criteresManuels = (id: Id) => donnees<Critere[]>(api.get(`/verifications/${id}/criteres-manuels`));
export const getResultat = (id: Id) => donnees<Resultat>(api.get(`/resultats/${id}`));
export const confirmerResultat = (id: Id, d: { motif?: string; titre?: string }) => donnees<Probleme>(api.post(`/resultats/${id}/confirmer`, d));
export const ecarterResultat = (id: Id, d: { motif?: string }) => donnees<Resultat>(api.post(`/resultats/${id}/ecarter`, d));
