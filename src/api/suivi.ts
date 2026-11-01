import { api, donnees } from "./client";
import type { Evenement, Id, Notification, Preference, RapportIaTests, RapportProblemesTaches } from "./types";

export const notifications = (params?: { non_lues?: boolean; type_evenement?: string; application_id?: Id; limit?: number }) =>
  donnees<Notification[]>(api.get("/notifications", { params }));
export const compteurNotifications = () => donnees<{ non_lues: number }>(api.get("/notifications/compteur"));
export const toutLire = () => donnees<{ message: string }>(api.post("/notifications/tout-lire"));
export const marquerLue = (id: Id) => donnees<Notification>(api.post(`/notifications/${id}/lue`));
export const marquerNonLue = (id: Id) => donnees<Notification>(api.post(`/notifications/${id}/non-lue`));
export const preferences = () => donnees<Preference[]>(api.get("/notifications/preferences"));
export const definirPreferences = (p: Preference[]) => donnees<{ message: string }>(api.put("/notifications/preferences", p));

export const historique = (params?: { application_id?: Id; type_element?: string; auteur_id?: Id; action?: string; jours?: number; limit?: number }) =>
  donnees<Evenement[]>(api.get("/historique", { params }));

export const rapportProblemesTaches = (params?: { application_id?: Id; jours?: number }) =>
  donnees<RapportProblemesTaches>(api.get("/rapports/problemes-taches", { params }));
export const rapportIaTests = (params?: { application_id?: Id }) => donnees<RapportIaTests>(api.get("/rapports/ia-tests", { params }));
export const enregistrerRapport = (d: { type: "problemes_taches" | "ia_tests"; application_id?: Id; jours?: number }) =>
  donnees<{ id: Id; genere_le: string }>(api.post("/rapports", d));
