# Architecture

[Retour au README](../README.md)

## Vue d'ensemble

VolcanInfos est une **SPA (Single Page Application) statique** construite en vanilla JS avec ES Modules. Il n'y a aucun build step : le navigateur resout les imports nativement.

Le point d'entree unique est :
```html
<script type="module" src="js/app.js">
```

## Patterns principaux

### 1. Bus d'evenements (Pub/Sub)

Les modules communiquent via un bus d'evenements (`js/events.js`) au lieu de s'appeler directement. Cela permet de :
- Decoupler les modules entre eux
- Faciliter le remplacement d'un module (ex: passer a React/Vue)
- Ajouter de nouveaux listeners sans modifier le code existant

**Evenements disponibles** (`EVT`) :

| Constante | Declencheur | Payload |
|-----------|-------------|---------|
| `DATA_LOADED` | Donnees CSV chargees au boot | aucun |
| `DATA_UPDATED` | Apres upload CSV ou saisie manuelle | aucun |
| `SELECTION_CHANGED` | Click/lasso/rectangle sur le graphique | `Set<index>` |
| `VIEW_CHANGED` | Bascule 2D/3D | `'2d'` ou `'3d'` |
| `FILTER_CHANGED` | Checkbox volcan cochee/decochee | aucun |
| `AXES_CHANGED` | Changement d'axe X/Y/Z/couleur | aucun |

### 2. Couche de services (abstraction backend)

Tout acces aux donnees passe par `js/services/api.js`, qui delegue au backend actif. En mode statique, c'est `static-backend.js` (fetch CSV + localStorage). Voir [services.md](services.md) pour les details de migration.

### 3. Dimensions dynamiques

Les colonnes ne sont **pas hardcodees**. Elles sont detectees depuis les en-tetes CSV et configurees dans `js/columns.js`. Ajouter une dimension = ajouter une colonne au CSV + une entree dans `columns.js`.

### 4. Gestion des valeurs manquantes

Les cellules vides/null sont valides partout. Les points avec des valeurs null pour les axes courants sont filtres du graphique (pas supprimes du dataset).

## Flux de donnees

```
volcanoData.csv
      |
      v
static-backend.js  (fetch + parse)
      |
      v
   api.js  (facade unifiee)
      |
      +---> sidebar.js     (selecteurs d'axes, filtre)
      +---> chart2d.js     (rendu 2D)
      +---> chart3d.js     (rendu 3D)
      +---> detail-panel.js (panneau droit)
      +---> modals.js      (import/export)

localStorage
      |
      v
static-backend.js  (lecture/ecriture donnees utilisateur)
      |
      v
   api.js  (merge base + user via getAllRows())
```

## Cycle de rendu

1. `app.js` appelle `renderChart()`
2. Les lignes sont filtrees selon les filtres volcan actifs (`_getFilteredRows()`)
3. Le module de graphique actif (2D ou 3D) recoit les lignes et les noms de colonnes
4. Plotly genere le graphique dans `#plotDiv`
5. Les evenements Plotly (`plotly_click`, `plotly_selected`) alimentent `selection.js`
6. `selection.js` emet `SELECTION_CHANGED` → `detail-panel.js` met a jour le panneau droit
