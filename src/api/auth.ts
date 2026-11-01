import { api, donnees } from "./client";
import type { Annuaire, Utilisateur } from "./types";

export const login = (identifiant: string, mot_de_passe: string) =>
  donnees<{ access_token: string }>(api.post("/auth/login", { identifiant, mot_de_passe }));
export const moi = () => donnees<Utilisateur>(api.get("/auth/me"));
export const annuaire = () => donnees<Annuaire[]>(api.get("/auth/annuaire"));
export const motDePasseOublie = (identifiant_ou_email: string) =>
  donnees<{ message: string }>(api.post("/auth/mot-de-passe-oublie", { identifiant_ou_email }));
export const reinitialiser = (jeton: string, nouveau_mot_de_passe: string) =>
  donnees<{ message: string }>(api.post("/auth/reinitialiser-mot-de-passe", { jeton, nouveau_mot_de_passe }));
export const changerMotDePasse = (ancien_mot_de_passe: string, nouveau_mot_de_passe: string) =>
  donnees<{ message: string }>(api.post("/auth/changer-mot-de-passe", { ancien_mot_de_passe, nouveau_mot_de_passe }));
