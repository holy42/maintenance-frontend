import { api, donnees } from "./client";
import type { Id, MessageDiscussion, MessageIA, Note, Salon } from "./types";

export const notesProbleme = (id: Id) => donnees<Note[]>(api.get(`/problemes/${id}/notes`));
export const ajouterNoteProbleme = (id: Id, contenu: string, type: string) => donnees<Note>(api.post(`/problemes/${id}/notes`, { contenu, type }));
export const notesTache = (id: Id) => donnees<Note[]>(api.get(`/taches/${id}/notes`));
export const ajouterNoteTache = (id: Id, contenu: string, type: string) => donnees<Note>(api.post(`/taches/${id}/notes`, { contenu, type }));
export const modifierNote = (id: Id, contenu: string) => donnees<Note>(api.patch(`/notes/${id}`, { contenu }));
export const supprimerNote = (id: Id) => donnees<{ message: string }>(api.delete(`/notes/${id}`));

export const listSalons = (appId: Id) => donnees<Salon[]>(api.get(`/applications/${appId}/salons`));
export const creerSalon = (appId: Id, titre: string) => donnees<Salon>(api.post(`/applications/${appId}/salons`, { titre }));
export const supprimerSalon = (id: Id) => donnees<{ message: string }>(api.delete(`/salons/${id}`));
export const messagesSalon = (id: Id) => donnees<MessageDiscussion[]>(api.get(`/salons/${id}/messages`));
export const publierMessage = (id: Id, d: { contenu: string; parent_id?: Id | null; tache_id?: Id | null }) =>
  donnees<MessageDiscussion>(api.post(`/salons/${id}/messages`, d));
export const modifierMessage = (id: Id, contenu: string) => donnees<MessageDiscussion>(api.patch(`/messages/${id}`, { contenu }));
export const supprimerMessage = (id: Id) => donnees<{ message: string }>(api.delete(`/messages/${id}`));
export const marquerSalonLu = (id: Id) => donnees<{ message: string }>(api.post(`/salons/${id}/lu`));

export const messagesIA = (problemeId: Id) => donnees<MessageIA[]>(api.get(`/problemes/${problemeId}/assistant/messages`));
export const poserQuestion = (problemeId: Id, d: { question: string; tache_id?: Id | null; sous_tache_id?: Id | null }) =>
  donnees<MessageIA>(api.post(`/problemes/${problemeId}/assistant/messages`, d));
export const proposerSolution = (problemeId: Id, messageId: Id) =>
  donnees<unknown>(api.post(`/problemes/${problemeId}/assistant/messages/${messageId}/proposer-solution`));
export const partagerDansSalon = (problemeId: Id, messageId: Id) =>
  donnees<MessageDiscussion>(api.post(`/problemes/${problemeId}/assistant/messages/${messageId}/partager-salon`));
