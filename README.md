# Frontend : plateforme de maintenance multi-applications

React + TypeScript + MUI (Material UI) + React Router + Axios, construit avec Vite.
**Squelette généré mais jamais lancé** : aucune dépendance n'était installable dans l'environnement de génération.
Le code a seulement été vérifié par le compilateur TypeScript contre des déclarations simplifiées de React, React Router,
Axios et MUI (0 erreur), et ses appels à l'API ont été comparés aux routes du backend (tous correspondent).
Les vrais types des bibliothèques peuvent révéler des erreurs : lancez `npm run typecheck` en premier.

## À télécharger / installer vous-même

| Quoi | Remarque |
|---|---|
| Node.js (version LTS récente) et npm | à vérifier selon les versions de Vite et de TypeScript installées |
| `npm install` | installe les dépendances de `package.json` |
| Le backend lancé sur http://localhost:8000 | voir `../backend/README.md` |

Versions : `package.json` utilise des plages de versions majeures (React 18, MUI 6, React Router 6, Vite 5, TypeScript 5)
choisies de mémoire et **non vérifiées**. Le code n'emploie que des API communes aux versions récentes de MUI (pas de `Grid`).
Après installation, figez les versions réellement installées.

## Mise en route

```bash
cp .env.example .env        # facultatif : en développement, /api est relayé vers le backend par Vite
npm install
npm run typecheck           # à lancer en premier
npm run dev                 # http://localhost:5173
npm run build               # production
```
Connexion : l'administrateur créé par `python -m app.jobs.seed --admin ...` côté backend.

## Navigation à deux niveaux

1. **Menu global** (`layouts/GlobalLayout`, `Sidebar`) : à gauche, rétractable (deux préférences mémorisées : hors application et
   dans une application, où il se rétrécit par défaut). « Applications » se déplie (gestion + accès rapide aux applications).
   Sélecteur d'équipe en haut. Section « Administration » réservée à l'administrateur.
2. **Espace d'une application** (`layouts/ApplicationLayout`) : menu **horizontal** (six onglets + « Plus » : critères, dépôt Git,
   historique, rapports, notifications, membres, paramètres), fil d'Ariane, nom et statut toujours visibles.

Les pages communes (problèmes, tâches, tests, vérifications, historique, notifications, rapports) servent aux deux niveaux : elles
lisent l'application courante si elle existe, sinon elles **agrègent** les applications accessibles sans perdre l'origine.

## Structure

```
src/
  main.tsx  AppProviders.tsx  router.tsx  theme.ts
  api/          client Axios (jeton, erreurs), types, une fonction par route du backend (par domaine)
  context/      Auth, Annuaire (noms), Applications, Equipe, Sidebar, Snackbar, Application, Probleme
  hooks/        useAsync (chargement), usePolling (suivi d'une vérification)
  layouts/      GlobalLayout (+ Sidebar, TopBar), ApplicationLayout, ProblemeLayout, AuthLayout
  guards/       RequireAuth, RequireAdmin
  components/   PageHeader, Etat, StatutChip, SourceBadge, CodeBlock, DiffBlock, BarreConfiance, AssistantIAPanel, ...
  pages/        auth, admin, applications, criteres, verifications, problemes, taches, tests, discussions, suivi
  utils/        libellés français et couleurs, formats, permissions, transitions, liens de notification
```

## Principes appliqués dans l'interface

- Distinction **outil / hypothèse de l'IA / décision humaine** (badges), « Ce que l'IA ne sait pas », niveau de confiance en pourcentage.
- Le code proposé par l'IA est **affiché et copiable, jamais appliqué** ; l'assistant propose et ne modifie jamais le code.
- Boutons masqués selon les permissions (`GET /applications/{id}/mes-permissions`) : **simple confort**, le serveur contrôle les droits.
- Conversation de l'assistant IA **commune** à l'équipe ; « Demander de l'aide » (tâche, sous-tâche) redirige vers elle.
- Historique en lecture seule ; notes et messages modifiables par leur seul auteur.

## Limites et points à décider

- **Aucun test frontend** n'est fourni (le choix d'un outil de test n'est pas fait).
- **Pas de bibliothèque de glisser-déposer, de graphiques ni de coloration de code** (choix non tranchés) : Kanban sans glisser-déposer,
  rapports en barres MUI, extraits de code en simple affichage avec numéros de ligne et différences colorées.
- `utils/transitions.ts` **duplique** les transitions du backend pour ne proposer que les statuts valides : à garder synchronisé.
- Jeton d'authentification stocké en `localStorage` (simple, mais exposé en cas de faille XSS) : alternative = cookie httpOnly côté backend.
- Vues globales « Vérifications » et « Tests » : un appel par application (acceptable pour quelques applications).
- L'accueil calcule ses indicateurs à partir des 200 problèmes les plus récents ; le sélecteur d'équipe ne filtre que les listes d'applications.
- **Absent faute d'API dédiée** : « proposer d'autres sous-tâches » sur une tâche existante, et saisie du résultat d'un critère à validation
  humaine (on crée un problème manuellement à la place).
- La recherche globale ne porte que sur les problèmes (code ou titre).

## Modifications faites côté backend pour cette interface

`GET /auth/annuaire` (noms des personnes), `GET /applications/{id}/mes-permissions`, technologies dans la réponse des applications,
code et titre du problème dans la liste des passages de test.
