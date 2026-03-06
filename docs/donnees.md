# Format de donnees

[Retour au README](../README.md)

## Fichier CSV principal

Le fichier `data/volcanoData.csv` est la base de donnees du projet. Structure attendue :

```csv
Reference,T_C,P_kbar,n_cpx,SiO2_Cpx,TiO2_Cpx,...
"Etude X 2020",1150,3.2,15,48.5,1.2,...
```

### Types de colonnes

| Categorie | Exemples | Type | Role dans `columns.js` |
|-----------|----------|------|----------------------|
| Metadonnee | `Reference` | Texte | `meta` |
| Axes principaux | `T_C`, `P_kbar` | Numerique | `axis` |
| Compositions Cpx | `SiO2_Cpx`, `TiO2_Cpx`, ... | Numerique | `axis` |
| Ecarts-types | `SiO2_Cpx_sd`, ... | Numerique | `detail` |

### Colonnes actuelles

**Axes principaux** : `T_C` (Temperature en C), `P_kbar` (Pression en kbar)

**Compositions Cpx** (14 colonnes) : `n_cpx`, `SiO2_Cpx`, `TiO2_Cpx`, `Al2O3_Cpx`, `FeO_Cpx`, `Fe2O3_Cpx`, `MnO_Cpx`, `MgO_Cpx`, `CaO_Cpx`, `Na2O_Cpx`, `K2O_Cpx`, `P2O5_Cpx`, `Cr2O3_Cpx`, `NiO_Cpx`

**Ecarts-types** (13 colonnes `_sd`) : memes noms que les compositions, suffixes `_sd`

## Valeurs manquantes

- Les cellules vides dans le CSV deviennent `null` apres parsing
- Les points avec `null` sur un axe actif sont **filtres du graphique** (pas supprimes du dataset)
- Les `null` sont affiches comme `—` dans le panneau de detail

## Coercition de types

Le parseur CSV (`js/csv.js`) applique automatiquement :
1. Cellule vide → `null`
2. Valeur numerique → `Number`
3. Separateur decimal europeen (`,` → `.`) : `"47,55"` → `47.55`
4. Sinon → `String` (texte)

## Donnees utilisateur

Les donnees ajoutees par l'utilisateur (upload CSV ou saisie manuelle) sont :
- Stockees dans `localStorage` sous la cle `volcaninfos_user_data` (serialisees en JSON)
- Mergees avec les donnees de base via `API.getAllRows()`
- Taguees `_source: 'user'` pour les distinguer visuellement (couleur verte, symbole cercle)
- Non persistantes : elles disparaissent si le cache du navigateur est vide

## Ajouter une dimension

1. Ajouter la colonne au CSV (`data/volcanoData.csv`)
2. Ajouter une entree dans `js/columns.js` avec le `label` et le `role` souhaites
3. L'UI s'adapte automatiquement (selecteurs d'axes, tooltips, panneau de detail)
