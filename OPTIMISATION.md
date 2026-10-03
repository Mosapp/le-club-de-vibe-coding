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

## Effets « hook » & expérience mobile

- `src/components/fx.tsx` (nouveau) : barre de progression de lecture, mot rotatif du titre (CRÉER / CODER / LANCER / INVENTER), terminal qui « tape » 3 scénarios en boucle, barre « Rejoindre le club » collée en bas sur mobile, halo qui suit le doigt/la souris, spotlight sur les cartes.
- `src/lib/haptics.ts` (nouveau) + `src/components/ui.tsx` : petite vibration au toucher des boutons (Android uniquement) et effet d'enfoncement.
- `src/components/layout.tsx` : le menu se cache quand on descend et réapparaît quand on remonte (mobile).
- `src/pages/Landing.tsx` : cartes « Pourquoi » et « Projets » en défilement horizontal avec accroche (swipe) sur mobile ; animation de particules en pause hors écran et allégée sur mobile.
- `src/index.css` : styles des effets ; tout est désactivé si l'appareil demande moins d'animations.

## Validation d'email → espace membre, et refonte de l'UI

- `src/lib/supabase.ts` : lecture du lien de confirmation (`#access_token=…&type=signup`) avant que le client ne nettoie l'adresse.
- `src/lib/store.tsx` : après le clic sur le lien du mail, la personne est connectée et redirigée automatiquement vers `/app`, avec un message de bienvenue. La fiche membre est complétée (niveau, motivations, objectif, rythme voyagent maintenant dans les métadonnées du compte, donc ça marche même si le mail est ouvert sur un autre appareil). Lien expiré → page de connexion avec un message clair. Aucun changement de la base ni des comptes existants.
- `src/App.tsx` : écran « Validation de ton email… » pendant la transition.
- Espace membre : bandeau d'accueil sombre avec anneau de progression, barre de navigation flottante sur mobile avec pastille active, avatar dans l'en-tête, titres plus affirmés.
- Connexion / inscription : thème sombre néon (grille, lueurs, carte à bordure dégradée).
- Boutons, champs (halo orange au focus), cartes, badges et notifications (en haut sur mobile) améliorés ; fond de l'admin et du membre légèrement animé par des lueurs douces.

À vérifier dans Supabase (Authentication → URL Configuration) : l'adresse de ton site GitHub Pages doit figurer dans « Redirect URLs » (c'est déjà le cas si les mails de confirmation fonctionnent aujourd'hui).

## Correctif : voir les projets publiés par les autres membres

Cause : les projets et membres partagés n'étaient chargés qu'une fois, au démarrage de la page. Une personne qui se connectait ensuite (sans recharger) ne voyait que ses propres données, et une erreur de chargement vidait la liste en silence.

- `src/lib/store.tsx` : rechargement à chaque connexion, temps réel branché seulement une fois connecté, rafraîchissement au retour sur l'onglet et toutes les 60 s, et en cas d'erreur on garde les données déjà affichées + message d'alerte explicite.
