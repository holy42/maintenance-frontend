import { api, donnees } from "./client";
import type { Application, Depot, Id, Membre, MesPermissions, VueEnsemble } from "./types";

export const listApplications = (params?: { statut?: string; q?: string; equipe_id?: Id }) =>
  donnees<Application[]>(api.get("/applications", { params }));
export const getApplication = (id: Id) => donnees<Application>(api.get(`/applications/${id}`));
export const creerApplication = (d: { equipe_id: Id; nom: string; description?: string; responsable_id?: Id; technologies: string[] }) =>
  donnees<Application>(api.post("/applications", d));
export const modifierApplication = (id: Id, d: Partial<{ nom: string; description: string; statut: string; responsable_id: Id | null; technologies: string[] }>) =>
  donnees<Application>(api.patch(`/applications/${id}`, d));
export const archiverApplication = (id: Id) => donnees<Application>(api.post(`/applications/${id}/archiver`));
export const restaurerApplication = (id: Id) => donnees<Application>(api.post(`/applications/${id}/restaurer`));
export const membresApplication = (id: Id) => donnees<Membre[]>(api.get(`/applications/${id}/membres`));
export const mesPermissions = (id: Id) => donnees<MesPermissions>(api.get(`/applications/${id}/mes-permissions`));
export const vueEnsemble = (id: Id) => donnees<VueEnsemble>(api.get(`/applications/${id}/vue-ensemble`));

export const getDepot = (id: Id) => donnees<Depot | null>(api.get(`/applications/${id}/depot`));
export const definirDepot = (id: Id, d: { url: string; branche_defaut: string; jeton?: string }) =>
  donnees<Depot>(api.put(`/applications/${id}/depot`, d));
export const testerDepot = (id: Id) => donnees<{ connecte: boolean; branches: string[] } | { message: string }>(api.post(`/applications/${id}/depot/tester`));
export const commitsDepot = (id: Id, branche: string) =>
  donnees<{ commit: string; auteur: string; date: string; sujet: string }[]>(api.get(`/applications/${id}/depot/commits`, { params: { branche } }));
