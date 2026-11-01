import { api, donnees } from "./client";
import type { Id, PropositionTaches, Tache, TacheCreation } from "./types";

export const listTaches = (params?: { application_id?: Id; statut?: string; responsable_id?: Id; mes_taches?: boolean; en_retard?: boolean }) =>
  donnees<Tache[]>(api.get("/taches", { params }));
export const tachesDuProbleme = (problemeId: Id) => donnees<Tache[]>(api.get(`/problemes/${problemeId}/taches`));
export const proposerTaches = (problemeId: Id) => donnees<PropositionTaches>(api.post(`/problemes/${problemeId}/taches/proposition`));
export const creerTaches = (problemeId: Id, taches: TacheCreation[]) => donnees<Tache[]>(api.post(`/problemes/${problemeId}/taches`, { taches }));
export const getTache = (id: Id) => donnees<Tache>(api.get(`/taches/${id}`));
export const modifierTache = (id: Id, d: Partial<{ titre: string; description: string; duree_estimee_h: number | null; responsable_id: Id | null; echeance: string | null }>) =>
  donnees<Tache>(api.patch(`/taches/${id}`, d));
export type ActionTache = "demarrer" | "pause" | "arreter" | "terminer";
export const actionTache = (id: Id, action: ActionTache) => donnees<Tache>(api.post(`/taches/${id}/${action}`));
export const ajouterSousTache = (id: Id, titre: string, origine: "ia" | "utilisateur" = "utilisateur") =>
  donnees<unknown>(api.post(`/taches/${id}/sous-taches`, { titre, origine }));
export const statutSousTache = (id: Id, sousTacheId: Id, statut: string) =>
  donnees<unknown>(api.patch(`/taches/${id}/sous-taches/${sousTacheId}/statut`, { statut }));
export const retirerSousTache = (id: Id, sousTacheId: Id) => donnees<unknown>(api.delete(`/taches/${id}/sous-taches/${sousTacheId}`));
export const ajouterCritereAcceptation = (id: Id, texte: string) =>
  donnees<unknown>(api.post(`/taches/${id}/criteres-acceptation`, { texte, origine: "utilisateur" }));
