import { createBrowserRouter } from "react-router-dom";
import RequireAdmin from "./guards/RequireAdmin";
import RequireAuth from "./guards/RequireAuth";
import ApplicationLayout from "./layouts/ApplicationLayout";
import AuthLayout from "./layouts/AuthLayout";
import GlobalLayout from "./layouts/GlobalLayout";
import ProblemeLayout from "./layouts/ProblemeLayout";
import Accueil from "./pages/Accueil";
import MonCompte from "./pages/MonCompte";
import NotFound from "./pages/NotFound";
import Equipes from "./pages/admin/Equipes";
import ModelesFiabilite from "./pages/admin/ModelesFiabilite";
import RolesPermissions from "./pages/admin/RolesPermissions";
import Utilisateurs from "./pages/admin/Utilisateurs";
import ApplicationsGestion from "./pages/applications/ApplicationsGestion";
import DepotGit from "./pages/applications/DepotGit";
import Membres from "./pages/applications/Membres";
import Parametres from "./pages/applications/Parametres";
import VueEnsemble from "./pages/applications/VueEnsemble";
import Connexion from "./pages/auth/Connexion";
import MotDePasseOublie from "./pages/auth/MotDePasseOublie";
import ReinitialiserMotDePasse from "./pages/auth/ReinitialiserMotDePasse";
import CritereNouveau from "./pages/criteres/CritereNouveau";
import CriteresListe from "./pages/criteres/CriteresListe";
import Discussions from "./pages/discussions/Discussions";
import ProblemeDecision from "./pages/problemes/ProblemeDecision";
import ProblemeDiagnostic from "./pages/problemes/ProblemeDiagnostic";
import ProblemeHistorique from "./pages/problemes/ProblemeHistorique";
import ProblemeNotes from "./pages/problemes/ProblemeNotes";
import ProblemeResume from "./pages/problemes/ProblemeResume";
import ProblemesListe from "./pages/problemes/ProblemesListe";
import ProblemeTaches from "./pages/problemes/ProblemeTaches";
import ProblemeTest from "./pages/problemes/ProblemeTest";
import Historique from "./pages/suivi/Historique";
import Notifications from "./pages/suivi/Notifications";
import Rapports from "./pages/suivi/Rapports";
import TacheDetail from "./pages/taches/TacheDetail";
import TacheNouvelle from "./pages/taches/TacheNouvelle";
import TachesListe from "./pages/taches/TachesListe";
import TestSession from "./pages/tests/TestSession";
import TestsListe from "./pages/tests/TestsListe";
import ResultatDetail from "./pages/verifications/ResultatDetail";
import VerificationNouvelle from "./pages/verifications/VerificationNouvelle";
import VerificationResultats from "./pages/verifications/VerificationResultats";
import VerificationsListe from "./pages/verifications/VerificationsListe";

/**
 * Deux niveaux de navigation :
 *  1. le menu global (GlobalLayout) : vues agrégées de toutes les applications accessibles ;
 *  2. l'espace d'une application (ApplicationLayout) : menu horizontal, données limitées à l'application.
 * Les pages communes (problèmes, tâches, tests, vérifications, historique, notifications, rapports) servent aux
 * deux niveaux : elles lisent l'application courante si elle existe, sinon elles agrègent.
 */
export const router = createBrowserRouter([
  {
    element: <AuthLayout />,
    children: [
      { path: "/connexion", element: <Connexion /> },
      { path: "/mot-de-passe-oublie", element: <MotDePasseOublie /> },
      { path: "/reinitialiser-mot-de-passe", element: <ReinitialiserMotDePasse /> },
    ],
  },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <GlobalLayout />,
        children: [
          { index: true, element: <Accueil /> },
          { path: "applications", element: <ApplicationsGestion /> },
          {
            path: "applications/:applicationId",
            element: <ApplicationLayout />,
            children: [
              { index: true, element: <VueEnsemble /> },
              { path: "verifications", element: <VerificationsListe /> },
              { path: "verifications/nouvelle", element: <VerificationNouvelle /> },
              { path: "verifications/:verificationId", element: <VerificationResultats /> },
              { path: "verifications/:verificationId/resultats/:resultatId", element: <ResultatDetail /> },
              { path: "problemes", element: <ProblemesListe /> },
              {
                path: "problemes/:problemeId",
                element: <ProblemeLayout />,
                children: [
                  { index: true, element: <ProblemeResume /> },
                  { path: "diagnostic", element: <ProblemeDiagnostic /> },
                  { path: "decision", element: <ProblemeDecision /> },
                  { path: "taches", element: <ProblemeTaches /> },
                  { path: "tests", element: <ProblemeTest /> },
                  { path: "notes", element: <ProblemeNotes /> },
                  { path: "historique", element: <ProblemeHistorique /> },
                ],
              },
              { path: "taches", element: <TachesListe /> },
              { path: "taches/nouvelle", element: <TacheNouvelle /> },
              { path: "taches/:tacheId", element: <TacheDetail /> },
              { path: "tests", element: <TestsListe /> },
              { path: "tests/:sessionId", element: <TestSession /> },
              { path: "discussions", element: <Discussions /> },
              { path: "discussions/:salonId", element: <Discussions /> },
              { path: "criteres", element: <CriteresListe /> },
              { path: "criteres/nouveau", element: <CritereNouveau /> },
              { path: "depot", element: <DepotGit /> },
              { path: "historique", element: <Historique /> },
              { path: "rapports", element: <Rapports /> },
              { path: "notifications", element: <Notifications /> },
              { path: "membres", element: <Membres /> },
              { path: "parametres", element: <Parametres /> },
            ],
          },
          { path: "problemes", element: <ProblemesListe /> },
          { path: "verifications", element: <VerificationsListe /> },
          { path: "taches", element: <TachesListe /> },
          { path: "tests", element: <TestsListe /> },
          { path: "historique", element: <Historique /> },
          { path: "notifications", element: <Notifications /> },
          { path: "rapports", element: <Rapports /> },
          { path: "compte", element: <MonCompte /> },
          {
            path: "administration",
            element: <RequireAdmin />,
            children: [
              { path: "utilisateurs", element: <Utilisateurs /> },
              { path: "equipes", element: <Equipes /> },
              { path: "roles", element: <RolesPermissions /> },
              { path: "modele-fiabilite", element: <ModelesFiabilite /> },
            ],
          },
          { path: "*", element: <NotFound /> },
        ],
      },
    ],
  },
]);
