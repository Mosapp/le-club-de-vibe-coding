import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { CHALLENGES_SECTION, RULES_INITIAL } from "@/config/content";
import { clearMediaOverrides, writeMediaOverride } from "@/config/media";
import { isConfiguredAdmin } from "@/config/admin-access";
import { supabase } from "@/lib/supabase";

/* ------------------------------------------------------------------
   COUCHE DONNÉES — CLUB DE VIBE CODING
   ------------------------------------------------------------------
   ⚠️ NOTE D'ARCHITECTURE
   Ce projet est un front autonome (build en un seul fichier), il n'y a
   donc pas encore de backend. Cette couche SIMULE un serveur :
   - un « client API » central (api.*) qui valide les rôles ;
   - une persistance locale pour ne rien perdre en rafraîchissant ;
   - aucune donnée fictive n'est injectée : projets, sessions et idées
     démarrent vides et affichent de vrais états vides.

   En production, il faut brancher ces mêmes fonctions sur un backend
   (auth serveur + contrôle de rôle côté serveur + uploads sécurisés).
   Un rôle ne doit JAMAIS pouvoir être modifié depuis le navigateur.
------------------------------------------------------------------ */

export type Role = "MEMBER" | "ADMIN";
export type MemberStatus = "ACTIVE" | "SUSPENDED";

export interface Member {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  level: string;
  motivations: string[];
  goal: string;
  engagement: string;
  role: Role;
  status: MemberStatus;
  createdAt: string;
  lastSeenAt: string;
}

export type ProjectKind = "web" | "mobile" | "ia" | "autres";

export interface Project {
  id: string;
  title: string;
  description: string;
  kind: ProjectKind;
  tech: string[];
  mediaSlot: string | null;
  imageUrl: string | null;
  link: string | null;
  authorId: string;
  createdAt: string;
  published: boolean;
}

export type ChallengeStatus = "à venir" | "actif" | "terminé";

export interface Challenge {
  id: string;
  code: string;
  title: string;
  description: string;
  difficulty: string;
  duration: string;
  tech: string[];
  participants: string[];
  status: ChallengeStatus;
  createdAt: string;
}

export interface Session {
  id: string;
  title: string;
  subject: string;
  date: string | null;
  time: string | null;
  host: string;
  link: string | null;
  attendees: string[];
  createdAt: string;
}

export type IdeaStatus = "proposée" | "en discussion" | "retenue" | "refusée";

export interface Idea {
  id: string;
  title: string;
  description: string;
  category: "session" | "défi" | "règle" | "autre";
  authorId: string;
  votes: string[];
  status: IdeaStatus;
  createdAt: string;
}

export interface Rule {
  id: string;
  n: string;
  title: string;
  text: string;
  status: "adoptée" | "en discussion" | "proposée";
  source: string;
  updatedAt: string;
}

export interface Activity {
  id: string;
  memberId: string;
  label: string;
  at: string;
}

export interface Toast {
  id: string;
  title: string;
  description?: string;
  tone: "success" | "info" | "error";
}

interface Data {
  members: Member[];
  projects: Project[];
  challenges: Challenge[];
  sessions: Session[];
  ideas: Idea[];
  rules: Rule[];
  activity: Activity[];
  sessionId: string | null;
}

const DATA_KEY = "cvc/data/v3";
const SESSION_KEY = "cvc/session/v3";

const uid = () => Math.random().toString(36).slice(2, 10);

function seed(): Data {
  return {
    members: [],
    projects: [],
    challenges: CHALLENGES_SECTION.programme.map((c) => ({
      id: uid(),
      code: c.code,
      title: c.title,
      description: c.text,
      difficulty: c.difficulty,
      duration: c.duration,
      tech: c.tech,
      participants: [],
      status: c.status as ChallengeStatus,
      createdAt: new Date().toISOString(),
    })),
    sessions: [],
    ideas: [],
    rules: RULES_INITIAL.map((r) => ({
      id: r.id,
      n: r.n,
      title: r.title,
      text: r.text,
      status: r.status,
      source: "Bureau du club",
      updatedAt: new Date().toISOString(),
    })),
    activity: [],
    sessionId: null,
  };
}

function load(): Data {
  try {
    const raw = localStorage.getItem(DATA_KEY);
    if (!raw) return seed();
    const parsed = JSON.parse(raw) as Data;
    return { ...seed(), ...parsed };
  } catch {
    return seed();
  }
}

function save(data: Data) {
  try {
    localStorage.setItem(DATA_KEY, JSON.stringify(data));
  } catch {
    /* quota plein : on ignore silencieusement */
  }
}

function readSessionId(): string | null {
  try {
    return localStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
}

/* ------------------------- ERREURS MÉTIER ------------------------ */

export class ApiError extends Error {}

/* --------------------------- PROVIDER ---------------------------- */

interface Ctx {
  data: Data;
  me: Member | null;
  isAdmin: boolean;
  mediaVersion: number;
  toasts: Toast[];
  toast: (t: Omit<Toast, "id">) => void;
  dismissToast: (id: string) => void;
  pending: Record<string, boolean>;
  /* auth */
  signUp: (input: Omit<Member, "id" | "role" | "status" | "createdAt" | "lastSeenAt"> & { email: string; password: string }) => Promise<Member>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
  /* profil */
  updateProfile: (patch: Partial<Pick<Member, "firstName" | "lastName" | "avatarUrl" | "level" | "goal" | "engagement" | "motivations">>) => void;
  /* projets */
  createProject: (input: Omit<Project, "id" | "authorId" | "createdAt" | "published">) => Promise<void>;
  updateProject: (id: string, patch: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  toggleProjectPublish: (id: string) => void;
  /* défis */
  createChallenge: (input: Omit<Challenge, "id" | "participants" | "createdAt">) => void;
  updateChallenge: (id: string, patch: Partial<Challenge>) => void;
  deleteChallenge: (id: string) => void;
  toggleChallengeParticipation: (id: string) => void;
  /* sessions */
  createSession: (input: Omit<Session, "id" | "attendees" | "createdAt">) => void;
  updateSession: (id: string, patch: Partial<Session>) => void;
  deleteSession: (id: string) => void;
  toggleAttendance: (id: string) => void;
  /* idées */
  createIdea: (input: Pick<Idea, "title" | "description" | "category">) => void;
  voteIdea: (id: string) => void;
  setIdeaStatus: (id: string, status: IdeaStatus) => void;
  deleteIdea: (id: string) => void;
  /* règlement */
  createRule: (input: Pick<Rule, "title" | "text">) => void;
  updateRule: (id: string, patch: Partial<Rule>) => void;
  deleteRule: (id: string) => void;
  /* admin membres */
  setMemberStatus: (id: string, status: MemberStatus) => void;
  setMemberRole: (id: string, role: Role) => void;
  deleteMember: (id: string) => void;
  /* médias */
  assignMedia: (slot: string, value: { src: string | null; video: string | null }) => void;
  resetMedia: () => void;
  resetAll: () => void;
}

const ClubContext = createContext<Ctx | null>(null);

export function ClubProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<Data>(() => load());
  const [sessionId, setSessionId] = useState<string | null>(() => readSessionId());
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [mediaVersion, setMediaVersion] = useState(0);
  const [pending, setPending] = useState<Record<string, boolean>>({});
  const timers = useRef<Record<string, number>>({});

  useEffect(() => save(data), [data]);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== DATA_KEY || !event.newValue) return;
      try {
        setData(JSON.parse(event.newValue) as Data);
      } catch {
        /* donnée locale invalide : on conserve l'état courant */
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    try {
      if (sessionId) localStorage.setItem(SESSION_KEY, sessionId);
      else localStorage.removeItem(SESSION_KEY);
    } catch {
      /* noop */
    }
  }, [sessionId]);

  useEffect(() => {
    if (!supabase) return;
    let cancelled = false;
    const loadSharedData = async () => {
      const { data: auth } = await supabase.auth.getSession();
      if (!auth.session || cancelled) return;
      setSessionId(auth.session.user.id);
      const [{ data: remoteMembers }, { data: remoteProjects }] = await Promise.all([
        supabase.from("members").select("*"),
        supabase.from("projects").select("*").order("created_at", { ascending: false }),
      ]);
      if (cancelled) return;
      const members: Member[] = (remoteMembers ?? []).map((profile) => ({
        id: profile.id,
        firstName: profile.first_name,
        lastName: profile.last_name,
        avatarUrl: profile.avatar_url ?? undefined,
        level: profile.level,
        motivations: profile.motivations ?? [],
        goal: profile.goal,
        engagement: profile.engagement,
        role: profile.role,
        status: profile.status,
        createdAt: profile.created_at,
        lastSeenAt: profile.last_seen_at,
      }));
      const projects: Project[] = (remoteProjects ?? []).map((project) => ({
        id: project.id,
        title: project.title,
        description: project.description,
        kind: project.kind,
        tech: project.tech ?? [],
        mediaSlot: project.media_slot,
        imageUrl: project.image_url,
        link: project.link,
        authorId: project.author_id,
        createdAt: project.created_at,
        published: project.published,
      }));
      setData((prev) => ({ ...prev, members, projects }));
    };
    void loadSharedData();
    const channel = supabase
      .channel("club-shared-data")
      .on("postgres_changes", { event: "*", schema: "public", table: "members" }, () => void loadSharedData())
      .on("postgres_changes", { event: "*", schema: "public", table: "projects" }, () => void loadSharedData())
      .subscribe();
    return () => {
      cancelled = true;
      void supabase.removeChannel(channel);
    };
  }, []);

  const me = useMemo(
    () => data.members.find((m) => m.id === sessionId && m.status === "ACTIVE") ?? null,
    [data.members, sessionId],
  );

  const toast = useCallback((t: Omit<Toast, "id">) => {
    const id = uid();
    setToasts((prev) => [...prev, { ...t, id }]);
    timers.current[id] = window.setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== id));
    }, 4200);
  }, []);

  const dismissToast = useCallback((id: string) => {
    window.clearTimeout(timers.current[id]);
    setToasts((prev) => prev.filter((x) => x.id !== id));
  }, []);

  useEffect(() => () => Object.values(timers.current).forEach((t) => window.clearTimeout(t)), []);

  const setBusy = useCallback((key: string, value: boolean) => {
    setPending((prev) => ({ ...prev, [key]: value }));
  }, []);

  const requireMember = useCallback(() => {
    if (!me) throw new ApiError("Il faut être connecté pour faire ça.");
    return me;
  }, [me]);

  const requireAdmin = useCallback(() => {
    if (!isConfiguredAdmin(me)) throw new ApiError("Action réservée au bureau du club.");
    return me;
  }, [me]);

  /* ----------------------------- AUTH ---------------------------- */

  const signUp: Ctx["signUp"] = useCallback(
    async (input) => {
      setBusy("signUp", true);
      await new Promise((r) => setTimeout(r, 480));
      try {
        if (!input.firstName.trim()) throw new ApiError("Ton prénom est obligatoire.");
        if (!input.lastName.trim()) throw new ApiError("Ton nom est obligatoire.");
        if (supabase) {
          const { data: authData, error } = await supabase.auth.signUp({
            email: input.email,
            password: input.password,
            options: { data: { first_name: input.firstName, last_name: input.lastName } },
          });
          if (error) throw new ApiError(error.message);
          if (!authData.user) throw new ApiError("Impossible de créer ton compte.");
          const now = new Date().toISOString();
          const member: Member = {
            ...input,
            id: authData.user.id,
            role: "MEMBER",
            status: "ACTIVE",
            createdAt: now,
            lastSeenAt: now,
          };
          if (authData.session) {
            const { error: profileError } = await supabase.from("members").upsert({
              id: member.id,
              first_name: member.firstName,
              last_name: member.lastName,
              level: member.level,
              motivations: member.motivations,
              goal: member.goal,
              engagement: member.engagement,
              role: isConfiguredAdmin(member) ? "ADMIN" : "MEMBER",
            });
            if (profileError) throw new ApiError(profileError.message);
          }
          member.role = isConfiguredAdmin(member) ? "ADMIN" : "MEMBER";
          setData((prev) => ({ ...prev, members: [...prev.members, member] }));
          if (authData.session) setSessionId(member.id);
          toast({
            title: authData.session ? `Bienvenue ${member.firstName}.` : "Compte créé.",
            description: authData.session ? "Ton compte est prêt." : "Vérifie ton email pour confirmer ton inscription, puis connecte-toi.",
            tone: "success",
          });
          return member;
        }
        const now = new Date().toISOString();
        const member: Member = {
          ...input,
          id: uid(),
          role: "MEMBER",
          status: "ACTIVE",
          createdAt: now,
          lastSeenAt: now,
        };
        member.role = isConfiguredAdmin(member) ? "ADMIN" : "MEMBER";
        setData((prev) => ({
          ...prev,
          members: [...prev.members, member],
          activity: [{ id: uid(), memberId: member.id, label: "A rejoint le club", at: now }, ...prev.activity],
        }));
        setSessionId(member.id);
        toast({ title: `Bienvenue ${member.firstName} 👋`, description: "Ton profil est prêt.", tone: "success" });
        return member;
      } finally {
        setBusy("signUp", false);
      }
    },
    [toast],
  );

  const signIn: Ctx["signIn"] = useCallback(
    async (email, password) => {
      setBusy("signIn", true);
      await new Promise((r) => setTimeout(r, 320));
      if (supabase) {
        const { data: authData, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error || !authData.user) throw new ApiError(error?.message ?? "Connexion impossible.");
        let { data: profile, error: profileError } = await supabase.from("members").select("*").eq("id", authData.user.id).single();
        if (!profile) {
          const metadata = authData.user.user_metadata ?? {};
          const recovery = await supabase.from("members").upsert({
            id: authData.user.id,
            first_name: String(metadata.first_name ?? "Membre"),
            last_name: String(metadata.last_name ?? "du club"),
          }).select("*").single();
          profile = recovery.data;
          profileError = recovery.error;
        }
        if (profileError || !profile) throw new ApiError(profileError?.message ?? "Profil membre introuvable.");
        const member: Member = {
          id: profile.id,
          firstName: profile.first_name,
          lastName: profile.last_name,
          avatarUrl: profile.avatar_url ?? undefined,
          level: profile.level,
          motivations: profile.motivations ?? [],
          goal: profile.goal,
          engagement: profile.engagement,
          role: profile.role,
          status: profile.status,
          createdAt: profile.created_at,
          lastSeenAt: profile.last_seen_at,
        };
        setData((prev) => ({ ...prev, members: [...prev.members.filter((m) => m.id !== member.id), member] }));
        setSessionId(member.id);
        setBusy("signIn", false);
        toast({ title: `Content de te revoir, ${member.firstName}.`, tone: "success" });
        return;
      }
      const member = data.members.find((m) => m.id === email);
      setBusy("signIn", false);
      if (!member) throw new ApiError("Ce profil n'existe plus.");
      if (member.status === "SUSPENDED") throw new ApiError("Ce profil est suspendu. Contacte le bureau du club.");
      setSessionId(member.id);
      toast({ title: `Content de te revoir, ${member.firstName}.`, tone: "success" });
    },
    [data.members, toast],
  );

  const signOut = useCallback(() => {
    if (supabase) void supabase.auth.signOut();
    setSessionId(null);
    toast({ title: "À bientôt.", tone: "info" });
  }, [toast]);

  /* ---------------------------- PROFIL --------------------------- */

  const updateProfile: Ctx["updateProfile"] = useCallback(
    (patch) => {
      const m = requireMember();
      setData((prev) => ({
        ...prev,
        members: prev.members.map((x) => (x.id === m.id ? { ...x, ...patch } : x)),
      }));
      toast({ title: "Profil mis à jour.", tone: "success" });
    },
    [requireMember, toast],
  );

  /* ---------------------------- PROJETS -------------------------- */

  const createProject: Ctx["createProject"] = useCallback(
    async (input) => {
      const m = requireMember();
      if (!input.title.trim()) throw new ApiError("Ton projet a besoin d'un nom.");
      if (supabase) {
        const { data: project, error } = await supabase
          .from("projects")
          .insert({
            title: input.title,
            description: input.description,
            kind: input.kind,
            tech: input.tech,
            media_slot: input.mediaSlot,
            image_url: input.imageUrl,
            link: input.link,
            author_id: m.id,
            published: true,
          })
          .select()
          .single();
        if (error || !project) throw new ApiError(error?.message ?? "Impossible de publier le projet.");
        const created: Project = {
          id: project.id,
          title: project.title,
          description: project.description,
          kind: project.kind,
          tech: project.tech ?? [],
          mediaSlot: project.media_slot,
          imageUrl: project.image_url,
          link: project.link,
          authorId: project.author_id,
          createdAt: project.created_at,
          published: project.published,
        };
        setData((prev) => ({ ...prev, projects: [created, ...prev.projects] }));
        toast({ title: "Projet publié sur le mur des créations.", tone: "success" });
        return;
      }
      setData((prev) => ({
        ...prev,
        projects: [
          {
            ...input,
            id: uid(),
            authorId: m.id,
            createdAt: new Date().toISOString(),
            published: true,
          },
          ...prev.projects,
        ],
        activity: [
          { id: uid(), memberId: m.id, label: `A partagé le projet « ${input.title} »`, at: new Date().toISOString() },
          ...prev.activity,
        ],
      }));
      toast({ title: "Projet publié sur le mur des créations.", tone: "success" });
    },
    [requireMember, toast],
  );

  const updateProject: Ctx["updateProject"] = useCallback(
    (id, patch) => {
      const m = requireMember();
      const project = data.projects.find((p) => p.id === id);
      if (!project) throw new ApiError("Projet introuvable.");
      if (project.authorId !== m.id && m.role !== "ADMIN") throw new ApiError("Tu ne peux modifier que tes projets.");
      setData((prev) => ({
        ...prev,
        projects: prev.projects.map((p) => (p.id === id ? { ...p, ...patch } : p)),
      }));
      toast({ title: "Projet mis à jour.", tone: "success" });
    },
    [data.projects, requireMember, toast],
  );

  const deleteProject: Ctx["deleteProject"] = useCallback(
    (id) => {
      const m = requireAdmin();
      setData((prev) => ({ ...prev, projects: prev.projects.filter((p) => p.id !== id) }));
      toast({ title: "Projet supprimé.", tone: "info" });
      void m;
    },
    [requireAdmin, toast],
  );

  const toggleProjectPublish: Ctx["toggleProjectPublish"] = useCallback(
    (id) => {
      requireAdmin();
      setData((prev) => ({
        ...prev,
        projects: prev.projects.map((p) => (p.id === id ? { ...p, published: !p.published } : p)),
      }));
    },
    [requireAdmin],
  );

  /* ----------------------------- DÉFIS --------------------------- */

  const createChallenge: Ctx["createChallenge"] = useCallback(
    (input) => {
      requireAdmin();
      if (!input.title.trim()) throw new ApiError("Le défi a besoin d'un titre.");
      setData((prev) => ({
        ...prev,
        challenges: [
          { ...input, id: uid(), participants: [], createdAt: new Date().toISOString() },
          ...prev.challenges,
        ],
      }));
      toast({ title: "Défi créé.", tone: "success" });
    },
    [requireAdmin, toast],
  );

  const updateChallenge: Ctx["updateChallenge"] = useCallback(
    (id, patch) => {
      requireAdmin();
      setData((prev) => ({
        ...prev,
        challenges: prev.challenges.map((c) => (c.id === id ? { ...c, ...patch } : c)),
      }));
    },
    [requireAdmin],
  );

  const deleteChallenge: Ctx["deleteChallenge"] = useCallback(
    (id) => {
      requireAdmin();
      setData((prev) => ({ ...prev, challenges: prev.challenges.filter((c) => c.id !== id) }));
      toast({ title: "Défi supprimé.", tone: "info" });
    },
    [requireAdmin, toast],
  );

  const toggleChallengeParticipation: Ctx["toggleChallengeParticipation"] = useCallback(
    (id) => {
      const m = requireMember();
      setData((prev) => ({
        ...prev,
        challenges: prev.challenges.map((c) =>
          c.id === id
            ? {
                ...c,
                participants: c.participants.includes(m.id)
                  ? c.participants.filter((x) => x !== m.id)
                  : [...c.participants, m.id],
              }
            : c,
        ),
      }));
    },
    [requireMember],
  );

  /* ---------------------------- SESSIONS ------------------------- */

  const createSession: Ctx["createSession"] = useCallback(
    (input) => {
      requireAdmin();
      if (!input.title.trim()) throw new ApiError("La session a besoin d'un titre.");
      setData((prev) => ({
        ...prev,
        sessions: [{ ...input, id: uid(), attendees: [], createdAt: new Date().toISOString() }, ...prev.sessions],
      }));
      toast({ title: "Session créée.", tone: "success" });
    },
    [requireAdmin, toast],
  );

  const updateSession: Ctx["updateSession"] = useCallback(
    (id, patch) => {
      requireAdmin();
      setData((prev) => ({
        ...prev,
        sessions: prev.sessions.map((s) => (s.id === id ? { ...s, ...patch } : s)),
      }));
    },
    [requireAdmin],
  );

  const deleteSession: Ctx["deleteSession"] = useCallback(
    (id) => {
      requireAdmin();
      setData((prev) => ({ ...prev, sessions: prev.sessions.filter((s) => s.id !== id) }));
      toast({ title: "Session supprimée.", tone: "info" });
    },
    [requireAdmin, toast],
  );

  const toggleAttendance: Ctx["toggleAttendance"] = useCallback(
    (id) => {
      const m = requireMember();
      setData((prev) => ({
        ...prev,
        sessions: prev.sessions.map((s) =>
          s.id === id
            ? {
                ...s,
                attendees: s.attendees.includes(m.id)
                  ? s.attendees.filter((x) => x !== m.id)
                  : [...s.attendees, m.id],
              }
            : s,
        ),
      }));
    },
    [requireMember],
  );

  /* ----------------------------- IDÉES --------------------------- */

  const createIdea: Ctx["createIdea"] = useCallback(
    (input) => {
      const m = requireMember();
      if (!input.title.trim()) throw new ApiError("Ton idée a besoin d'un titre.");
      setData((prev) => ({
        ...prev,
        ideas: [
          {
            ...input,
            id: uid(),
            authorId: m.id,
            votes: [m.id],
            status: "proposée",
            createdAt: new Date().toISOString(),
          },
          ...prev.ideas,
        ],
      }));
      toast({ title: "Idée ajoutée à la boîte.", tone: "success" });
    },
    [requireMember, toast],
  );

  const voteIdea: Ctx["voteIdea"] = useCallback(
    (id) => {
      const m = requireMember();
      const idea = data.ideas.find((item) => item.id === id);
      if (!idea) throw new ApiError("Proposition introuvable.");
      if (idea.votes.includes(m.id)) throw new ApiError("Tu as déjà voté pour cette proposition.");
      setData((prev) => ({
        ...prev,
        ideas: prev.ideas.map((idea) => {
          if (idea.id !== id) return idea;
          return { ...idea, votes: [...idea.votes, m.id] };
        }),
      }));
      toast({ title: "Vote enregistré.", description: "Tu ne peux voter qu'une seule fois pour cette proposition.", tone: "success" });
    },
    [data.ideas, requireMember, toast],
  );

  const setIdeaStatus: Ctx["setIdeaStatus"] = useCallback(
    (id, status) => {
      requireAdmin();
      setData((prev) => ({ ...prev, ideas: prev.ideas.map((i) => (i.id === id ? { ...i, status } : i)) }));
    },
    [requireAdmin],
  );

  const deleteIdea: Ctx["deleteIdea"] = useCallback(
    (id) => {
      requireAdmin();
      setData((prev) => ({ ...prev, ideas: prev.ideas.filter((i) => i.id !== id) }));
      toast({ title: "Idée supprimée.", tone: "info" });
    },
    [requireAdmin, toast],
  );

  /* --------------------------- RÈGLEMENT ------------------------- */

  const createRule: Ctx["createRule"] = useCallback(
    (input) => {
      requireAdmin();
      if (!input.title.trim()) throw new ApiError("La règle a besoin d'un titre.");
      setData((prev) => ({
        ...prev,
        rules: [
          ...prev.rules,
          {
            ...input,
            id: uid(),
            n: String(prev.rules.length + 1).padStart(2, "0"),
            status: "en discussion",
            source: "Bureau du club",
            updatedAt: new Date().toISOString(),
          },
        ],
      }));
      toast({ title: "Règle ajoutée.", tone: "success" });
    },
    [requireAdmin, toast],
  );

  const updateRule: Ctx["updateRule"] = useCallback(
    (id, patch) => {
      requireAdmin();
      setData((prev) => ({
        ...prev,
        rules: prev.rules.map((r) => (r.id === id ? { ...r, ...patch, updatedAt: new Date().toISOString() } : r)),
      }));
    },
    [requireAdmin],
  );

  const deleteRule: Ctx["deleteRule"] = useCallback(
    (id) => {
      requireAdmin();
      setData((prev) => ({ ...prev, rules: prev.rules.filter((r) => r.id !== id) }));
      toast({ title: "Règle supprimée.", tone: "info" });
    },
    [requireAdmin, toast],
  );

  /* ------------------------- ADMIN / MEMBRES --------------------- */

  const setMemberStatus: Ctx["setMemberStatus"] = useCallback(
    (id, status) => {
      const admin = requireAdmin();
      if (id === admin.id) throw new ApiError("Tu ne peux pas suspendre ton propre profil.");
      setData((prev) => ({
        ...prev,
        members: prev.members.map((m) => (m.id === id ? { ...m, status } : m)),
      }));
      toast({
        title: status === "SUSPENDED" ? "Membre suspendu." : "Membre réactivé.",
        tone: status === "SUSPENDED" ? "info" : "success",
      });
    },
    [requireAdmin, toast],
  );

  const setMemberRole: Ctx["setMemberRole"] = useCallback(
    (id, role) => {
      const admin = requireAdmin();
      if (id === admin.id) throw new ApiError("Utilise la déconnexion pour changer ton propre rôle.");
      setData((prev) => ({ ...prev, members: prev.members.map((m) => (m.id === id ? { ...m, role } : m)) }));
      toast({ title: role === "ADMIN" ? "Droits administrateur accordés." : "Droits retirés.", tone: "success" });
    },
    [requireAdmin, toast],
  );

  const deleteMember: Ctx["deleteMember"] = useCallback(
    (id) => {
      const admin = requireAdmin();
      if (id === admin.id) throw new ApiError("Tu ne peux pas supprimer ton propre profil.");
      setData((prev) => ({
        ...prev,
        members: prev.members.filter((m) => m.id !== id),
        projects: prev.projects.filter((p) => p.authorId !== id),
      }));
      toast({ title: "Membre supprimé.", tone: "info" });
    },
    [requireAdmin, toast],
  );

  /* ----------------------------- MÉDIAS -------------------------- */

  const assignMedia: Ctx["assignMedia"] = useCallback(
    (slot, value) => {
      requireAdmin();
      writeMediaOverride(slot, value);
      setMediaVersion((v) => v + 1);
      toast({ title: `Média « ${slot} » mis à jour.`, tone: "success" });
    },
    [requireAdmin, toast],
  );

  const resetMedia = useCallback(() => {
    requireAdmin();
    clearMediaOverrides();
    setMediaVersion((v) => v + 1);
    toast({ title: "Médias réinitialisés sur la configuration.", tone: "info" });
  }, [requireAdmin, toast]);

  const resetAll = useCallback(() => {
    localStorage.removeItem(DATA_KEY);
    localStorage.removeItem(SESSION_KEY);
    clearMediaOverrides();
    setData(seed());
    setSessionId(null);
    setMediaVersion((v) => v + 1);
    toast({ title: "Données réinitialisées.", tone: "info" });
  }, [toast]);

  const value: Ctx = {
    data,
    me,
    isAdmin: isConfiguredAdmin(me),
    mediaVersion,
    toasts,
    toast,
    dismissToast,
    pending,
    signUp,
    signIn,
    signOut,
    updateProfile,
    createProject,
    updateProject,
    deleteProject,
    toggleProjectPublish,
    createChallenge,
    updateChallenge,
    deleteChallenge,
    toggleChallengeParticipation,
    createSession,
    updateSession,
    deleteSession,
    toggleAttendance,
    createIdea,
    voteIdea,
    setIdeaStatus,
    deleteIdea,
    createRule,
    updateRule,
    deleteRule,
    setMemberStatus,
    setMemberRole,
    deleteMember,
    assignMedia,
    resetMedia,
    resetAll,
  };

  return <ClubContext.Provider value={value}>{children}</ClubContext.Provider>;
}

export function useClub() {
  const ctx = useContext(ClubContext);
  if (!ctx) throw new Error("useClub doit être utilisé dans <ClubProvider>");
  return ctx;
}

/* --------------------------- HELPERS ----------------------------- */

export function memberName(m: Member | undefined | null) {
  if (!m) return "Membre du club";
  return `${m.firstName} ${m.lastName}`.trim();
}

export function initials(m: Member | undefined | null) {
  if (!m) return "·";
  return `${m.firstName[0] ?? ""}${m.lastName[0] ?? ""}`.toUpperCase();
}

export function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
  } catch {
    return iso;
  }
}

export function formatShortDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
  } catch {
    return iso;
  }
}

/** Progression d'un membre : participation réelle, pas de score inventé. */
export function memberProgress(data: Data, memberId: string) {
  const projects = data.projects.filter((p) => p.authorId === memberId && p.published).length;
  const challenges = data.challenges.filter((c) => c.participants.includes(memberId)).length;
  const sessions = data.sessions.filter((s) => s.attendees.includes(memberId)).length;
  const ideas = data.ideas.filter((i) => i.authorId === memberId).length;
  const votes = data.ideas.filter((i) => i.votes.includes(memberId)).length;
  const points = projects * 3 + challenges * 2 + sessions * 2 + ideas + votes;
  const total = data.challenges.length * 2 + Math.max(data.sessions.length, 4) * 2 + 6;
  const pct = Math.min(100, Math.round((points / Math.max(total, 1)) * 100));
  return { projects, challenges, sessions, ideas, votes, points, pct };
}
