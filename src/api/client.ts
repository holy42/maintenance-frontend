import axios from "axios";

export const TOKEN_KEY = "maintenance.jeton";

export const api = axios.create({ baseURL: import.meta.env.VITE_API_URL ?? "/api/v1" });

// Le jeton est transmis à chaque appel. (Stocké en localStorage : simple mais exposé en cas de faille XSS ;
// une alternative est un cookie httpOnly géré par le backend.)
api.interceptors.request.use((config) => {
  const jeton = localStorage.getItem(TOKEN_KEY);
  if (jeton) config.headers.Authorization = `Bearer ${jeton}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (erreur) => {
    if (axios.isAxiosError(erreur) && erreur.response?.status === 401 && !window.location.pathname.startsWith("/connexion")) {
      localStorage.removeItem(TOKEN_KEY);
      window.location.assign("/connexion");
    }
    return Promise.reject(erreur);
  },
);

/** Message lisible pour une erreur de l'API (erreurs métier, validation 422, réseau). */
export function messageErreur(erreur: unknown): string {
  if (axios.isAxiosError(erreur)) {
    const detail = erreur.response?.data?.detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) return detail.map((d: { msg?: string }) => d.msg ?? "Valeur invalide").join(" ; ");
    if (!erreur.response) return "Le serveur est injoignable.";
    if (erreur.response.status === 503) return "Le service d'IA est indisponible. Le reste de l'application fonctionne.";
    return `Erreur ${erreur.response.status}.`;
  }
  return erreur instanceof Error ? erreur.message : "Erreur inattendue.";
}

export const donnees = <T,>(promesse: Promise<{ data: T }>): Promise<T> => promesse.then((r) => r.data);
