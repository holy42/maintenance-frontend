/** Codes de permission (identiques à ceux du backend). Masquer un bouton n'est PAS une protection :
 *  le serveur contrôle les droits à chaque requête. */
export const PERM = {
  PROBLEME_CONSULTER: "probleme.consulter",
  PROBLEME_MODIFIER: "probleme.modifier",
  VERIFICATION_LANCER: "verification.lancer",
  SOLUTION_DECIDER: "solution.decider",
  TEST_VALIDER: "test.valider",
  HISTORIQUE_CONSULTER: "historique.consulter",
  RAPPORT_CONSULTER: "rapport.consulter",
  DISCUSSION_PARTICIPER: "discussion.participer",
  ASSISTANT_UTILISER: "assistant.utiliser",
  CRITERE_GERER: "critere.gerer",
  TACHE_GERER: "tache.gerer",
  APPLICATION_CONFIGURER: "application.configurer",
  SALON_SUPPRIMER: "salon.supprimer",
} as const;
