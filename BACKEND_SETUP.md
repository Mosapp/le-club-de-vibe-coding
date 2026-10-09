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

## 3. Synchroniser les contributions

Si Supabase est deja configure et que le site affiche les projets sans afficher
les idees ou les votes des autres membres, execute `supabase/migration-shared-contributions.sql`
dans le **SQL Editor**. Cette migration active les tables, les regles RLS et le
temps reel necessaires aux projets, idees et votes.

Les membres doivent etre connectes au meme projet Supabase. Les idees qui
avaient ete enregistrees uniquement dans le stockage local d'un navigateur ne
peuvent pas etre partagees automatiquement : elles doivent etre reproposees.

## 4. GitHub Pages

Ajoute les memes valeurs dans **GitHub > Settings > Secrets and variables > Actions > Variables** :

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Puis ajoute-les au workflow de build comme variables `env`.

## 5. Ce que le backend garantit

- Un vote maximum par membre et par proposition, cote base de donnees.
- Les nouvelles propositions creeent une notification automatiquement.
- Les projets, idees et votes sont partages entre les membres et actualises en temps reel.
- Les nouvelles propositions creent une notification automatiquement.
- Les regles RLS empechent un membre de modifier le profil d'un autre membre.

Les défis, sessions et regles du club restent stockes localement dans cette version.
