# ADR 0001 : Stratégie de gestion des branches

- **Statut :** Accepté
- **Date :** 2026-11-19
- **Contexte :** Équipe de 4 développeurs distribués (2 à la montagne avec réseau instable, 1 aux Antilles avec décalage horaire, 1 à Brest), 1h de synchronisation max/jour, besoin de livraisons fréquentes (PO) et fiabilité maximale suite à l'incident d'août.
- **Risques traités :** R1 (Déploiement code cassé), R2 (Rollback > 5 min), R3 (Goulot d'étranglement des revues), R6 (Coupures réseau Montagne).

---

## 1. Décision

Nous adoptons un **GitHub Flow adapté avec environnement de pré-production (`preprod`) et releases taguées**.

Concrètement, le dépôt s'articule autour de deux branches permanentes protégées et de branches temporaires courtes :

| Branche | Rôle | Qui peut pousser / merger ? | Déclenchement CI/CD |
| :--- | :--- | :--- | :--- |
| **`main`** | Code de production stable et validé. | **Personne en direct.** Merge uniquement via PR validée depuis `preprod` ou `hotfix/*`. | Build de l'image taguée `vX.Y.Z` + déploiement Production (après approbation manuelle). |
| **`preprod`** | Environnement de recette (Staging) pour tester l'intégration avant la prod. | **Personne en direct.** Merge uniquement via PR validée depuis les branches de travail (`feat/*`, `fix/*`, `chore/*`). | Tests auto + Build image `staging` + déploiement automatique en Staging. |
| **`feat/*`**, **`fix/*`**, **`chore/*`** | Branches temporaires créées depuis `preprod` pour chaque tâche/issue. | Le développeur assigné à la tâche. Supprimées automatiquement après merge. | Exécution des tests unitaires et du linter à chaque push/PR. |
| **`hotfix/*`** | Branche d'urgence créée directement depuis `main` pour corriger un bug bloquant en production. | Tout développeur disponible (ou la Lead Dev en cas d'urgence critique). | Tests auto + déploiement d'urgence après validation. |

**Justification au regard de notre carte contexte :**
- **Contre GitFlow :** Avec seulement 4 développeurs, 1h commune par jour et une connexion instable à la montagne, gérer simultanément `develop`, `release/*` et `main` générerait des conflits de synchronisation insolubles en asynchrone (risques **R3** et **R6**).
- **Contre Trunk-Based pur :** Pousser directement sur `main` sans sas de validation reproduirait l'incident d'août (risque **R1**). L'ajout de `preprod` offre un sas de test (staging) sans alourdir le graphe Git.

---

## 2. Gestion d'un correctif urgent (Hotfix)

En cas d'incident bloquant en production (ex: crash des commandes) :

1. **Création :** Le développeur disponible crée une branche `hotfix/<nom-court>` **directement depuis `main`** (et non depuis `preprod`, afin de ne pas embarquer des fonctionnalités en cours non testées).
2. **Correction & Tests :** Il applique le correctif minimal, vérifie les tests en local via Docker Compose, puis ouvre une Pull Request vers `main`.
3. **Validation accélérée :** La CI exécute les tests bloquants. Si un relecteur est disponible (dans le créneau horaire), il valide la PR. En cas d'indisponibilité critique (décalage horaire Antilles ou coupure réseau montagne), la Lead Dev utilise son droit de *Bypass* documenté dans la PR (traitement du risque **R3**).
4. **Déploiement :** Le merge sur `main` déclenche un nouveau tag patch (`vX.Y.Z+1`) et le déploiement en production.
5. **Rétro-propagation (Backport) :** Immédiatement après le merge sur `main`, une PR de synchronisation (`main` → `preprod`) est ouverte et mergée pour réintégrer le correctif dans le travail en cours et éviter toute régression au prochain déploiement.

---

## 3. Signaux d'alerte (Quand remettre en cause ce choix ?)

Nous saurons que cette stratégie atteint ses limites et devra évoluer (par exemple vers du Trunk-Based avec *Feature Flags*) si l'un des signaux suivants apparaît :

1. **Dérive de `preprod` par rapport à `main` :** Si plusieurs fonctionnalités s'accumulent dans `preprod` pendant plus de 5 jours sans partir en production, rendant les mises en prod trop grosses et risquées (retour du syndrome "gros lot").
2. **Temps d'attente de revue > 12h :** Si les PR restent bloquées faute de relecteur disponible à cause du décalage horaire ou du réseau, ralentissant le développeur freelance et agaçant le PO.
3. **Conflits de merge récurrents sur `preprod` :** Si l'équipe grandit (au-delà de 6-8 développeurs) et que les développeurs passent plus de temps à résoudre des conflits entre `feat/*` et `preprod` qu'à coder.