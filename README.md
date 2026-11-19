# TP-CICD

## Carte contexte

Équipe distribuée de **4 personnes** (Montagne, Antilles, Brest), avec **décalage horaire**, **réseau instable à la montagne** et **1 h commune maximum par jour**.

**Objectif :** fournir une API REST fiable pour relier producteurs, restaurants et particuliers, avec PostgreSQL, Docker Compose et GitHub Actions.

## Règles de fonctionnement

| Règle | Risque traité |
|---|---|
| **Async-first** : décisions dans les Issues et PR ; heure commune réservée aux blocages et validations de production. | Décalage horaire et disponibilité limitée. |
| **Petites PR**, sur branches dédiées, avec tests locaux via Docker Compose avant push. | Réseau instable et régressions difficiles à détecter. |
| **1 relecteur par PR**, réponse visée sous **12 h** ; bypass exceptionnel documenté (motif, auteur, tests). | Blocage en cas d'absence d'un membre ou du freelance. |
| **Migrations SQL versionnées et automatiques**, jamais lancées manuellement en SSH. | Oubli ou incohérence de la base en production. |
| **Expand & Contract** : conserver la compatibilité avec l'ancienne API. | Rollback impossible après changement de schéma. |
| **`pg_dump` automatique avant migration en production**. | Perte ou corruption des données. |
| **Secrets hors Git** (GitHub Secrets/Environments, `.env` ignoré). | Fuite de mots de passe ou clés. |
| **Images Docker versionnées** (`vX.Y.Z`, pas seulement `latest`). | Impossible d'identifier la version en production. |

## Workflow Git et CI/CD

Stratégie **GitHub Flow** : `main` protégée ; branches `feature/...`, `fix/...` ou `hotfix/...`. Commits : `feat:`, `fix:`, `test:`, `docs:`.

**Issue → branche → tests locaux → PR → tests GitHub Actions → revue → merge → image GHCR → staging → approbation → backup → migration → production.**

Une tâche est terminée lorsque ses tests passent, sa PR est validée et la documentation nécessaire est à jour. En urgence, toute dérogation est tracée dans la PR.

## Lancement local

```bash
docker compose up -d --build
docker compose ps
docker compose down
```

API prévue : `GET /health`, `GET /products`, `POST /orders`. Les commandes dépassant le stock disponible doivent être refusées avec un message clair.

## Retour arrière

**Objectif : moins de 5 minutes.** Redéployer l'image précédente, vérifier `/health` et la prise de commande, puis documenter l'incident. Les migrations restent rétrocompatibles ; un rollback de l'API ne restaure pas automatiquement les données.

## Documentation

- `docs/risques.md` : risques et mesures.
- `docs/adr/0001-strategie-branches.md` : stratégie Git.
- `CONTRIBUTING.md` : règles de contribution.
- `docs/pipeline.md` : pipeline et rollback.
- `docs/releases/` : fiches de livraison.
- `docs/config/` et `docs/incidents.md` : preuves de configuration et incidents.

