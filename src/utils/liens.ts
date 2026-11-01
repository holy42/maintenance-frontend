import type { Notification } from "../api/types";

/** Lien direct vers l'élément concerné par une notification. */
export function lienNotification(n: Pick<Notification, "application_id" | "type_element" | "element_id">): string | null {
  if (!n.application_id || !n.type_element || !n.element_id) return null;
  const base = `/applications/${n.application_id}`;
  switch (n.type_element) {
    case "probleme": return `${base}/problemes/${n.element_id}`;
    case "tache": return `${base}/taches/${n.element_id}`;
    case "salon": return `${base}/discussions/${n.element_id}`;
    case "verification": return `${base}/verifications/${n.element_id}`;
    case "session_test": return `${base}/tests/${n.element_id}`;
    default: return null;
  }
}
