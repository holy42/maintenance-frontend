export type Id = number;

export interface Utilisateur { id: Id; identifiant: string; email: string | null; est_admin: boolean; actif: boolean; cree_le: string }
export interface Annuaire { id: Id; identifiant: string }
export interface Equipe { id: Id; nom: string; description: string | null }
export interface Membre { utilisateur_id: Id; identifiant: string; role_id: Id; role: string }
export interface Role { id: Id; nom: string; description: string | null }
export interface Permission { id: Id; code: string; description: string | null }

export interface Application {
  id: Id; equipe_id: Id; nom: string; description: string | null;
  statut: "active" | "en_maintenance" | "archivee"; responsable_id: Id | null; cree_le: string; technologies: string[];
}
export interface Depot { id: Id; application_id: Id; url: string; branche_defaut: string; derniere_synchro_le: string | null; jeton_configure: boolean }
export interface MesPermissions { permissions: string[]; est_admin: boolean; archivee: boolean }
export interface VueEnsemble {
  problemes_ouverts: number; problemes_critiques: number; taches_en_cours: number; taches_en_retard: number;
  tests_en_attente: number; corrections_en_attente_de_test: number;
  derniere_verification: { id: Id; branche: string; commit: string | null; statut: string; resultat_global: string | null; debut_le: string } | null;
}

export type Categorie = "erreur_technique" | "fonctionnel" | "nouvelle_fonctionnalite" | "regression" | "securite" | "propre_application";
export type Gravite = "critique" | "elevee" | "moyenne" | "faible";
export type Priorite = "urgente" | "haute" | "normale" | "basse";
export type StatutProbleme = "nouveau" | "a_analyser" | "confirme" | "faux_positif" | "en_cours" | "a_tester" | "teste" | "termine" | "rouvert";
export type StatutTache = "a_faire" | "en_cours" | "en_pause" | "arretee" | "terminee";

export interface FormulationStructuree { condition: string; attendu: string; portee?: string | null }
export interface Critere {
  id: Id; application_id: Id | null; createur_id: Id | null; nom: string; description: string;
  formulation_structuree: Record<string, unknown> | null; origine: "standard" | "personnalisee"; categorie: Categorie;
  automatisabilite: string; mode_verification: string | null; statut: string; valide_par: Id | null; cree_le: string;
}
export interface PropositionCritere {
  nom: string; formulation: FormulationStructuree; categorie: Categorie;
  automatisabilite: "automatisable" | "partielle" | "humaine"; mode_verification: string | null; incertitudes: string[];
}
export interface CritereCreation {
  nom: string; description: string; categorie: Categorie; automatisabilite: string; mode_verification: string | null;
  formulation_structuree: Record<string, unknown> | null;
}

export interface Verification {
  id: Id; application_id: Id; branche: string; commit_analyse: string | null; perimetre: string | null; declenchee_par: Id;
  statut: "en_attente" | "en_cours" | "terminee" | "echouee"; motif_echec: string | null; avec_interpretation_ia: boolean;
  resultat_global: string | null; debut_le: string; fin_le: string | null;
}
export interface VerificationCreation { branche: string; dossiers: string[]; exclusions: string[]; critere_ids: Id[]; avec_interpretation_ia: boolean }
/** Fiabilité ESTIMÉE par notre modèle (étape 3 : l'anomalie est-elle réelle ? étape 6 : la solution sera-t-elle validée ?).
 *  Distincte de la confiance déclarée par Gemini. `appris` est faux pour le score de départ par règles. */
export interface FacteurFiabilite { variable: string; libelle: string; effet: number; sens: "augmente" | "diminue" }
export interface Fiabilite {
  etape: 3 | 6; score: number; pourcentage: number; niveau: "faible" | "moyen" | "eleve"; libelle_niveau: string;
  source: "modele" | "heuristique"; appris: boolean; modele_id: Id | null; facteurs: FacteurFiabilite[]; etiquette?: boolean | null;
}
export interface VerificationRecommandee { texte: string; controle: "ok" | "a_verifier"; origine: "ia" | "regle"; motif?: string }
export interface RapportMetriques {
  n: number; prevalence: number; auc: number | null; brier: number | null; log_loss: number | null; ece: number | null;
  precision: number | null; rappel: number | null; f1: number | null; auc_ic95?: (number | null)[];
}
export interface ModeleFiabiliteVersion {
  id: Id; etape: 3 | 6; version: number; algorithme: "logistique" | "foret"; nb_exemples: number | null; actif: boolean;
  entraine_par: Id | null; entraine_le: string;
  metriques: {
    validation_croisee_apres_calibration?: RapportMetriques; validation_croisee_avant_calibration?: RapportMetriques;
    comparaison?: { n: number; recommande: string; modeles: Record<string, RapportMetriques> };
  } | null;
}
export interface ApercuFiabilite {
  etape: 3 | 6; exemples_etiquetes: number; reels: number; faux: number; minimum_requis: number; minimum_par_classe: number; version_active: number | null;
}

export interface Resultat {
  id: Id; verification_id: Id; critere_id: Id | null; source: "outil" | "ia" | "humain"; outil: string | null; categorie: Categorie;
  gravite: Gravite | null; fichier: string | null; ligne_debut: number | null; ligne_fin: number | null; fonction: string | null;
  extrait_code: string | null; message: string; elements_preuve: string | null;
  statut_validation: "non_valide" | "confirme" | "ecarte"; motif_decision: string | null; decide_le: string | null;
  fiabilite: Fiabilite | null;
}

export interface Probleme {
  id: Id; code: string; application_id: Id; resultat_id: Id | null; verification_id: Id | null; critere_id: Id | null;
  source: "outil" | "ia" | "humain"; titre: string; description: string | null; comportement_attendu: string | null;
  comportement_observe: string | null; categorie: Categorie; gravite: Gravite | null; priorite: Priorite | null;
  statut: StatutProbleme; fichier: string | null; ligne_debut: number | null; ligne_fin: number | null; fonction: string | null;
  extrait_code: string | null; niveau_confiance: number | string | null; responsable_id: Id | null; echeance: string | null;
  cree_le: string; modifie_le: string;
  fiabilite_preuve?: Fiabilite | null;
}
export interface ProblemeCreation {
  titre: string; categorie: Categorie; description?: string; comportement_attendu?: string; comportement_observe?: string;
  gravite?: Gravite; priorite?: Priorite; responsable_id?: Id; echeance?: string;
}
export interface Solution {
  id: Id; diagnostic_id: Id; description: string; extrait_code: string | null; format_code: string | null;
  risques: string | null; tests_suggeres: string | null; cree_le: string; fiabilite?: Fiabilite | null;
}
export interface Diagnostic {
  id: Id; probleme_id: Id; explication: string; causes_probables: string[] | null; niveau_confiance: number | string | null;
  incertitudes: string | null; branche_analysee: string | null; commit_reference: string | null; modele_ia: string | null;
  cree_le: string; solutions: Solution[]; verifications_recommandees?: VerificationRecommandee[] | null;
}
export type TypeDecision = "ia_retenue" | "ia_adaptee" | "autre_solution" | "sans_ia";
export interface DecisionCreation {
  type_decision: TypeDecision; solution_ids: Id[]; description_alternative?: string; extrait_code_alternatif?: string;
  justification?: string; motif_non_utilisation?: "pas_utile" | "fausse" | "autre_trouvee"; commit_associe?: string; pull_request?: string;
}
export interface Decision {
  id: Id; probleme_id: Id; developpeur_id: Id; type_decision: TypeDecision; description_alternative: string | null;
  extrait_code_alternatif: string | null; justification: string | null; motif_non_utilisation: string | null;
  commit_associe: string | null; pull_request: string | null; cree_le: string; solution_ids: Id[];
}

export interface SousTache { id: Id; titre: string; description: string | null; statut: StatutTache; ordre: number; origine: "ia" | "utilisateur" }
export interface CritereAcceptation { id: Id; texte: string; ordre: number; origine: "ia" | "utilisateur" }
export interface Tache {
  id: Id; probleme_id: Id; application_id: Id; titre: string; description: string | null; origine: "ia" | "utilisateur";
  duree_estimee_h: number | string | null; statut: StatutTache; responsable_id: Id | null; echeance: string | null;
  cree_le: string; debut_le: string | null; fin_le: string | null; sous_taches: SousTache[]; criteres_acceptation: CritereAcceptation[];
}
export interface TacheCreation {
  titre: string; description?: string; origine: "ia" | "utilisateur"; duree_estimee_h?: number | null; responsable_id?: Id | null;
  echeance?: string | null; solution_ids: Id[];
  sous_taches: { titre: string; description?: string; origine: "ia" | "utilisateur" }[];
  criteres_acceptation: { texte: string; origine: "ia" | "utilisateur" }[];
}
export interface PropositionTaches {
  taches: { titre: string; description: string | null; duree_estimee_h: number | null;
    sous_taches: { titre: string; description: string | null }[]; criteres_acceptation: string[] }[];
}

export interface TestCorrection { id: Id; description: string; origine: string; cree_le: string }
export interface Session {
  id: Id; application_id: Id; test_id: Id; numero: number; decision_id: Id | null; demande_par: Id; testeur_id: Id | null;
  branche_testee: string; commit_teste: string | null; environnement: string | null;
  statut: "a_tester" | "en_cours" | "valide" | "non_valide"; commentaire: string | null; preuve: string | null;
  demande_le: string; pris_le: string | null; decide_le: string | null;
  probleme_id?: Id | null; probleme_code?: string | null; probleme_titre?: string | null;
}
export interface DetailSession { session: Session; probleme_id: Id; description_test: string; criteres_acceptation: CritereAcceptation[] }
export interface RetourTesteur {
  valide: boolean; commentaire?: string; preuve?: string; environnement?: string; commit_teste?: string;
  criteres: { critere_acceptation_id: Id; satisfait: boolean; commentaire?: string }[];
}

export interface Note { id: Id; probleme_id: Id | null; tache_id: Id | null; auteur_id: Id; type: "note_interne" | "commentaire_correction"; contenu: string; cree_le: string; modifie_le: string | null; supprime_le: string | null }
export interface Salon { id: Id; application_id: Id; type: "general" | "probleme"; probleme_id: Id | null; titre: string; archive: boolean; cree_le: string; non_lus: number }
export interface MessageDiscussion { id: Id; salon_id: Id; parent_id: Id | null; tache_id: Id | null; auteur_id: Id | null; type: "utilisateur" | "systeme"; contenu: string; cree_le: string; modifie_le: string | null; supprime_le: string | null }
export interface MessageIA {
  id: Id; conversation_id: Id; emetteur: "utilisateur" | "assistant"; auteur_id: Id | null; contenu: string;
  contexte_utilise: Record<string, unknown> | null; informations_manquantes: string | null; niveau_confiance: number | string | null;
  solution_id: Id | null; tache_id: Id | null; sous_tache_id: Id | null; cree_le: string;
}
export interface Notification { id: Id; application_id: Id | null; type_evenement: string; message: string; type_element: string | null; element_id: Id | null; lu: boolean; cree_le: string }
export interface Preference { type_evenement: string; active: boolean }
export interface Evenement {
  id: Id; application_id: Id | null; type_element: string; element_id: Id; auteur_id: Id | null; action: string;
  ancienne_valeur: Record<string, unknown> | null; nouvelle_valeur: Record<string, unknown> | null; commentaire: string | null; cree_le: string;
}

export interface Comptage { nb: number }
export interface RapportProblemesTaches {
  periode_jours: number; problemes_crees: number; problemes_termines: number;
  par_gravite: { gravite: string | null; nb: number }[]; par_categorie: { categorie: string; nb: number }[];
  par_application: { application_id: Id; nb: number }[]; evolution: { mois: string; nb: number }[];
  temps_moyen_resolution: { gravite: string | null; nb_resolus: number; duree_moyenne: number | string | null }[];
  taches: { statut: string; nb: number; nb_en_retard: number }[];
}
export interface RapportIaTests {
  decisions_correction: { type_decision: string; nb: number }[]; utilite_solutions_ia: { utilite_percue: string; nb: number }[];
  faux_positifs: { application_id: Id; categorie: string; nb_total: number; nb_faux_positifs: number; taux_pct: number }[];
  validation_tests: { application_id: Id; nb_valides: number; nb_non_valides: number; nb_en_attente: number; taux_validation_pct: number | null }[];
  problemes_rouverts: { application_id: Id; nb_reouvertures: number; nb_problemes_concernes: number }[];
  validation_par_decision: { application_id: Id; type_decision: string; nb_valides: number; nb_non_valides: number; nb_en_attente: number }[];
  avertissement: string;
}
