import { useEffect, useMemo, useRef, useState } from "react";

// Firebase
import { db, auth } from "./firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged, signInAnonymously } from "firebase/auth";

/**
 * IDEO-Style Feedforward Canvas – Veolia Matrix
 */

// ----------------------------
// Tipos (TypeScript)
// ----------------------------
type AnswerMap = Record<string, Record<number, string>>;

type Casilla = {
  id: string;
  title: string;
  feedforward: string;
  preguntas: string[];
};

type Block = {
  id: string;
  title: string;
  color: string;
  casillas: Casilla[];
};

// ----------------------------
// Design System (Palette & Tokens)
// ----------------------------
const LIGHT_THEME = {
  bg: "#0f172a",
  surface: "#0b1220cc",
  card: "#0b1220fa",
  text: "#e5e7eb",
  textMuted: "#cbd5e1",
  primary: "#22d3ee",
  primarySoft: "#67e8f9",
  accent: "#a78bfa",
  accentSoft: "#c4b5fd",
  ring: "#22d3ee",
  ok: "#34d399",
  warn: "#fbbf24",
  danger: "#fb7185",
};

// ----------------------------
// Data Model
// ----------------------------
const BLOCKS: Block[] = [
  // …………………… (tu mismo contenido de bloques sin cambios) ……………………
  // Copia aquí los BLOQUES exactamente como los tienes.
];

// Flatten count of questions for progress
const TOTAL_QUESTIONS = BLOCKS.reduce(
  (acc, b) => acc + b.casillas.reduce((a, c) => a + c.preguntas.length, 0),
  0
);

// ----------------------------
// Small UI helpers
// ----------------------------
function classNames(...xs: Array<string | false | null | undefined>): string {
  return xs.filter(Boolean).join(" ");
}

// 🔎 Normalizador
const norm = (s: string) =>
  (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

function SoftBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-xs tracking-wide">
      {children}
    </span>
  );
}

function IconSparkle({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className={className}
    >
      <path d="M12 3l1.6 3.9L18 8.5l-3.6 1.7L12 14l-2.4-3.8L6 8.5l4.4-1.6L12 3z" />
      <path d="M20 14l.9 2.2L23 17l-2.1.8L20 20l-.9-2.2L17 17l2.1-.8L20 14z" />
      <path d="M5 15l.8 1.8L8 17l-1.7.7L5 19l-.8-1.8L2 17l1.7-.2L5 15z" />
    </svg>
  );
}
function IconDownload({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className={className}
    >
      <path
        d="M12 3v12m0 0l-3.5-3.5M12 15l3.5-3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M5 21h14" strokeLinecap="round" />
    </svg>
  );
}
function IconTrash({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className={className}
    >
      <path
        d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function IconSearch({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className={className}
    >
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3-3" strokeLinecap="round" />
    </svg>
  );
}
function IconCheck({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={className}
    >
      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ----------------------------
// Main Component
// ----------------------------
export default function VeoliaFeedforwardCanvas() {
  const theme = LIGHT_THEME;

  // Copiar enlace
  const [copied, setCopied] = useState<boolean>(false);

  // 🔐 Sesión única
  function getSidFromLocation(): string | null {
    const url = new URL(window.location.href);
    const qsSid = url.searchParams.get("sid");
    if (qsSid) return qsSid;
    const hash = url.hash || "";
    const m = hash.match(/(?:^|[#&?])sid=([^&]+)/i);
    return m ? decodeURIComponent(m[1]) : null;
  }
  function ensureSidInUrl(sid: string): void {
    const url = new URL(window.location.href);
    url.searchParams.set("sid", sid);
    const hash = new URLSearchParams(url.hash.replace(/^#/, ""));
    hash.set("sid", sid);
    url.hash = hash.toString();
    window.history.replaceState({}, "", url);
  }
  const [sessionId] = useState<string>(() => {
    const fromUrl = getSidFromLocation();
    if (fromUrl) {
      ensureSidInUrl(fromUrl);
      return fromUrl;
    }
    let sid = sessionStorage.getItem("veolia_tab_sid");
    if (!sid) {
      sid = (crypto as any)?.randomUUID?.() || String(Date.now());
      sessionStorage.setItem("veolia_tab_sid", sid);
    }
    ensureSidInUrl(sid);
    return sid;
  });

  function copySessionLink(): void {
    const url = new URL(window.location.href);
    url.searchParams.set("sid", sessionId);
    const hash = new URLSearchParams(url.hash.replace(/^#/, ""));
    hash.set("sid", sessionId);
    url.hash = hash.toString();
    const link = url.toString();
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(link).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      });
    } else {
      const ta = document.createElement("textarea");
      ta.value = link;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  }

  const [query, setQuery] = useState<string>("");
  const [answers, setAnswers] = useState<AnswerMap>(() => {
    const saved = localStorage.getItem(`veolia_canvas_answers_${sessionId}`);
    return saved ? (JSON.parse(saved) as AnswerMap) : {};
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ⚙️ NUEVO: banderas de control para evitar sobrescrituras
  const cloudReadyRef = useRef(false); // true cuando auth + carga inicial terminó
  const skipAutosaveRef = useRef(false); // salta un autosave (reset/reload)

  // UI: botones ocupados
  const [busy, setBusy] = useState<null | "save" | "reload">(null);

  // Guardar YA en Firestore (manual)
  const saveNow = async () => {
    try {
      setBusy("save");
      const ref = doc(db, "canvasSessions", sessionId);
      await setDoc(
        ref,
        {
          answers,
          updatedAt: serverTimestamp(),
          manualSaveAt: new Date().toISOString(),
        },
        { merge: true }
      );
      alert("✅ Guardado en la nube.");
    } catch (e) {
      console.warn(e);
      alert("❌ No se pudo guardar en la nube.");
    } finally {
      setBusy(null);
    }
  };

  // Recargar desde Firestore (pisa lo local) — SIN autosave inmediato
  const reloadFromCloud = async () => {
    if (
      !confirm(
        "Esto reemplazará lo que tienes localmente con lo de la nube. ¿Continuar?"
      )
    )
      return;
    try {
      setBusy("reload");
      const ref = doc(db, "canvasSessions", sessionId);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        alert("No hay datos en la nube para esta sesión.");
        return;
      }
      const data = snap.data() as { answers?: AnswerMap };
      skipAutosaveRef.current = true; // ← evita que este setAnswers suba de vuelta
      setAnswers(data.answers || {});
      localStorage.setItem(
        `veolia_canvas_answers_${sessionId}`,
        JSON.stringify(data.answers || {})
      );
      alert("☁️ Datos recargados desde la nube.");
    } catch (e) {
      console.warn(e);
      alert("❌ No se pudo recargar desde la nube.");
    } finally {
      setBusy(null);
    }
  };

  // 1) Auth anónima + CARGA INICIAL (y luego habilita autosave)
  useEffect(() => {
    let mounted = true;
    cloudReadyRef.current = false; // al cambiar sessionId, volvemos a esperar

    const ensureAuthAndLoad = async () => {
      // Asegura usuario
      await new Promise<void>((resolve) => {
        const unsub = onAuthStateChanged(auth, async (user) => {
          if (!user) await signInAnonymously(auth);
          unsub();
          resolve();
        });
      });

      // Carga inicial desde Firestore (si hay)
      try {
        const ref = doc(db, "canvasSessions", sessionId);
        const snap = await getDoc(ref);
        if (mounted && snap.exists()) {
          const data = snap.data() as { answers?: AnswerMap };
          if (data?.answers && typeof data.answers === "object") {
            skipAutosaveRef.current = true; // ← no subas inmediatamente lo que acabas de bajar
            setAnswers(data.answers);
            localStorage.setItem(
              `veolia_canvas_answers_${sessionId}`,
              JSON.stringify(data.answers)
            );
          }
        }
      } catch (e) {
        console.warn("No se pudo cargar desde Firestore:", e);
      } finally {
        // ⚠️ Ahora sí permitimos autosave a partir de los próximos cambios
        cloudReadyRef.current = true;
      }
    };

    ensureAuthAndLoad();
    return () => {
      mounted = false;
    };
  }, [sessionId]);

  // 2) Guardado en localStorage
  useEffect(() => {
    localStorage.setItem(
      `veolia_canvas_answers_${sessionId}`,
      JSON.stringify(answers)
    );
  }, [answers, sessionId]);

  // 3) AUTOSAVE con debounce — solo si cloudReady y sin skip puntual
  useEffect(() => {
    if (!cloudReadyRef.current) return; // aún no estamos listos (auth/carga)
    if (skipAutosaveRef.current) {
      // salta 1 vez si venimos de reset/reload
      skipAutosaveRef.current = false;
      return;
    }

    const t = setTimeout(async () => {
      try {
        const ref = doc(db, "canvasSessions", sessionId);
        await setDoc(
          ref,
          { answers, updatedAt: serverTimestamp() },
          { merge: true }
        );
      } catch (e) {
        console.warn("Autosave Firestore falló:", e);
      }
    }, 600);

    return () => clearTimeout(t);
  }, [answers, sessionId]);

  const handleChange = (casillaId: string, qIdx: number, value: string) => {
    setAnswers((prev: AnswerMap) => ({
      ...prev,
      [casillaId]: { ...(prev[casillaId] || {}), [qIdx]: value },
    }));
  };

  // Filtro
  const filteredBlocks = useMemo(() => {
    const q = norm(query.trim());
    if (!q) return BLOCKS;
    return BLOCKS.map((b) => ({
      ...b,
      casillas: b.casillas.filter((c) => {
        const inTitle = norm(c.title).includes(q);
        const inFeed = norm(c.feedforward).includes(q);
        const inQs = c.preguntas.some((p) => norm(p).includes(q));
        const inAns = Object.values(answers[c.id] || {}).some((v) =>
          norm(String(v)).includes(q)
        );
        return inTitle || inFeed || inQs || inAns;
      }),
    })).filter((b) => b.casillas.length);
  }, [query, answers]);

  // progreso
  const answeredCount = useMemo(() => {
    let count = 0;
    BLOCKS.forEach((b) =>
      b.casillas.forEach((c) =>
        c.preguntas.forEach((_, idx) => {
          const v = answers?.[c.id]?.[idx];
          if (typeof v === "string" && v.trim().length > 0) count += 1;
        })
      )
    );
    return count;
  }, [answers]);

  const progressPct = Math.round((answeredCount / TOTAL_QUESTIONS) * 100);
  const answeredFor = (casillaId: string): number => {
    const vals = answers[casillaId];
    if (!vals) return 0;
    return Object.values(vals).filter((v) => v.trim().length > 0).length;
  };

  // TXT legible
  function buildPlainText(a: AnswerMap): string {
    const L: string[] = [];
    L.push("Feedforward Canvas – Veolia");
    L.push(`Exportado: ${new Date().toLocaleString()}`);
    L.push("");
    BLOCKS.forEach((b) => {
      L.push(`=== ${b.title} ===`);
      b.casillas.forEach((c) => {
        const entries = Object.entries(a[c.id] || {});
        if (entries.length === 0) return;
        L.push(`\n-- ${c.title} --`);
        L.push(`Feedforward: ${c.feedforward}`);
        c.preguntas.forEach((q, idx) => {
          const ans = (a?.[c.id]?.[idx] || "").trim();
          if (ans) {
            L.push(`\nP${idx + 1}: ${q}`);
            L.push(`Respuesta: ${ans}`);
          }
        });
        L.push("");
      });
      L.push("");
    });
    const text = L.join("\n");
    return text.trim().length ? text : "No hay respuestas diligenciadas aún.";
  }

  // Exporta como .txt
  function exportTXT(): void {
    const text = buildPlainText(answers);
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a: HTMLAnchorElement = document.createElement("a");
    a.href = url;
    a.download = `Veolia-Feedforward-Canvas-${new Date()
      .toISOString()
      .slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  // Importa .json / .txt
  function importFile(file: File): void {
    const normalize = (s: string) =>
      String(s || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .replace(/[–—-]/g, "-")
        .replace(/\s+/g, " ")
        .trim();

    const casillas = BLOCKS.flatMap((b) => b.casillas);
    const titleToId = new Map<string, string>(
      casillas.map((c) => [normalize(c.title), c.id])
    );

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const raw = String(reader.result).replace(/\r\n/g, "\n");
        const lowerName = file.name.toLowerCase();

        if (lowerName.endsWith(".json")) {
          const data = JSON.parse(raw);
          if (data && data.answers && typeof data.answers === "object") {
            skipAutosaveRef.current = true;
            setAnswers(data.answers as AnswerMap);
            return;
          }
          throw new Error("JSON inválido");
        }

        if (lowerName.endsWith(".txt")) {
          const lines: string[] = raw.split("\n");
          const newAnswers: AnswerMap = {};
          let currentCasillaId: string | null = null;
          let currentPreguntaIdx: number | null = null;
          let buffer: string | null = null;

          const isBlockHeader = (line: string) =>
            /^===\s*.+?\s*===\s*$/.test(line.trim());
          const isCasillaLine = (line: string) =>
            /^--\s*.+?\s*--\s*$/.test(line.trim());
          const getCasillaTitle = (line: string) =>
            line.trim().replace(/^--\s*|\s*--$/g, "");

          const flushBuffer = () => {
            if (
              currentCasillaId &&
              currentPreguntaIdx != null &&
              buffer != null
            ) {
              if (!newAnswers[currentCasillaId])
                newAnswers[currentCasillaId] = {} as Record<number, string>;
              newAnswers[currentCasillaId][currentPreguntaIdx] = buffer.trim();
            }
            buffer = null;
          };

          for (let i = 0; i < lines.length; i++) {
            const line: string = lines[i];

            if (isBlockHeader(line)) {
              flushBuffer();
              currentPreguntaIdx = null;
              continue;
            }

            if (isCasillaLine(line)) {
              flushBuffer();
              const titulo = getCasillaTitle(line);
              const id = titleToId.get(normalize(titulo));
              currentCasillaId = id || null;
              currentPreguntaIdx = null;
              continue;
            }

            const mP = line.match(/^P\s*(\d+)\s*:/i);
            if (mP && currentCasillaId) {
              flushBuffer();
              currentPreguntaIdx = parseInt(mP[1], 10) - 1;
              continue;
            }

            const mR = line.match(/^Respuesta:\s*(.*)$/i);
            if (mR && currentCasillaId != null && currentPreguntaIdx != null) {
              flushBuffer();
              buffer = mR[1] ?? "";
              continue;
            }

            if (buffer != null) buffer += "\n" + line;
          }

          flushBuffer();
          skipAutosaveRef.current = true;
          setAnswers(newAnswers);
          return;
        }

        alert(
          "Formato no reconocido. Usa un .json o .txt exportado desde esta app."
        );
      } catch {
        alert(
          "Archivo inválido. Asegúrate de cargar un .json o .txt exportado desde este canvas."
        );
      }
    };
    reader.readAsText(file);
  }

  // Reset LOCAL (no sube {} a la nube)
  const resetAll = () => {
    if (confirm("¿Borrar todas las respuestas del canvas (solo local)?")) {
      skipAutosaveRef.current = true; // ← evita subir {} inmediatamente
      setAnswers({});
      localStorage.removeItem(`veolia_canvas_answers_${sessionId}`);
    }
  };

  // ---------------- UI ----------------
  return (
    <div
      className="min-h-screen w-full"
      style={{
        // @ts-ignore
        "--bg": theme.bg,
        "--surface": theme.surface,
        "--card": theme.card,
        "--text": theme.text,
        "--text-muted": theme.textMuted,
        "--primary": theme.primary,
        "--primary-soft": theme.primarySoft,
        "--accent": theme.accent,
        "--accent-soft": theme.accentSoft,
        "--ring": theme.ring,
      }}
    >
      {/* Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(1200px_800px_at_10%_10%,rgba(34,211,238,0.15),transparent),radial-gradient(900px_700px_at_90%_20%,rgba(167,139,250,0.12),transparent),radial-gradient(1200px_900px_at_30%_100%,rgba(100,116,139,0.3),transparent)]" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#0b1020] via-[#0f162f] to-[#0b1220]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-30 backdrop-blur supports-[backdrop-filter]:bg-white/5 bg-white/5 border-b border-white/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-cyan-400 to-violet-400 grid place-content-center text-slate-900 font-black">
              <IconSparkle className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-semibold tracking-tight text-[var(--text)]">
                Feedforward Canvas – Veolia
              </h1>
              <p className="text-xs text-[var(--text-muted)]">
                Matrix by ibiika.com • 6 bloques • 12 casillas •{" "}
                {TOTAL_QUESTIONS} preguntas
              </p>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2">
            {/* Search */}
            <label className="group relative inline-flex items-center">
              <span className="absolute left-3 text-slate-300/70">
                <IconSearch />
              </span>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar en títulos, feedforward o preguntas…"
                className="w-[280px] sm:w-[360px] rounded-xl bg-[var(--surface)] border border-white/10 text-[var(--text)] placeholder:text-slate-300/60 pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent"
              />
            </label>

            {/* Guardar YA en nube */}
            <button
              onClick={saveNow}
              disabled={busy !== null}
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--primary)]/10 text-[var(--text)] px-3 py-2 hover:bg-[var(--primary)]/20 border border-[var(--primary)]/30 disabled:opacity-50"
              title="Guardar ahora en Firestore"
            >
              ☁️↑
              <span className="hidden sm:inline">
                {busy === "save" ? "Guardando..." : "Guardar nube"}
              </span>
            </button>

            {/* Recargar desde nube */}
            <button
              onClick={reloadFromCloud}
              disabled={busy !== null}
              className="inline-flex items-center gap-2 rounded-xl bg-white/5 text-[var(--text)] px-3 py-2 hover:bg-white/10 border border-white/10 disabled:opacity-50"
              title="Recargar desde Firestore (reemplaza lo local)"
            >
              ☁️↓
              <span className="hidden sm:inline">
                {busy === "reload" ? "Cargando..." : "Recargar nube"}
              </span>
            </button>

            {/* Export */}
            <button
              onClick={exportTXT}
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--primary)]/10 text-[var(--text)] px-3 py-2 hover:bg-[var(--primary)]/20 border border-[var(--primary)]/30"
              title="Exportar respuestas (TXT)"
            >
              <IconDownload />
              <span className="hidden sm:inline">Exportar</span>
            </button>

            {/* Import */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)]/10 text-[var(--text)] px-3 py-2 hover:bg-[var(--accent)]/20 border border-[var(--accent)]/30"
              title="Importar respuestas"
            >
              ⤒<span className="hidden sm:inline">Importar</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,.txt"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) importFile(f);
                e.currentTarget.value = "";
              }}
            />

            {/* Copiar enlace */}
            <button
              onClick={copySessionLink}
              className="inline-flex items-center gap-2 rounded-xl bg-white/5 text-[var(--text)] px-3 py-2 hover:bg-white/10 border border-white/10"
              title="Copiar enlace de esta sesión"
            >
              🔗
              <span className="hidden sm:inline">
                {copied ? "¡Copiado!" : "Compartir"}
              </span>
            </button>

            {/* Reset (SOLO LOCAL, sin tocar la nube) */}
            <button
              onClick={resetAll}
              className="inline-flex items-center gap-2 rounded-xl bg-white/5 text-[var(--text)] px-3 py-2 hover:bg-white/10 border border-white/10"
              title="Borrar todas las respuestas (solo local)"
            >
              <IconTrash />
              <span className="hidden sm:inline">Reset</span>
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-1.5 bg-white/10">
          <div
            className="h-1.5 bg-gradient-to-r from-cyan-400 via-sky-400 to-violet-400 transition-all"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </header>

      {/* Subheader */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-6">
        <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--text-muted)]">
          <SoftBadge>
            Avance:{" "}
            <span className="text-[var(--text)] font-medium ml-1">
              {answeredCount}/{TOTAL_QUESTIONS}
            </span>
          </SoftBadge>
          <SoftBadge>
            Completado:{" "}
            <span className="text-[var(--text)] font-medium ml-1">
              {progressPct}%
            </span>
          </SoftBadge>
          <SoftBadge>Guardado localmente</SoftBadge>
          {query && <SoftBadge>Filtro activo: “{query}”</SoftBadge>}
        </div>
      </div>

      {/* Content Grid */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {filteredBlocks.map((block) => (
          <section key={block.id} className="mb-10">
            {/* Block Header */}
            <div className="mb-4 flex items-baseline justify-between">
              <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-[var(--text)]">
                <span
                  className={classNames(
                    "mr-2 rounded-md px-2 py-0.5 text-sm text-slate-900",
                    `bg-gradient-to-r ${block.color}`
                  )}
                >
                  {block.title.split(":")[0]}
                </span>
                <span className="opacity-90">
                  {block.title.split(":")[1]
                    ? `: ${block.title.split(":")[1]}`
                    : ""}
                </span>
              </h2>
              <div className="text-xs text-[var(--text-muted)]">
                {block.casillas.length} casillas
              </div>
            </div>

            {/* Casillas Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
              {block.casillas.map((c) => {
                const answeredInCasilla = answeredFor(c.id);
                return (
                  <article
                    key={c.id}
                    className="relative rounded-2xl border border-white/10 bg-[var(--card)] shadow-[0_10px_30px_rgba(0,0,0,0.25)] overflow-hidden"
                  >
                    <div
                      className={classNames(
                        "absolute inset-x-0 top-0 h-1.5",
                        `bg-gradient-to-r ${block.color}`
                      )}
                    />
                    <div className="p-5 sm:p-6">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="text-base sm:text-lg font-semibold leading-tight text-[var(--text)] pr-6">
                          {c.title}
                        </h3>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-[var(--text-muted)]">
                            {answeredInCasilla}/{c.preguntas.length}
                          </span>
                          {answeredInCasilla === c.preguntas.length && (
                            <span
                              className="text-emerald-400"
                              title="Casilla completa"
                            >
                              <IconCheck />
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="mt-3 rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-[var(--text)]">
                        <p className="leading-relaxed">
                          <span className="font-medium text-cyan-300">
                            Feedforward:
                          </span>{" "}
                          “{c.feedforward}”
                        </p>
                      </div>

                      <div className="mt-4 space-y-4">
                        {c.preguntas.map((p, idx) => (
                          <div key={idx} className="group">
                            <label className="block text-[13px] text-[var(--text-muted)] mb-2">
                              <span className="mr-1 inline-block rounded-md bg-white/5 px-1.5 py-0.5 text-[11px] font-mono text-cyan-200 border border-white/10">
                                P{idx + 1}
                              </span>{" "}
                              {p}
                            </label>
                            <textarea
                              value={answers?.[c.id]?.[idx] || ""}
                              onChange={(e) =>
                                handleChange(c.id, idx, e.target.value)
                              }
                              placeholder="Escribe aquí hallazgos, ejemplos, datos, responsables, fechas, etc."
                              className="
                                min-h-[88px] w-full resize-y rounded-xl
                                bg-[#0f172a] text-slate-200
                                placeholder:text-slate-400
                                border border-slate-700
                                px-3 py-2 shadow-inner
                                focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent
                              "
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ))}

        <div className="mt-10 mb-20 text-center text-sm text-[var(--text-muted)]">
          <p>
            Consejo: usa{" "}
            <span className="text-[var(--text)] font-medium">Exportar</span>{" "}
            para compartir o respaldar respuestas, e{" "}
            <span className="text-[var(--text)] font-medium">Importar</span>{" "}
            para continuar donde quedaste.
          </p>
        </div>
      </main>
    </div>
  );
}
