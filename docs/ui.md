# Composants UI

[Retour au README](../README.md) | [Fichiers](fichiers.md)

---

## `js/ui/sidebar.js`

Panneau gauche : selecteurs d'axes et filtre par volcan.

**Fonctions exportees** :

- `initAxisSelectors()` — remplit les `<select>` X, Y, Z et Couleur avec les colonnes numeriques/categoriques disponibles. Utilise les valeurs par defaut de `CONFIG.defaultAxes`.
- `initVolcanoFilter()` — genere la liste de checkboxes a partir des valeurs uniques de la premiere colonne categorique. Chaque changement emet `EVT.FILTER_CHANGED`.
- `getActiveFilters()` — retourne les noms des volcans coches, ou `null` si tous sont coches (= pas de filtre).
- `getAxes()` — retourne `{ x, y, z, color, invertY }` depuis les valeurs actuelles des selecteurs.

---

## `js/ui/chart2d.js`

Graphique 2D avec Plotly (`scattergl` pour les performances).

**`render(rows, xCol, yCol, colorCol, options)`**

1. Filtre les lignes avec des valeurs valides pour X et Y
2. Construit une color map par groupe (colonne couleur)
3. Cree 2 traces : donnees de base (triangles) et donnees utilisateur (cercles verts)
4. Si `showEllipses` : calcule des ellipses de confiance (~1.9 sigma) par groupe (min 5 points) avec remplissage semi-transparent
5. Si `showLabels` : ajoute le nom du groupe sous chaque ellipse
6. Cable `plotly_click` → `Selection.toggle()` et `plotly_selected` → `Selection.selectMultiple()`

**Layout** : theme sombre, dragmode lasso par defaut, scrollZoom active, pas de modebar visible.

**Fonctions internes** :
- `_groupBy(rows, col)` — regroupe les lignes par valeur de colonne
- `_tooltip(row)` — genere le HTML du tooltip (meta + axes principaux)
- `_hexToRgba(hex, a)` — convertit une couleur hex en rgba

---

## `js/ui/chart3d.js`

Graphique 3D avec Plotly (`scatter3d`).

**`render(rows, xCol, yCol, zCol, colorCol, options)`**

1. Filtre les lignes valides pour X, Y et Z
2. Cree les traces base + user (meme logique que 2D)
3. Calcule les **centroides** par groupe : position moyenne X/Y/Z, affiches comme cercles ouverts avec labels
4. Cable `plotly_click` → `Selection.toggle()`

Pas de lasso/rectangle en 3D (limitation Plotly). L'interaction se fait par orbite (drag), pan (Shift+drag) et zoom (scroll).

---

## `js/ui/detail-panel.js`

Panneau droit : affichage des details et statistiques de selection.

**`updateSelectionInfo(selectedSet, allRows)`**
- Met a jour les compteurs (nombre de points selectionnes)
- Calcule les moyennes de Temperature et Pression pour la selection
- Affiche la liste des 20 premiers points selectionnes (nom + valeur)
- Si aucun point selectionne : affiche un message vide

**`showPointDetail(row)`**
- Affiche une carte detail pour un point unique
- Montre la Reference en titre, le tag "VOUS" si c'est une donnee utilisateur
- Liste toutes les colonnes configurees avec leur valeur

---

## `js/ui/modals.js`

Gere les 4 modales de l'application.

### Upload CSV (`modalUpload`)
- Zone de drag & drop + click pour parcourir
- Parse le fichier avec `csv.js`, affiche un apercu (10 premieres lignes)
- Montre les erreurs/warnings de validation
- Bouton "Confirmer" → `API.appendUserData()` + emet `EVT.DATA_UPDATED`

### Saisie manuelle (`modalAdd`)
- Genere dynamiquement les champs du formulaire a partir des en-tetes CSV
- A la soumission : convertit les valeurs (string → number si applicable, vide → null)
- Ajoute la ligne via `API.appendUserData()`

### Export (`modalExport`)
- Affiche un apercu du CSV dans un `<pre>`
- Bouton "Telecharger" : genere un Blob et declenche le telechargement
- Instructions en 3 etapes pour l'envoi par email

### Contribution (`modalContribute`)
- Champs nom et email
- Resume des donnees utilisateur en cache
- Bouton "Telecharger & Envoyer" : genere le CSV, le telecharge, affiche l'adresse email de contact
