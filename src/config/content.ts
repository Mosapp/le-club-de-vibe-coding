/* ------------------------------------------------------------------
   CONTENU DU SITE — CLUB DE VIBE CODING
   ------------------------------------------------------------------
   Tous les textes sont ici : tu peux modifier un titre ou une
   description sans toucher au design.
   Aucune donnée fictive n'est présentée comme réelle (pas de
   nombre de membres inventé, pas de faux témoignages).
------------------------------------------------------------------ */

export const BRAND = {
  name: "Club de Vibe Coding",
  short: "CVC",
  tagline: "On apprend ensemble à créer avec l'IA.",
};

export const WHATSAPP_GROUP_URL = "https://chat.whatsapp.com/IFBp3DpkT4VKPtXhYwhAy6";

export const NAV = {
  primary: [
    { label: "Le club", href: "#le-club" },
    { label: "Vibe Coding", href: "#vibe-coding" },
    { label: "Projets", href: "#projets" },
    { label: "Défis", href: "#defis" },
    { label: "Sessions", href: "#sessions" },
  ],
  member: [
    { label: "Accueil", route: "/app" },
    { label: "Projets", route: "/app/projets" },
    { label: "Défis", route: "/app/defis" },
    { label: "Sessions", route: "/app/sessions" },
    { label: "Idées", route: "/app/idees" },
    { label: "Règlement", route: "/app/reglement" },
    { label: "Profil", route: "/app/profil" },
  ],
  admin: [
    { label: "Vue d'ensemble", route: "/admin" },
    { label: "Membres", route: "/admin/membres" },
    { label: "Projets", route: "/admin/projets" },
    { label: "Défis", route: "/admin/defis" },
    { label: "Sessions", route: "/admin/sessions" },
    { label: "Idées", route: "/admin/idees" },
    { label: "Règlement", route: "/admin/reglement" },
    { label: "Media Library", route: "/admin/medias" },
  ],
};

export const HERO = {
  badge: "Club de Vibe Coding",
  titleLines: ["APPRENDS À CRÉER", "AVEC L'IA."],
  titleAccent: "L'IA.",
  subtitle:
    "Une communauté pour apprendre le développement autrement, expérimenter avec l'IA et transformer ses idées en projets.",
  primaryCta: "Rejoindre le club",
  secondaryCta: "Découvrir",
  secondaryHref: "#vibe-coding",
  mediaCaption: "Hero — image ou vidéo remplaçable",
  mediaSlot: "HERO_MEDIA",
};

export const PRINCIPLES = [
  "On expérimente",
  "On partage ce qu'on apprend",
  "On crée des vrais projets",
  "On aide celui qui débute",
  "L'IA est un partenaire",
  "On documente tout",
];

export const VIBE_CODING = {
  eyebrow: "C'est quoi le Vibe Coding ?",
  title: "LE CODE CHANGE.",
  titleLine2: "TA FAÇON D'APPRENDRE AUSSI.",
  intro:
    "Le Vibe Coding, c'est utiliser l'intelligence artificielle comme un partenaire de travail : explorer une idée, générer du code, tester, corriger, recommencer. Tu ne récites plus un tutoriel — tu construis.",
  mediaSlot: "VIBE_CODING_MEDIA",
  steps: [
    {
      n: "01",
      title: "Tu as une idée",
      text: "Une envie, un problème du quotidien, une interface en tête. Peu importe la taille.",
    },
    {
      n: "02",
      title: "Tu la formules",
      text: "Tu apprends à décrire clairement ce que tu veux. C'est la compétence centrale du Vibe Coding.",
    },
    {
      n: "03",
      title: "Tu itères avec l'IA",
      text: "Générer, lire, tester, corriger. L'IA propose, tu décides, tu comprends ce que tu livres.",
    },
    {
      n: "04",
      title: "Tu partages",
      text: "Ton projet rejoint le mur des créations. Quelqu'un d'autre repart avec ton idée en tête.",
    },
  ],
};

export const WHY_JOIN = {
  eyebrow: "Pourquoi rejoindre le club",
  title: "QUATRE BONNES RAISONS.",
  cards: [
    {
      key: "apprendre",
      title: "APPRENDRE",
      text: "Développer de nouvelles compétences, à ton rythme, avec des gens qui expliquent simplement.",
      icon: "book",
    },
    {
      key: "creer",
      title: "CRÉER",
      text: "Transformer une idée en projet réel, du premier croquis jusqu'à la mise en ligne.",
      icon: "spark",
    },
    {
      key: "partager",
      title: "PARTAGER",
      text: "Découvrir les créations des autres, montrer les siennes, assumer les ratés.",
      icon: "share",
    },
    {
      key: "progresser",
      title: "PROGRESSER",
      text: "Participer aux défis et aux sessions de travail pour tenir la régularité.",
      icon: "trend",
    },
  ],
};

export const COMMUNITY = {
  eyebrow: "La communauté",
  title: "ON APPREND ENSEMBLE.",
  intro:
    "Le club n'est pas une école : c'est un atelier. On vient avec son niveau, on repart avec un projet et des gens à qui en parler.",
  mediaMain: "COMMUNITY_MEDIA_01",
  mediaSecondary: "COMMUNITY_MEDIA_02",
  mediaPortrait: "COMMUNITY_MEDIA_03",
  pillars: [
    "Des sessions de travail où l'on code réellement",
    "Des défis courts pour se lancer",
    "Un mur des créations sans jugement",
    "Une boîte à idées qui fait évoluer le club",
  ],
  emptyNote:
    "Aucune photo de membre n'est affichée ici pour l'instant : rien n'est inventé. Les visuels seront remplacés par de vrais moments du club.",
};

export const PROJECTS_SECTION = {
  eyebrow: "Projets",
  title: "CE QU'ON Y CRÉE.",
  intro:
    "Quelques formats de projets pour te donner une idée. Le mur des créations se remplira des projets réels des membres.",
  cta: "Découvrir",
  items: [
    {
      slot: "PROJECT_IMAGE_01",
      title: "Une landing page",
      text: "Partir d'une page blanche et livrer un site qui raconte quelque chose.",
      tech: ["HTML", "CSS", "IA"],
      kind: "web",
    },
    {
      slot: "PROJECT_IMAGE_02",
      title: "Une mini-application",
      text: "Un outil utile, petit, mais qu'on utilise vraiment au quotidien.",
      tech: ["React", "Mobile"],
      kind: "mobile",
    },
    {
      slot: "PROJECT_IMAGE_03",
      title: "Un assistant sur mesure",
      text: "Un petit produit construit autour d'un modèle d'IA et d'un usage précis.",
      tech: ["IA", "API"],
      kind: "ia",
    },
    {
      slot: "PROJECT_IMAGE_04",
      title: "Ton idée ici",
      text: "Emplacement réservé pour le prochain projet du club. Peut-être le tien.",
      tech: ["À venir"],
      kind: "autres",
    },
  ],
};

export const CHALLENGES_SECTION = {
  eyebrow: "Défis",
  title: "DES DÉFIS COURTS POUR SE LANCER.",
  intro:
    "Un objectif clair, une durée limitée, aucune obligation de réussir. Le but est de livrer quelque chose.",
  mediaSlot: "CHALLENGE_MEDIA",
  programme: [
    {
      code: "DÉFI #01",
      title: "Créer une landing page avec l'IA",
      text: "Une page, un message, un appel à l'action. Du croquis au site en ligne.",
      difficulty: "Débutant",
      duration: "1 semaine",
      participants: null,
      status: "à venir" as const,
      tech: ["IA", "Web"],
    },
    {
      code: "DÉFI #02",
      title: "Un outil qui résout un vrai problème",
      text: "Choisis une tâche pénible de ta semaine et construis une mini-app pour elle.",
      difficulty: "Intermédiaire",
      duration: "2 semaines",
      participants: null,
      status: "à venir" as const,
      tech: ["Produit", "IA"],
    },
  ],
};

export const SESSIONS_SECTION = {
  eyebrow: "Sessions",
  title: "DES SESSIONS POUR AVANCER VRAIMENT.",
  intro:
    "Un format récurrent : on arrive, on travaille, on repart avec quelque chose de concret. Le calendrier est défini par l'équipe du club.",
  mediaSlot: "SESSION_MEDIA",
  format: {
    name: "Vibe Session",
    when: "Samedi après-midi",
    time: "2 à 3 heures",
    what: "Créer une mini application avec l'IA, à plusieurs.",
    details: [
      "On démarre par un rapide tour de table des idées",
      "On travaille en binômes ou en solo, comme tu veux",
      "On termine par une démonstration de 2 minutes",
    ],
  },
  empty:
    "Aucune session n'est encore planifiée. Dès qu'une date est confirmée, elle apparaît ici et dans ton espace membre.",
};

export const CTA = {
  title: "TON PROCHAIN PROJET PEUT COMMENCER ICI.",
  text: "Rejoins le club, dis-nous ce que tu veux construire, et viens coder avec nous.",
  primary: "Rejoindre le club",
  secondary: "Voir le règlement",
  secondaryHref: "#/app/reglement",
  note: "Inscription en 5 étapes · moins de 2 minutes",
};

export const JOIN = {
  title: "REJOINDRE LE CLUB",
  intro: "Cinq étapes rapides. Tes réponses restent modifiables depuis ton profil.",
  steps: [
    {
      id: "identity",
      label: "Qui tu es",
      title: "On commence par toi",
      subtitle: "Comment t'appelles-tu ?",
    },
    {
      id: "level",
      label: "Ton niveau",
      title: "Où tu en es",
      subtitle: "Il n'y a pas de mauvaise réponse.",
    },
    {
      id: "why",
      label: "Ta motivation",
      title: "Pourquoi rejoindre ?",
      subtitle: "Plusieurs choix possibles.",
    },
    {
      id: "goal",
      label: "Ton objectif",
      title: "Ton objectif personnel",
      subtitle: "En une phrase, que veux-tu construire ou apprendre ?",
    },
    {
      id: "engagement",
      label: "Ton rythme",
      title: "Ton niveau d'engagement",
      subtitle: "On s'adapte, aucune pression.",
    },
  ],
  levels: ["1BT", "2BT", "3BT", "1BTS", "2BTS", "NOOB"],
  motivations: [
    "Apprendre à développer",
    "Créer un projet",
    "Utiliser l'IA",
    "Rencontrer d'autres créateurs",
    "Améliorer mes compétences",
    "Découvrir le Vibe Coding",
  ],
  engagements: [
    { value: "Régulier", hint: "Je viens aux sessions et je participe aux défis." },
    { value: "Occasionnel", hint: "Je passe quand mon agenda le permet." },
    { value: "Découverte", hint: "Je veux d'abord voir comment ça marche." },
  ],
  done: {
    title: "BIENVENUE DANS LE CLUB.",
    text: "Ton profil est prêt. Il ne reste plus qu'à construire quelque chose.",
    cta: "Découvrir mon espace",
  },
};

export const RULES_INITIAL = [
  {
    id: "r1",
    n: "01",
    title: "On vient pour apprendre, pas pour juger",
    text: "Tous les niveaux sont bienvenus. Personne n'est obligé de savoir avant d'essayer.",
    status: "adoptée" as const,
  },
  {
    id: "r2",
    n: "02",
    title: "On explique ce qu'on livre",
    text: "Un projet partagé s'accompagne d'un mot sur comment il a été construit.",
    status: "adoptée" as const,
  },
  {
    id: "r3",
    n: "03",
    title: "L'IA écrit, tu comprends",
    text: "Utiliser l'IA est encouragé. Livrer du code qu'on ne comprend pas, non.",
    status: "adoptée" as const,
  },
  {
    id: "r4",
    n: "04",
    title: "On ne publie pas le travail des autres",
    text: "On crédite, on demande l'accord, on ne s'approprie pas un projet de membre.",
    status: "adoptée" as const,
  },
  {
    id: "r5",
    n: "05",
    title: "Le règlement évolue",
    text: "Chaque membre peut proposer une règle via la boîte à idées. Le club en discute puis tranche.",
    status: "en discussion" as const,
  },
];

export const EMPTY_STATES = {
  projects: {
    title: "Aucun projet pour le moment.",
    text: "Sois peut-être le premier à partager le tien.",
    cta: "Partager un projet",
  },
  challenges: {
    title: "Aucun défi actif.",
    text: "Les défis sont ouverts par l'équipe du club. Reviens bientôt.",
  },
  sessions: {
    title: "Aucune session planifiée.",
    text: "Le calendrier arrive. En attendant, tu peux proposer un sujet dans la boîte à idées.",
  },
  ideas: {
    title: "La boîte à idées est vide.",
    text: "Propose la première idée : un sujet de session, un défi, une règle du club.",
  },
  members: {
    title: "Aucun membre pour l'instant.",
    text: "Les inscriptions apparaîtront ici dès qu'elles seront enregistrées.",
  },
};

export const FOOTER = {
  columns: [
    {
      title: "Le club",
      links: [
        { label: "C'est quoi le Vibe Coding", href: "#vibe-coding" },
        { label: "La communauté", href: "#communaute" },
        { label: "Le règlement", href: "#/app/reglement" },
      ],
    },
    {
      title: "Participer",
      links: [
        { label: "Rejoindre le club", href: "#/join" },
        { label: "Projets", href: "#/app/projets" },
        { label: "Défis", href: "#/app/defis" },
        { label: "Sessions", href: "#/app/sessions" },
      ],
    },
    {
      title: "Espaces",
      links: [
        { label: "Espace membre", href: "#/app" },
        { label: "Boîte à idées", href: "#/app/idees" },
        { label: "Espace admin", href: "#/admin" },
      ],
    },
  ],
  note: "Les visuels du site sont remplaçables en un seul endroit : src/config/media.ts.",
};
