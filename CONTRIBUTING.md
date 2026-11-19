# Guide de contribution et règles de gestion 

Ce document définit les règles de collaboration de notre équipe (4 personnes réparties entre la Montagne, les Antilles et Brest, avec 1h de synchronisation commune maximum par jour). **Chaque règle répond directement à un risque identifié dans `docs/risques.md`.**

---

## 1. Relectures de code (Pull Requests) et gestion des absences
*Risques traités : R1 (Déploiement code cassé), R3 (Goulot d'étranglement des revues), R6 (Coupures réseau Montagne).*

- **Nombre de relecteurs requis :** **1 seul relecteur** par Pull Request (vers `preprod` ou `main`). Exiger 2 relecteurs paralyserait une équipe de 4 personnes soumise au décalage horaire.
- **Mode opératoire "Async-First" :** Avec 1h commune par jour, toute PR doit être **auto-porteuse** (description claire, numéro d'issue liée, preuve de passage des tests locaux). Le relecteur s'engage à relire sous **12 heures maximum**.
- **Que faire si le seul relecteur compétent est absent ou hors-ligne (coupure réseau montagne / décalage Antilles) ?**
  - **Cas standard (feature non urgente) :** La PR est réassignée à un autre membre disponible de l'équipe. La règle des "4 yeux" s'applique : personne ne valide son propre code.
  - **Cas critique (hotfix bloquant la production) :** Si aucun relecteur n'est joignable dans les 30 minutes, la **Lead Dev** (rôle `Repository admin`) utilise son droit de **Bypass exceptionnel** sur le Ruleset GitHub. Elle doit obligatoirement documenter la raison, l'heure et l'absence constatée en commentaire de la PR.

---

## 2. Statut du développeur freelance
*Risques traités : R1 (Push sauvage), R3 (Frustration / surcoût lié à l'attente).*

Le développeur freelance est payé à l'heure et ne veut pas perdre son temps à attendre des revues :
- **Soumission aux mêmes règles de sécurité :** Il n'a **aucun droit de push direct** sur `main` ou `preprod` (les bugs d'un freelance coûtent aussi cher que ceux d'un interne).
- **Zéro temps mort garanti par notre organisation :**
  1. Il découpe son travail en **petites PR atomiques** (revues en moins de 15 minutes).
  2. Pendant qu'une PR est en attente de revue asynchrone, il enchaîne immédiatement sur l'issue suivante sur une nouvelle branche (`feat/...` créée depuis `preprod`) sans rester bloqué.
  3. Ses PR sont traitées en priorité lors du créneau commun quotidien de 1h.

---

## 3. Conventions de nommage (Branches & Commits)
*Risques traités : R2 (Traçabilité), R3 (Compréhension asynchrone), R6 (Petits lots).*

### Nommage des branches
Format : `<type>/<numero-issue>-<description-courte-kebab-case>`
- `feat/12-gestion-stock` (nouvelle fonctionnalité)
- `fix/15-validation-commande` (correction de bug)
- `hotfix/18-crash-db-prod` (urgence production depuis `main`)
- `chore/03-setup-ci` (tâche technique, CI/CD, documentation)

### Messages de commit (Conventional Commits)
Format : `<type>(<portée>): <description impérative en français>`
- Exemples :
  - `feat(orders): refuser une commande si le stock est insuffisant`
  - `fix(db): corriger le script de migration de la table products`
  - `ci(github): ajouter le test de fumée après déploiement staging`
- **Règle d'or :** Un commit = une modification logique cohérente (facilite le rollback ciblé et les pushs sur réseau instable).

---

## 4. Definition of Done (DoD)
*Risques traités : R1 (Code cassé), R4 (Migration BDD destructive), R5 (Fuite de secrets).*

Une tâche (Issue) est considérée comme **terminée** uniquement lorsque **tous** les critères suivants sont cochés :
1. [ ] Le code répond aux critères d'acceptation de l'issue.
2. [ ] Les tests unitaires et d'intégration passent en local (`docker compose run api pytest` / `npm test`) et dans le pipeline GitHub Actions (vert).
3. [ ] Aucun secret, mot de passe ou fichier `.env` n'est présent dans le diff Git.
4. [ ] Si la tâche modifie la base de données : le script de migration est versionné dans Git, automatisé et **rétrocompatible** (*Expand & Contract*) pour garantir un rollback < 5 min sans casser la version `N-1`.
5. [ ] La documentation associée (`README.md`, `docs/...`) est mise à jour si nécessaire.
6. [ ] La Pull Request a été relue et approuvée par 1 pair, puis mergée dans `preprod` (et déployée en production si applicable).

---

## 5. Versionnage et identification en production (< 10 secondes)
*Risque traité : R2 (Incapacité d'identifier la version en prod et rollback > 5 min).*

- **Versionnage Sémantique (`SemVer`) :** Chaque release sur `main` porte un tag Git `vMAJOR.MINOR.PATCH` (ex: `v1.0.0`, `v1.1.0`).
- **Traçabilité des images Docker :** Le tag `:latest` est **strictement interdit**. Chaque image poussée sur GitHub Container Registry (GHCR) est taguée avec la version exacte (`vX.Y.Z`) et le hash court du commit Git (`sha-<commit>`).
- **Vérification en moins de 10 secondes :**
  1. **Via l'API en direct :** L'endpoint `GET /health` renvoie systématiquement un JSON contenant la version et l'environnement actif :
     ```json
     { "status": "ok", "version": "v1.1.0", "commit": "a1b2c3d", "env": "production" }
     ```
     Un simple `curl -s https://<url-prod>/health` donne la réponse en 1 seconde.
  2. **Via GitHub :** Onglet **Releases** et **Deployments** sur la page d'accueil du dépôt.

---

## 6. Gestion des secrets et procédure en cas de fuite
*Risque traité : R5 (Fuite de secrets sur un dépôt public).*

- **Où vivent les secrets ?**
  - **En local :** Dans un fichier `.env` strictement ignoré par Git (listé dans `.gitignore`). Seul `.env.example` (avec des valeurs fictives) est versionné.
  - **En CI/CD, Staging et Production :** Exclusivement dans **GitHub Secrets** (et variables d'environnement injectées au conteneur au runtime, jamais gravées dans l'image Docker via `ENV` ou `ARG`).
- **Qui y a accès ?** Uniquement les administrateurs du dépôt (Lead Dev / DevOps) pour l'écriture ; le pipeline GitHub Actions y accède uniquement en lecture lors de l'exécution des jobs autorisés (avec approbation requise pour l'environnement `production`).
- **Procédure d'urgence en cas de fuite (commit accidentel d'un secret) :**
  1. **Révocation immédiate (< 5 min) :** Considérer le secret comme définitivement compromis. Révoquer immédiatement le token/mot de passe côté fournisseur (PostgreSQL, GitHub PAT, clé API) et en générer un nouveau.
  2. **Mise à jour :** Injecter le nouveau secret dans GitHub Secrets et redéployer le service.
  3. **Nettoyage de l'historique Git :** Purger le fichier ou le commit sensible de l'historique Git (`git filter-repo` ou BFG Repo-Cleaner) et force-push (via bypass admin temporaire documenté), puis notifier l'équipe pour qu'elle re-clone le dépôt.

---

## 7. Application technique vs Discipline d'équipe

Conformément aux exigences d'audit, voici la distinction entre ce que GitHub verrouille techniquement et ce qui repose sur notre discipline :

| Règle | Imposée par l'outil (GitHub) | Discipline d'équipe (Humain) |
| :--- | :--- | :--- |
| Interdiction de push direct sur `main` et `preprod` | **Oui** (Rulesets : *Require a pull request*) | — |
| Interdiction de supprimer/force-push `main` et `preprod` | **Oui** (Rulesets : *Restrict deletions*, *Block force pushes*) | — |
| Obligation d'1 relecteur avant merge | **Oui** (Rulesets : *Required approvals = 1*) | Respect du délai de revue (SLA 12h) |
| Passage obligatoire des tests CI avant merge | **Oui** (Rulesets : *Require status checks to pass*) | Écriture de tests pertinents |
| Approbation humaine avant déploiement en `production` | **Oui** (GitHub Environments : *Required reviewers*) | Vérification des critères Go/No-Go |
| Détection de secrets connus dans les pushs | **Oui** (GitHub Secret Scanning / Push protection) | Ne jamais commiter `.env` ou des mots de passe custom |
| Nommage des branches et Conventional Commits | **Non** (nativement sans action dédiée) | Vérifié lors de la revue de PR |
| Rétrocompatibilité des migrations SQL (*Expand & Contract*) | **Non** (GitHub ne lit pas la logique SQL) | Vérifié par le relecteur avant merge |
| Interdiction de déployer le vendredi après 16h | **Non** | Règle d'équipe appliquée par les approbateurs |