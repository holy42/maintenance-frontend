import { useEffect } from "react";
import { EVENEMENT_DONNEES_MODIFIEES } from "../utils/actualisation";

export function useActualisationDonnees(actualiser: () => void) {
  useEffect(() => {
    window.addEventListener(EVENEMENT_DONNEES_MODIFIEES, actualiser);
    return () => window.removeEventListener(EVENEMENT_DONNEES_MODIFIEES, actualiser);
  }, [actualiser]);
}
