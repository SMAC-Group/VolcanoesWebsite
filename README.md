# VolcanInfos — Visualisation Interactive de Donnees Volcaniques

Application web statique pour visualiser des donnees geochimiques volcaniques (Temperature, Pression, compositions d'oxydes, etc.) sous forme de graphiques 2D et 3D interactifs.

## Apercu

- **Graphiques 2D** : nuages de points avec ellipses de confiance, lasso/rectangle de selection
- **Graphiques 3D** : nuages de points avec centroides par groupe, rotation libre
- **Import CSV** : glisser-deposer ou parcourir, avec apercu et validation
- **Saisie manuelle** : formulaire dynamique base sur les colonnes du CSV
- **Export / Contribution** : telechargement CSV + instructions d'envoi

## Tech Stack

| Composant | Technologie |
|-----------|------------|
| Frontend | Vanilla HTML/CSS/JS (ES Modules, pas de build) |
| Visualisation | [Plotly.js 2.27.0](https://plotly.com/javascript/) via CDN |
| Polices | Syne (titres) + Space Mono (monospace) via Google Fonts |
| Stockage local | localStorage (donnees utilisateur) |
| Format de donnees | CSV |

## Demarrage rapide

```bash
# Les ES Modules necessitent un serveur HTTP (file:// ne fonctionne pas)
python -m http.server 8000
# Puis ouvrir http://localhost:8000
```

## Documentation detaillee

| Document | Description |
|----------|------------|
| [Architecture](docs/architecture.md) | Vue d'ensemble de l'architecture, patterns et decisions de conception |
| [Fichiers du projet](docs/fichiers.md) | Description detaillee de chaque fichier du projet |
| [Couche services](docs/services.md) | API de donnees, backend statique, migration vers un backend dynamique |
| [Composants UI](docs/ui.md) | Sidebar, graphiques 2D/3D, panneau de detail, modales |
| [Format de donnees](docs/donnees.md) | Structure CSV, colonnes, types, gestion des valeurs manquantes |
| [Contribuer](docs/contribuer.md) | Workflow de contribution de donnees et ajout de dimensions |

## Structure du projet

```
VolcanoWebsite/
├── index.html                  # Point d'entree SPA — layout 3 colonnes
├── css/style.css               # Theme sombre
├── js/
│   ├── config.js               # Configuration centralisee
│   ├── events.js               # Bus d'evenements pub/sub
│   ├── app.js                  # Orchestrateur principal
│   ├── columns.js              # Configuration des colonnes CSV
│   ├── csv.js                  # Parseur/exporteur CSV pur
│   ├── selection.js            # Etat de selection des points
│   ├── services/
│   │   ├── api.js              # Facade d'acces aux donnees
│   │   └── static-backend.js   # Implementation statique (CSV + localStorage)
│   └── ui/
│       ├── sidebar.js          # Selecteurs d'axes, filtre volcans
│       ├── chart2d.js          # Graphique 2D Plotly (scattergl + ellipses)
│       ├── chart3d.js          # Graphique 3D Plotly (scatter3d + centroides)
│       ├── detail-panel.js     # Panneau droit : detail point, stats
│       └── modals.js           # Modales : upload, saisie, export, contribution
├── data/volcanoData.csv        # Base de donnees principale
└── docs/                       # Documentation detaillee (voir liens ci-dessus)
```

## Conventions

- **UI en francais**, code en anglais
- **camelCase** pour le JS, **kebab-case** pour le CSS
- **IDs HTML** en camelCase (`axisX`, `plotDiv`, `modalUpload`)
- Toutes les valeurs configurables dans `js/config.js`
