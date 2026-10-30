# 🎄 Fêtes de fin d'année — mode d'emploi

Tout s'active et se désactive **automatiquement** selon la date de l'appareil du visiteur.
Le site reste libre d'accès : les jeux sont un bonus (bouton 🎄 « Jeux des fêtes », page `#/fetes`).

| Quoi | Du | Au (exclu) |
|---|---|---|
| ❄️ Neige sur tout le site | 1er décembre | 7 janvier |
| 🎅 Père Noël 3D | 1er décembre | 27 décembre |
| 🎁 Calendrier de l'Avent (1 énigme/jour, rattrapage possible) | 1er décembre | 25 décembre |
| 🛷 La hotte piratée (9 épreuves + coffre, 3 tentatives) | 24 décembre | 31 décembre |
| 🎆 Défi du Nouvel An (5 énigmes, 1 essai, compte à rebours) | 31 décembre | 7 janvier |

Les dates sont dans `src/config/festive.ts` (et `supabase/migration-fetes.sql` pour le serveur).
Pour une autre année, change `FESTIVE_YEAR` / `y` dans ces deux fichiers.

## 1. Activer les classements (Supabase)

Dans **Supabase → SQL Editor**, colle tout le contenu de `supabase/migration-fetes.sql`, puis **Run**.
Sans cette étape, les jeux marchent mais sans classement (réponses gardées sur l'appareil).

Pour suivre les joueurs : **Table Editor → `festive_scores`** et **`festive_players`**.

## 2. Tester avant décembre (mode aperçu)

Ouvre le site avec une date simulée, par exemple :

- `https://mosapp.github.io/le-club-de-vibe-coding/#/fetes?apercu=2026-12-05` → calendrier au 5 décembre
- `…#/fetes?apercu=2026-12-26` → la hotte
- `…#/fetes?apercu=2027-01-01` → Nouvel An (feu d'artifice)

En aperçu, la neige et le Père Noël s'affichent aussi pendant ta visite, **mais rien n'est enregistré** sur le serveur.

## 3. Le Père Noël 3D

Le site affiche le fichier **`public/santa/santa.glb`** s'il existe (sinon, rien ne s'affiche).
Petite bulle en bas à gauche ; en la touchant, grande vue où on fait tourner le Père Noël,
et sur téléphone, bouton **« Voir chez moi »** (réalité augmentée).

### Trouver un modèle réaliste
- **Gratuit** : [Sketchfab](https://sketchfab.com) → chercher « Santa Claus », filtre *Downloadable*,
  licence **CC-BY** (il faudra citer l'auteur sur le site) → télécharger au format **glTF / GLB**.
- **Payant (plus réaliste, souvent déjà animé)** : CGTrader, TurboSquid (≈ 10–50 €), format **GLB/glTF**.
- **Animation « coucou »** : importer le personnage sur [Mixamo](https://www.mixamo.com) (gratuit),
  choisir l'animation *Waving*, exporter, puis convertir en GLB (Blender : *Fichier → Exporter → glTF 2.0 (.glb)*).
  La **première animation** du fichier est jouée en boucle automatiquement.

### Préparer le fichier (important pour le mobile)
- Viser **moins de 5 Mo**. Pour compresser : glisser le fichier sur [gltf.report](https://gltf.report),
  appliquer *Draco* + textures en *WebP/KTX2* (1024 px suffisent), puis exporter.
- Le personnage doit être **debout, centré, face à l'avant** (la vue s'adapte toute seule à sa taille).

### Déposer le fichier
Sur GitHub, ouvre le dossier **`public/santa/`** (il existe déjà) → **Add file → Upload files** →
glisse ton fichier renommé **`santa.glb`** → **Commit changes**.
Après le déploiement, le Père Noël apparaît tout seul (du 1er au 26 décembre, ou en mode aperçu).
