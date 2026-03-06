# Contribuer des donnees

[Retour au README](../README.md)

## Workflow de contribution

1. **Importer vos donnees** via le bouton "Importer CSV" ou "Ajouter" (saisie manuelle)
2. **Verifier** visuellement la position de vos points sur le graphique
3. **Exporter** via le bouton "Exporter" → telecharge un fichier `mes_donnees_volcaniques.csv`
4. **Envoyer** le CSV par email a l'adresse indiquee dans la section "Contribuer"

## Format CSV attendu

Le CSV importe doit avoir des en-tetes correspondant aux colonnes definies dans `js/columns.js`. Les colonnes manquantes seront traitees comme `null`.

Exemple minimal :
```csv
Reference,T_C,P_kbar,SiO2_Cpx
"Mon etude 2024",1100,2.8,49.1
"Mon etude 2024",1050,3.1,48.7
```

## Ajouter des dimensions au projet

Pour ajouter de nouvelles colonnes de donnees :

1. Ajouter la colonne dans `data/volcanoData.csv`
2. Ajouter l'entree dans `js/columns.js` :
   ```js
   NouvelleCol: { label: 'Nom affiche', role: 'axis' },
   ```
3. Les selecteurs d'axes, tooltips et panneau de detail s'adaptent automatiquement

## Ajouter des volcans

Ajouter des lignes au CSV suffit. La premiere colonne categorique (texte) est utilisee pour le filtre par volcan et la coloration par groupe.
