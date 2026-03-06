# Couche de services

[Retour au README](../README.md) | [Fichiers](fichiers.md)

## Principe

Tout acces aux donnees passe par `js/services/api.js`. C'est la **seule dependance data** des autres modules. Le reste de l'app ne sait pas d'ou viennent les donnees.

---

## `js/services/api.js`

Facade qui delegue au backend actif selon `CONFIG.backend`.

**Fonctions deleguees au backend** :
| Fonction | Description |
|----------|-------------|
| `fetchVolcanoes(url?)` | Charge les donnees de base (CSV ou API) |
| `getBaseHeaders()` | En-tetes du CSV de base |
| `getBaseRows()` | Lignes du CSV de base (taguees `_source: 'base'`) |
| `getUserData()` | Donnees utilisateur (localStorage ou API) |
| `saveUserData(rows)` | Sauvegarde les donnees utilisateur |
| `appendUserData(newRows)` | Ajoute des lignes aux donnees utilisateur |
| `clearUserData()` | Supprime toutes les donnees utilisateur |
| `hasUserData()` | Verifie si des donnees utilisateur existent |
| `userDataSizeKB()` | Taille des donnees utilisateur en Ko |
| `exportUserCSV(headers)` | Exporte les donnees utilisateur en CSV string |
| `submitContribution(headers, meta)` | Prepare le CSV de contribution |

**Fonctions derivees (backend-agnostiques)** :
| Fonction | Description |
|----------|-------------|
| `getAllRows()` | Merge base + user, chaque ligne taguee `_source` |
| `getAllHeaders()` | Union des en-tetes, filtre par `columns.js` |
| `getNumericHeaders()` | Colonnes numeriques (role `axis` ou `detail`) |
| `getMetaHeaders()` | Colonnes metadata (role `meta`) |
| `getTooltipHeaders()` | Colonnes affichees dans les tooltips (role `axis`) |
| `getCategoricalHeaders()` | Colonnes textuelles (pour couleur/filtre) |
| `uniqueValues(header)` | Valeurs uniques triees pour une colonne |

---

## `js/services/static-backend.js`

Implementation statique : charge le CSV via `fetch()`, stocke les donnees utilisateur dans `localStorage`.

**Fonctionnement** :
1. `fetchVolcanoes()` fait un `fetch('data/volcanoData.csv')`, parse le CSV, stocke les lignes en memoire
2. Les donnees utilisateur sont serialisees en JSON dans `localStorage` sous la cle `volcaninfos_user_data`
3. `submitContribution()` genere un CSV et le retourne (pas d'envoi serveur — le fichier est telecharge cote client)

---

## Migration vers un backend dynamique

Pour passer a un backend avec serveur :

1. Creer `js/services/remote-backend.js` qui exporte les memes fonctions que `static-backend.js`
2. Mettre `CONFIG.backend = 'remote'` et `CONFIG.apiUrl = 'https://...'` dans `config.js`
3. Modifier l'import dans `api.js` pour charger `remote-backend.js` quand `backend === 'remote'`

Aucun autre fichier n'a besoin de changer. Les modules UI continuent d'appeler `api.js` comme avant.
