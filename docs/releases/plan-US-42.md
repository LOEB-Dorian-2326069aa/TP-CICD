# Plan d'exécution — US-42 : Gestion du stock producteur

- **Version cible :** `v1.1.0` (ajout de fonctionnalité rétrocompatible — SemVer MINOR)
- **Statut :** En cours de réalisation
- **Stratégie Git :** 4 branches courtes créées depuis `preprod`, mergées via Pull Request avec revue asynchrone (1 approbation par PR).

---

## 1. Découpage en tâches (répartition sur les 4 membres)

| Issue | Branche associée | Tâche technique | Critère d'acceptation (DoD) |
| :--- | :--- | :--- | :--- |
| **#1** | `feat/1-declare-product-stock` | Endpoint `PATCH /products/:id/stock` pour déclarer/modifier le stock d'un produit. | Renvoie `200` avec le produit mis à jour ; renvoie `400` si stock < 0 et `404` si produit inconnu. |
| **#2** | `feat/2-order-stock-check` | Transaction SQL sur `POST /orders` : bloque si `quantity > stock`, sinon décrémente le stock. | Renvoie `409` avec message explicite (`Stock insuffisant...`) en cas de dépassement ; décrémente le stock sinon. |
| **#3** | `chore/3-ghcr-deploy-rollback` | Publication image Docker sur GHCR + étape de déploiement avec *Smoke Test* + workflow `rollback.yml`. | Image taguée `v1.1.0` poussée sur `ghcr.io` ; rollback vers `v1.0.0` exécutable en < 5 minutes. |
| **#4** | `chore/4-release-v1-1-0-docs` | Rédaction des documents de release (`plan-US-42.md`, `v1.1.0.md`) et validation du jeu de 1 200 produits. | Documents complets, critères Go/No-Go validés en staging avant passage sur `main`. |

---

## 2. Sécurité des données & Rollback < 5 minutes (Risques R2 et R4)

- **Schéma PostgreSQL :** La colonne `stock` (`INTEGER NOT NULL DEFAULT 10 CHECK (stock >= 0)`) est déjà présente dans `products`. Aucune opération destructive (`DROP`, `ALTER` bloquant) n'est exécutée.
- **Rétrocompatibilité (*Expand & Contract*) :** En cas de retour arrière d'urgence vers la version précédente (`v1.0.0`), l'ancien code API reste 100 % compatible avec l'état de la base de données.
- **Concurrence :** L'utilisation d'un verrou transactionnel (`SELECT stock FROM products WHERE id = $1 FOR UPDATE`) empêche deux restaurateurs de commander simultanément le dernier article en stock.