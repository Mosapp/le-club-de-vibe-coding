import { useEffect } from "react";
import { Button } from "@/components/ui";
import { Toaster } from "@/components/ui";
import { ClubProvider, useClub } from "@/lib/store";
import { navigate, useRoute } from "@/lib/router";
import { PageFade } from "@/lib/motion";
import Landing from "@/pages/Landing";
import Join from "@/pages/Join";
import Login from "@/pages/Login";
import { MemberShell } from "@/pages/member/Shell";
import MemberHome from "@/pages/member/Home";
import ProjectsPage from "@/pages/member/Projects";
import { ChallengesPage, SessionsPage } from "@/pages/member/Participate";
import { IdeasPage, RulesPage } from "@/pages/member/Community";
import ProfilePage from "@/pages/member/Profile";
import { AdminShell } from "@/pages/admin/Shell";
import { AdminDashboard, AdminMembers } from "@/pages/admin/Overview";
import {
  AdminChallenges,
  AdminIdeas,
  AdminMedia,
  AdminProjects,
  AdminRules,
  AdminSessions,
} from "@/pages/admin/Manage";

/* ------------------------------------------------------------------
   ROUTES
   /            landing
   /join        inscription en 5 étapes
   /login       reprendre son profil
   /app/*       espace membre (protégé)
   /app/reglement  page publique
   /admin/*     espace admin (rôle ADMIN requis)
------------------------------------------------------------------ */

function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-paper px-6 text-center">
      <p className="label-mono text-faint">Erreur 404</p>
      <h1 className="mt-5 text-[clamp(1.8rem,5vw,2.8rem)] font-semibold leading-tight text-ink">
        Cette page n'existe pas.
      </h1>
      <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-muted">
        Le lien a peut-être changé. Reviens à l'accueil, tout part de là.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button iconRight="arrowRight" onClick={() => navigate("/")}>
          Retour à l'accueil
        </Button>
        <Button variant="secondary" onClick={() => navigate("/join")}>
          Rejoindre le club
        </Button>
      </div>
    </div>
  );
}

function Routes() {
  const path = useRoute();

  useEffect(() => {
    if (!window.location.hash) window.history.replaceState(null, "", "#/");
  }, []);

  if (path === "/" || path === "") return <Landing />;
  if (path === "/join") return <Join />;
  if (path === "/login") return <Login />;

  if (path.startsWith("/app")) {
    const sub = path.replace("/app", "") || "/";
    const page = (() => {
      switch (sub) {
        case "/":
          return <MemberShell><MemberHome /></MemberShell>;
        case "/projets":
          return <MemberShell><ProjectsPage /></MemberShell>;
        case "/defis":
          return <MemberShell><ChallengesPage /></MemberShell>;
        case "/sessions":
          return <MemberShell><SessionsPage /></MemberShell>;
        case "/idees":
          return <MemberShell><IdeasPage /></MemberShell>;
        case "/reglement":
          return (
            <MemberShell allowAnonymous>
              <RulesPage />
            </MemberShell>
          );
        case "/profil":
          return <MemberShell><ProfilePage /></MemberShell>;
        default:
          return <NotFound />;
      }
    })();
    return page;
  }

  if (path.startsWith("/admin")) {
    const sub = path.replace("/admin", "") || "/";
    switch (sub) {
      case "/":
        return (
          <AdminShell>
            <AdminDashboard />
          </AdminShell>
        );
      case "/membres":
        return (
          <AdminShell>
            <AdminMembers />
          </AdminShell>
        );
      case "/projets":
        return (
          <AdminShell>
            <AdminProjects />
          </AdminShell>
        );
      case "/defis":
        return (
          <AdminShell>
            <AdminChallenges />
          </AdminShell>
        );
      case "/sessions":
        return (
          <AdminShell>
            <AdminSessions />
          </AdminShell>
        );
      case "/idees":
        return (
          <AdminShell>
            <AdminIdeas />
          </AdminShell>
        );
      case "/reglement":
        return (
          <AdminShell>
            <AdminRules />
          </AdminShell>
        );
      case "/medias":
        return (
          <AdminShell>
            <AdminMedia />
          </AdminShell>
        );
      default:
        return <NotFound />;
    }
  }

  return <NotFound />;
}

function Shell() {
  const { toasts, dismissToast } = useClub();
  const path = useRoute();

  useEffect(() => {
    document.body.style.overflow = "";
  }, [path]);

  return (
    <>
      <PageFade key={path}>
        <Routes />
      </PageFade>
      <Toaster toasts={toasts} onDismiss={dismissToast} />
    </>
  );
}

export default function App() {
  return (
    <ClubProvider>
      <Shell />
    </ClubProvider>
  );
}
