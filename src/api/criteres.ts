import { api, donnees } from "./client";
import type { Critere, CritereCreation, Id, PropositionCritere } from "./types";

export const listCriteres = (appId: Id) => donnees<Critere[]>(api.get(`/applications/${appId}/criteres`));
export const structurerCritere = (appId: Id, description: string) =>
  donnees<PropositionCritere>(api.post(`/applications/${appId}/criteres/structurer`, { description }));
export const creerCritere = (appId: Id, d: CritereCreation) => donnees<Critere>(api.post(`/applications/${appId}/criteres`, d));
export const validerCritere = (id: Id, activer: boolean) => donnees<Critere>(api.post(`/criteres/${id}/valider`, null, { params: { activer } }));
export const activerCritere = (id: Id) => donnees<Critere>(api.post(`/criteres/${id}/activer`));
export const desactiverCritere = (id: Id) => donnees<Critere>(api.post(`/criteres/${id}/desactiver`));
