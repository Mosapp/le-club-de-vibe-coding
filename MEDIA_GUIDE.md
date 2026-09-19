# MEDIA_GUIDE.md — Gérer les images et vidéos du Club de Vibe Coding

Tous les visuels du site passent par **un seul fichier** : `src/config/media.ts`.
Tu n'as **jamais** besoin de modifier un composant React pour changer une image ou une vidéo.

---

## 1. Où placer les fichiers

```
src/media/
├── hero/
│   ├── hero.jpg              → HERO_MEDIA
│   └── hero-video.mp4        → HERO_MEDIA (optionnel)
├── vibe/
│   └── vibe-explainer.jpg    → VIBE_CODING_MEDIA
├── community/
│   ├── community-01.jpg      → COMMUNITY_MEDIA_01
│   ├── community-02.jpg      → COMMUNITY_MEDIA_02
│   └── community-03.jpg      → COMMUNITY_MEDIA_03
├── projects/
│   ├── project-01.jpg        → PROJECT_IMAGE_01
│   ├── project-02.jpg        → PROJECT_IMAGE_02
│   ├── project-03.jpg        → PROJECT_IMAGE_03
│   └── project-04.jpg        → PROJECT_IMAGE_04 (aucun fichier → placeholder)
├── sessions/
│   └── session-01.jpg        → SESSION_MEDIA
└── challenges/
    └── challenge-01.jpg      → CHALLENGE_MEDIA
```

> Si ton projet sert un dossier `public/` (hébergement classique), tu peux aussi utiliser
> `public/media/...` et renseigner le chemin `/media/hero/hero-video.mp4` dans la config.
> Avec le build « single file » actuel, les fichiers importés depuis `src/media/` sont
> automatiquement inlinés : c'est la méthode la plus sûre.

---

## 2. Nommer les fichiers

- minuscules, tirets, pas d'accent, pas d'espace : `community-02.jpg`
- suffixe numérique pour les séries : `project-01`, `project-02`…
- extensions : `.jpg`, `.jpeg`, `.webp`, `.png`, `.svg`, `.mp4`, `.webm`

---

## 3. Changer le visuel du Hero

**Méthode A — remplacer le fichier (le plus simple)**

1. Remplace `src/media/hero/hero.jpg` par ta nouvelle image (garde le même nom).
2. C'est tout. Aucune ligne de code à changer.

**Méthode B — changer la référence**

```ts
// src/config/media.ts
import nouveauHero from "@/media/hero/mon-nouveau-hero.jpg";

HERO_MEDIA: {
  ...
  src: nouveauHero,
}
```

**Méthode C — mettre une vidéo dans le Hero**

```ts
HERO_MEDIA: {
  ...
  src: heroImg,                                  // sert de poster
  video: "/media/hero/hero-video.mp4",           // ou un import
  poster: "/media/hero/hero-poster.webp",
}
```

Le composant `MediaSlot` détecte la présence de `video` et bascule automatiquement
en lecteur vidéo (muet, en boucle, lecture au scroll, pas d'autoplay sur mobile).

---

## 4. Ajouter un nouvel emplacement média

1. Ajoute le fichier dans `src/media/<dossier>/`.
2. Ajoute une entrée dans `MEDIA` :

```ts
MON_NOUVEAU_MEDIA: {
  id: "MON_NOUVEAU_MEDIA",
  slot: "MON_NOUVEAU_MEDIA",
  label: "Nom lisible affiché dans la Media Library",
  src: monImport,
  video: null,
  poster: null,
  alt: "Description de l'image pour l'accessibilité (obligatoire).",
  ratio: "16/10",
  section: "global",
},
```

3. Utilise-le dans n'importe quel composant :

```tsx
<MediaSlot slot="MON_NOUVEAU_MEDIA" />
```

Ratios disponibles : `"4/5"`, `"3/4"`, `"1/1"`, `"4/3"`, `"16/10"`, `"16/9"`, `"3/2"`.

---

## 5. Dimensions et poids recommandés

| Emplacement | Ratio | Taille conseillée | Poids max |
|---|---|---|---|
| `HERO_MEDIA` | 4/5 | 1200 × 1500 | 350 Ko |
| `VIBE_CODING_MEDIA` | 4/3 | 1400 × 1050 | 300 Ko |
| `COMMUNITY_MEDIA_01` | 16/10 | 1600 × 1000 | 350 Ko |
| `COMMUNITY_MEDIA_02` | 4/3 | 1200 × 900 | 250 Ko |
| `COMMUNITY_MEDIA_03` | 4/5 | 1000 × 1250 | 250 Ko |
| `PROJECT_IMAGE_*` | 16/10 | 1200 × 750 | 200 Ko |
| `SESSION_MEDIA` | 3/2 | 1400 × 933 | 300 Ko |
| `CHALLENGE_MEDIA` | 4/3 | 1200 × 900 | 250 Ko |

**Vidéos** : H.264 `.mp4`, piste audio absente ou muette, ≤ 8 Mo, ≤ 15 s si en boucle.
Une vidéo de hero ne doit jamais dépasser 12 Mo : sur mobile elle n'est pas lancée
automatiquement (voir `MediaVideo`).

---

## 6. Formats

- **Photos** : `.webp` (idéal), `.jpg` accepté.
- **Captures d'interface** : `.webp` ou `.png`.
- **Vidéos** : `.mp4` (H.264) ou `.webm` (VP9).
- Toujours renseigner un `alt` pertinent (accessibilité + SEO).

---

## 7. Si aucun média n'est disponible

Mets `src: null`. Un **placeholder élégant** s'affiche automatiquement, avec le nom de
l'emplacement (par exemple `PROJECT_IMAGE_04`) et la mention « ajouter une image ou une vidéo ».
Aucune fausse photo n'est jamais affichée à la place.

---

## 8. Remplacer un média depuis l'interface admin

`#/admin/medias` → **Media Library** :

1. Choisis l'emplacement (tous les slots du site sont listés avec leur aperçu).
2. Clique sur **Remplacer**.
3. Colle l'URL de l'image ou de la vidéo.
4. **Enregistrer**.

Le changement est appliqué immédiatement sur tout le site (sans rebuild).
Le bouton **Réinitialiser** restaure la configuration d'origine.

---

## 9. Composants disponibles

| Composant | Usage |
|---|---|
| `MediaSlot slot="HERO_MEDIA"` | Récupère automatiquement le média configuré (image **ou** vidéo). |
| `MediaImage src alt ratio` | Image responsive, lazy loading, fallback si l'image échoue. |
| `MediaVideo src poster title` | Vidéo : mute, loop, play/pause au scroll, pas d'autoplay mobile, fallback. |
| `MediaPlaceholder slot label ratio` | Placeholder élégant quand rien n'est défini. |
| `MediaGallery slots={[...]}` | Collage simple de plusieurs emplacements. |

---

## 10. Règles à retenir

- Un média = **une entrée** dans `src/config/media.ts`.
- Un `alt` vide, c'est un média cassé : décris toujours l'image.
- Les couleurs fortes ne sont jamais dans les images de fond : on garde des visuels
  lumineux et naturels (lumière du jour, tons chauds), pas de néon ni de cyberpunk.
- Les textes du site sont dans `src/config/content.ts` — même logique, zéro composant à modifier.
