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

## 6. Halloween Code Mystery (énigme d'entrée + épreuve ultime)

1. Ouvre `supabase/migration-halloween.sql` et remplace `COLLE_ICI_LE_LIEN_CLAUDE_CODE`
   (étape 6, tout en bas) par le vrai lien du trésor.
2. Colle tout le fichier dans **SQL Editor**, puis exécute-le.

Le serveur garantit alors :

- un nom = une seule participation, et 10 tentatives maximum comptées côté serveur ;
- chaque détective qui atteint 5/10 reçoit un mot de la phrase secrète (n°1 à 10, puis on recommence) ;
- le lien du trésor n'est jamais dans le code du site : il n'est envoyé qu'à un détective qui tape la phrase complète (10 essais).

Pour suivre le concours : **Table Editor > halloween_players** (`passed_at` = entrée sur le site,
`fragment` = numéro du mot reçu, `claimed_at` = trésor trouvé). Pour changer le lien plus tard :

```sql
update public.halloween_secret set treasure_url = 'https://…' where id = 1;
```

Tant que cette migration n'est pas exécutée, le jeu fonctionne en local et l'épreuve ultime
affiche « les fragments ne sont pas encore distribués ».
