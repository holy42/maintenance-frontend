import { api, donnees } from "./client";
import type { DetailSession, Id, RetourTesteur, Session, TestCorrection } from "./types";

export const sessionsApplication = (appId: Id, params?: { statut?: string; mes_tests?: boolean }) =>
  donnees<Session[]>(api.get(`/applications/${appId}/tests/sessions`, { params }));
export const lireTest = (problemeId: Id) =>
  donnees<{ test: TestCorrection | null; sessions: Session[] }>(api.get(`/problemes/${problemeId}/test`));
export const definirDescriptionTest = (problemeId: Id, description: string) =>
  donnees<{ id: Id; description: string }>(api.put(`/problemes/${problemeId}/test`, { description }));
export const descriptionProposee = (problemeId: Id) =>
  donnees<{ description: string }>(api.post(`/problemes/${problemeId}/test/description-proposee`));
export const demanderTest = (problemeId: Id, description?: string) =>
  donnees<Session>(api.post(`/problemes/${problemeId}/test/demander`, { description }));
export const detailSession = (id: Id) => donnees<DetailSession>(api.get(`/tests/sessions/${id}`));
export const prendreSession = (id: Id) => donnees<Session>(api.post(`/tests/sessions/${id}/prendre`));
export const retourSession = (id: Id, d: RetourTesteur) => donnees<Session>(api.post(`/tests/sessions/${id}/retour`, d));
