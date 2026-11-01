import { api, donnees } from "./client";
import type { Equipe, Id, Membre, Permission, Role, Utilisateur } from "./types";

export const listUtilisateurs = () => donnees<Utilisateur[]>(api.get("/utilisateurs"));
export const creerUtilisateur = (d: { identifiant: string; email?: string; mot_de_passe: string; est_admin: boolean }) =>
  donnees<Utilisateur>(api.post("/utilisateurs", d));
export const desactiverUtilisateur = (id: Id) => donnees<Utilisateur>(api.post(`/utilisateurs/${id}/desactiver`));
export const reactiverUtilisateur = (id: Id) => donnees<Utilisateur>(api.post(`/utilisateurs/${id}/reactiver`));
export const reinitialiserMotDePasseUtilisateur = (id: Id) =>
  donnees<{ message: string }>(api.post(`/utilisateurs/${id}/reinitialiser-mot-de-passe`));

export const listEquipes = () => donnees<Equipe[]>(api.get("/equipes"));
export const creerEquipe = (d: { nom: string; description?: string }) => donnees<Equipe>(api.post("/equipes", d));
export const modifierEquipe = (id: Id, d: { nom: string; description?: string }) => donnees<Equipe>(api.patch(`/equipes/${id}`, d));
export const membresEquipe = (id: Id) => donnees<Membre[]>(api.get(`/equipes/${id}/membres`));
export const attribuerRole = (equipeId: Id, utilisateur_id: Id, role_id: Id) =>
  donnees<{ message: string }>(api.post(`/equipes/${equipeId}/membres`, { utilisateur_id, role_id }));
export const retirerMembre = (equipeId: Id, utilisateurId: Id) =>
  donnees<{ message: string }>(api.delete(`/equipes/${equipeId}/membres/${utilisateurId}`));

export const listRoles = () => donnees<Role[]>(api.get("/roles"));
export const listPermissions = () => donnees<Permission[]>(api.get("/permissions"));
export const permissionsDuRole = (id: Id) => donnees<Permission[]>(api.get(`/roles/${id}/permissions`));
export const definirPermissions = (id: Id, permission_ids: Id[]) =>
  donnees<{ message: string }>(api.put(`/roles/${id}/permissions`, { permission_ids }));
