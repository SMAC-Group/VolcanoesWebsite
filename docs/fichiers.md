# Description des fichiers

[Retour au README](../README.md)

---

## `index.html`

Point d'entree de l'application. Definit le layout a 3 colonnes :

- **Header** : logo, bascule 2D/3D, boutons d'action (Importer, Ajouter, Exporter, Contribuer)
- **Panneau gauche** (`panel-left`) : selecteurs d'axes X/Y/Z, selecteur de couleur, checkbox "Inverser Y", filtre par volcan avec recherche
- **Zone principale** (`main-area`) : barre d'outils (lasso, rectangle, pan, reset, ellipses, labels) + `#plotDiv` (conteneur Plotly)
- **Panneau droit** (`panel-right`) : detail du point selectionne, statistiques de selection, liste des points selectionnes, bouton effacer selection

Contient aussi 4 modales (overlays) : upload CSV, saisie manuelle, export, contribution.

Charge Plotly.js 2.27.0 via CDN et les polices Google Fonts (Syne + Space Mono).

---

## `css/style.css`

Feuille de styles unique. Theme sombre base sur des variables CSS (`:root`).

**Sections principales** :
- Variables de theme (`--bg`, `--accent`, `--text`, etc.)
- Header sticky avec logo et boutons pill
- Layout grille 3 colonnes (`255px 1fr 275px`)
- Selecteurs d'axes et filtre volcans
- Barre d'outils du graphique
- Panneau droit (cartes volcan, stats, liste de selection)
- Modales (overlay + contenu)
- Zone d'upload drag & drop
- Table de preview
- Responsive : en dessous de 900px, passage en colonne unique

---

## `js/config.js`

Configuration centralisee. Toutes les valeurs tunables du projet.

**Proprietes** :
- `backend` : `'static'` ou `'remote'` (bascule backend)
- `apiUrl` : URL du backend distant (null en mode statique)
- `defaultAxes` : axes par defaut (`{ x: 'T_C', y: 'P_kbar', z: 'SiO2_Cpx' }`)
- `contactEmail` : email de contact pour contributions
- `maxCacheSizeKB` : limite du localStorage (5 Mo)
- `theme` : couleurs, polices, arriere-plans
- `clusterColors` : palette de 12 couleurs pour les groupes/clusters

---

## `js/events.js`

Bus d'evenements leger (pub/sub). 3 methodes :
- `Events.on(event, fn)` — ecouter un evenement
- `Events.off(event, fn)` — arreter d'ecouter
- `Events.emit(event, data)` — emettre un evenement

Exporte aussi `EVT` : constantes de noms d'evenements. Voir [architecture.md](architecture.md) pour la liste.

---

## `js/app.js`

Orchestrateur principal. Importe tous les modules et cable les evenements.

**Responsabilites** :
- `init()` : charge les donnees, initialise l'UI, cable tous les listeners
- `renderChart()` : determine la vue active (2D/3D), filtre les lignes, delegue au bon module graphique
- `setView(v)` : bascule 2D/3D, met a jour la toolbar et l'etat du selecteur Z
- `setTool(mode)` : change le mode d'interaction Plotly (`lasso`, `select`, `pan`)
- `resetView()` : remet la camera/les axes a leur position initiale
- `toggleEllipses()` / `toggleLabels()` : active/desactive les overlays visuels
- Raccourci clavier : `Escape` pour effacer la selection

---

## `js/columns.js`

Configuration des colonnes CSV. Chaque entree definit :
- `label` : nom affiche dans l'UI (en francais, avec caracteres speciaux Unicode)
- `role` : determine ou et comment la colonne est utilisee

**Roles disponibles** :
| Role | Axes | Tooltips | Detail | Description |
|------|------|----------|--------|-------------|
| `axis` | oui | oui | oui | Colonne numerique principale |
| `meta` | non | non | oui | Metadonnee textuelle (ex: Reference) |
| `detail` | oui | non | oui | Numerique secondaire (ecarts-types) |
| `hidden` | non | non | non | Ignoree par l'UI |

**Fonctions exportees** : `allKeys()`, `axisKeys()`, `tooltipKeys()`, `detailKeys()`, `metaKeys()`, `label(key)`, `isActive(key)`.

---

## `js/csv.js`

Parseur et exporteur CSV pur (pas de dependances, pas d'effets de bord).

**Fonctions** :
- `parse(text)` → `{ headers: string[], rows: object[] }` — gere les champs entre guillemets, multi-lignes, cellules vides (→ `null`), separateur decimal europeen (virgule → point)
- `stringify(headers, rows)` → string CSV — echappe les virgules, guillemets, retours a la ligne
- `validate(headers, rows)` → `{ type, message }[]` — detecte headers manquants, lignes entierement vides

---

## `js/selection.js`

Etat de selection des points (par index). Utilise un `Set` interne.

**API** :
- `get()` → copie du Set de selection
- `count()` → nombre de points selectionnes
- `isSelected(index)` → boolean
- `select(index)`, `deselect(index)`, `toggle(index)`
- `selectMultiple(indices)` — ajoute plusieurs points
- `clearAll()` — vide la selection

Chaque modification emet `EVT.SELECTION_CHANGED`.

---

## Fichiers de services → voir [services.md](services.md)

## Fichiers UI → voir [ui.md](ui.md)
