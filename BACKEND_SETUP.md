# Backend Supabase

Le projet est pret a utiliser Supabase pour partager les membres, propositions, votes et notifications entre tous les appareils.

## 1. Creer le projet

1. Ouvre https://supabase.com/dashboard.
2. Cree un nouveau projet.
3. Dans **SQL Editor**, colle le contenu de `supabase/schema.sql`, puis execute-le.
4. Dans **Project Settings > API**, copie :
   - `Project URL`
   - `anon public key`

## 2. Configurer le projet local

Copie `.env.example` en `.env`, puis renseigne :

```env
VITE_SUPABASE_URL=https://ton-projet.supabase.co
VITE_SUPABASE_ANON_KEY=ta-cle-anon-publique
```

La cle `anon` peut etre utilisee dans le frontend. Ne publie jamais une `service_role key`.

## 3. GitHub Pages

Ajoute les memes valeurs dans **GitHub > Settings > Secrets and variables > Actions > Variables** :

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Puis ajoute-les au workflow de build comme variables `env`.

## 4. Ce que le backend garantit

- Un vote maximum par membre et par proposition, cote base de donnees.
- Les nouvelles propositions creeent une notification automatiquement.
- Les tables `ideas` et `notifications` sont disponibles en temps reel.
- Les regles RLS empechent un membre de modifier le profil d'un autre membre.

Le fichier `src/lib/supabase.ts` est deja pret. La migration complete du store local vers ces tables doit etre faite apres la creation du projet Supabase, car elle depend de l'URL et de la configuration d'authentification choisie.
