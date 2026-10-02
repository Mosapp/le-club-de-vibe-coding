# Optimisation performance & mobile

Ce qui a changé (la base Supabase, `store.tsx`, `supabase/` et les variables d'environnement ne sont PAS touchés) :

- `vite.config.ts` : suppression du build « fichier unique » (toutes les images étaient encodées dans index.html, 6,6 Mo). Assets maintenant séparés et mis en cache, JS découpé (react / supabase).
- `src/App.tsx` : espace membre et admin chargés à la demande (React.lazy).
- Images converties en WebP et redimensionnées (de ~4,5 Mo à ~0,4 Mo). `favicon.png` : 5,2 Mo -> 52 Ko.
- `index.html` : polices Google en chargement non bloquant, moins de variantes.
- Mobile : `min-h-dvh` (barre d'adresse), flou allégé sur mobile, champs 16 px (pas de zoom iOS), marge de sécurité sous la barre du bas.

Fichiers inutilisés que tu peux supprimer : `src/media/branding/logo.png`, `src/media/community/cvc.jpg`.

## Refonte visuelle (accueil sombre)

- `src/index.css` : thème `.theme-dark` (variables de couleur) + effets (grille, lueurs, texte dégradé, fenêtre de code, bandeau défilant). Seule la page d'accueil l'utilise ; l'espace membre et l'admin restent clairs.
- `src/pages/Landing.tsx` : nouveau hero (fenêtre de code animée + bandeau défilant), racine en `theme-dark`, textes « développeur » retirés.
- `src/components/layout.tsx`, `src/config/content.ts` : textes du pied de page.
