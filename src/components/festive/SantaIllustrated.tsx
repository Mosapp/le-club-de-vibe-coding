import { useEffect, useState } from "react";
import { navigate } from "@/lib/router";

/* 🎅 Père Noël dessiné (SVG) et animé en CSS : coucou de la main, clignement des yeux,
   respiration, pompon qui se balance. Toucher le Père Noël → « Ho ho ho ! » + lien vers les jeux.
   Utilisé tant qu'aucun modèle 3D (public/santa/santa.glb) n'est déposé. */

export function SantaFigure({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 212" className={className} aria-hidden="true">
      <defs>
        <radialGradient id="xm-coat" cx="40%" cy="35%" r="75%">
          <stop offset="0" stopColor="#ef3b4f" />
          <stop offset="1" stopColor="#a5122a" />
        </radialGradient>
        <radialGradient id="xm-face" cx="45%" cy="40%" r="70%">
          <stop offset="0" stopColor="#fcdcc4" />
          <stop offset="1" stopColor="#efb894" />
        </radialGradient>
        <linearGradient id="xm-fur" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#dfe8f0" />
        </linearGradient>
      </defs>

      {/* ombre au sol */}
      <ellipse cx="80" cy="206" rx="46" ry="5" fill="rgba(0,0,0,0.35)" />

      <g className="xm-santa-body">
        {/* bottes et jambes */}
        <rect x="50" y="188" width="26" height="16" rx="7" fill="#1b1b1f" />
        <rect x="84" y="188" width="26" height="16" rx="7" fill="#1b1b1f" />
        <rect x="56" y="166" width="48" height="26" rx="6" fill="#b3172f" />

        {/* bras gauche (au repos) */}
        <path d="M40 114 Q28 136 30 160" stroke="url(#xm-coat)" strokeWidth="18" strokeLinecap="round" fill="none" />
        <circle cx="30" cy="163" r="8" fill="url(#xm-fur)" />
        <circle cx="30" cy="170" r="9" fill="#1e6b3a" />

        {/* manteau */}
        <ellipse cx="80" cy="142" rx="50" ry="48" fill="url(#xm-coat)" />
        <rect x="74" y="100" width="12" height="86" rx="6" fill="url(#xm-fur)" />
        <rect x="30" y="174" width="100" height="16" rx="8" fill="url(#xm-fur)" />
        <rect x="30" y="150" width="100" height="12" fill="#1b1b1f" />
        <rect x="70" y="146" width="20" height="20" rx="3" fill="none" stroke="#f4c542" strokeWidth="3.5" />
      </g>

      {/* bras droit qui fait coucou (pivote à l'épaule) */}
      <g className="xm-santa-wave">
        <path d="M118 114 Q136 100 144 78" stroke="url(#xm-coat)" strokeWidth="18" strokeLinecap="round" fill="none" />
        <circle cx="145" cy="76" r="8" fill="url(#xm-fur)" />
        <circle cx="147" cy="66" r="10" fill="#1e6b3a" />
        <ellipse cx="139" cy="64" rx="4" ry="6" fill="#1e6b3a" transform="rotate(-25 139 64)" />
      </g>

      <g className="xm-santa-head">
        {/* visage */}
        <circle cx="80" cy="72" r="26" fill="url(#xm-face)" />
        <circle cx="63" cy="83" r="5.5" fill="#f2918a" opacity="0.55" />
        <circle cx="97" cy="83" r="5.5" fill="#f2918a" opacity="0.55" />

        {/* yeux (clignent) */}
        <g className="xm-santa-eyes">
          <ellipse cx="71" cy="70" rx="3.2" ry="3.8" fill="#2b1d14" />
          <ellipse cx="89" cy="70" rx="3.2" ry="3.8" fill="#2b1d14" />
          <circle cx="72" cy="68.8" r="1" fill="#fff" />
          <circle cx="90" cy="68.8" r="1" fill="#fff" />
        </g>
        <path d="M64 62 Q71 57 77 61" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" fill="none" />
        <path d="M83 61 Q89 57 96 62" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" fill="none" />

        {/* barbe, moustache, bouche, nez */}
        <path
          className="xm-santa-beard"
          d="M52 74 Q46 96 58 112 Q66 126 80 130 Q94 126 102 112 Q114 96 108 74 Q100 92 80 92 Q60 92 52 74 Z"
          fill="url(#xm-fur)"
        />
        <ellipse cx="80" cy="101" rx="4.5" ry="3.2" fill="#a42a2a" />
        <ellipse cx="70.5" cy="91" rx="11.5" ry="6" fill="#fff" />
        <ellipse cx="89.5" cy="91" rx="11.5" ry="6" fill="#fff" />
        <circle cx="80" cy="82" r="5.5" fill="#f08a7c" />

        {/* bonnet */}
        <path d="M54 50 Q66 6 110 12 Q124 18 120 34 Q104 26 106 50 Z" fill="url(#xm-coat)" />
        <rect x="50" y="44" width="60" height="13" rx="6.5" fill="url(#xm-fur)" />
        <g className="xm-santa-pompom">
          <circle cx="121" cy="35" r="8.5" fill="url(#xm-fur)" />
        </g>
      </g>
    </svg>
  );
}

export function SantaIllustrated({ onHide }: { onHide: () => void }) {
  const [talk, setTalk] = useState(false);

  useEffect(() => {
    if (!talk) return;
    const t = window.setTimeout(() => setTalk(false), 6000);
    return () => window.clearTimeout(t);
  }, [talk]);

  return (
    <div className="xm-santa-2d fixed left-2 z-[55] sm:left-4">
      {talk && (
        <div className="xm-speech anim-pop absolute bottom-full left-2 mb-1 w-[190px] rounded-2xl p-3 text-[13px] leading-snug" role="status">
          <b>Ho ho ho ! 🎅</b>
          <br />
          Des énigmes t'attendent dans mon atelier.
          <button
            type="button"
            onClick={() => navigate("/fetes")}
            className="mt-2 block w-full rounded-lg bg-[#c81d36] px-2 py-1.5 text-[12.5px] font-semibold text-white"
          >
            Jouer avec moi 🎁
          </button>
        </div>
      )}
      <button type="button" onClick={() => setTalk((v) => !v)} className="block h-full w-full" aria-label="Parler au Père Noël">
        <SantaFigure className="h-full w-full drop-shadow-[0_10px_18px_rgba(0,0,0,0.45)]" />
      </button>
      <button
        type="button"
        onClick={onHide}
        className="absolute -right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/55 text-[11px] text-white"
        aria-label="Masquer le Père Noël"
      >
        ✕
      </button>
    </div>
  );
}

/* 🛷 Le traîneau et les rennes traversent le ciel de temps en temps (toutes les 45 s environ). */
export function SleighFlyby() {
  return (
    <div aria-hidden="true" className="xm-sleigh-track pointer-events-none fixed left-0 right-0 top-[11vh] z-[44] overflow-hidden">
      <div className="xm-sleigh">
        <svg viewBox="0 0 300 80" className="xm-sleigh-bob h-[46px] w-auto sm:h-[64px]">
          {/* traînée d'étoiles */}
          <g fill="#ffd36b">
            <circle cx="292" cy="44" r="1.6" opacity="0.5" />
            <circle cx="282" cy="38" r="1.2" opacity="0.7" />
            <circle cx="272" cy="47" r="1.8" opacity="0.8" />
            <circle cx="262" cy="41" r="1.1" opacity="0.9" />
          </g>
          {/* rênes */}
          <path d="M26 30 Q90 18 150 32 Q180 38 196 44" stroke="#c9a227" strokeWidth="1.4" fill="none" />
          {/* trois rennes (le premier a le nez rouge) */}
          {[0, 52, 104].map((dx, i) => (
            <g key={dx} transform={`translate(${dx} 0)`} className={i % 2 ? "xm-deer-b" : "xm-deer-a"}>
              <ellipse cx="34" cy="38" rx="17" ry="8" fill="#8a5a36" />
              <path d="M22 44 l-6 12 M28 45 l-2 13 M42 45 l4 12 M47 43 l7 11" stroke="#6b4428" strokeWidth="3" strokeLinecap="round" />
              <path d="M20 34 Q14 26 12 22" stroke="#8a5a36" strokeWidth="6" strokeLinecap="round" />
              <circle cx="11" cy="21" r="5.5" fill="#9b6a43" />
              <path d="M12 16 l-3 -8 M12 13 l-6 -2 M14 16 l4 -8 M15 12 l6 -2" stroke="#d9c4a0" strokeWidth="1.8" strokeLinecap="round" />
              <circle cx="6" cy="22" r={i === 0 ? 2.8 : 1.8} fill={i === 0 ? "#ff3b3b" : "#3b2a1c"} />
            </g>
          ))}
          {/* traîneau */}
          <path d="M184 34 h70 q10 0 8 12 l-4 10 h-66 q-10 0 -12 -10 z" fill="#c81d36" />
          <path d="M178 62 h86 q8 0 10 -6" stroke="#ffd36b" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M192 56 v6 M246 56 v6" stroke="#ffd36b" strokeWidth="2.5" />
          {/* hotte */}
          <ellipse cx="244" cy="30" rx="13" ry="11" fill="#7a4b2a" />
          <circle cx="238" cy="20" r="4" fill="#2a9d4b" />
          <rect x="246" y="17" width="7" height="7" rx="1" fill="#2563eb" />
          {/* Père Noël */}
          <ellipse cx="214" cy="30" rx="11" ry="12" fill="#d62839" />
          <circle cx="212" cy="16" r="7" fill="#fcd9bf" />
          <path d="M206 18 q6 12 12 0" fill="#fff" />
          <path d="M205 13 q6 -12 15 -2 q3 4 -1 6 q-2 -6 -14 -4 z" fill="#d62839" />
          <circle cx="220" cy="17" r="2.6" fill="#fff" />
          <path d="M204 26 Q192 24 186 30" stroke="#d62839" strokeWidth="5" strokeLinecap="round" fill="none" />
        </svg>
      </div>
    </div>
  );
}
