import { useEffect, useMemo, useRef, useState } from "react";

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
  {
    id: "bloque1",
    title: "Bloque 1: Perfil y Objetivos del Cliente",
    color: "from-cyan-400 to-violet-400",
    casillas: [
      {
        id: "c1",
        title: "Casilla 1 – Perfil operativo (Quién es y cómo funciona)",
        feedforward:
          "Queremos entender mejor cómo funciona su operación hoy, para identificar juntos dónde Veolia podría aportar mayor valor en los próximos meses.",
        preguntas: [
          "¿En qué procesos se concentra el mayor consumo de agua o energía, o la mayor generación de residuos?",
          "Si pudieran mejorar un proceso en los próximos 3 meses, ¿cuál generaría el mayor ahorro o impacto positivo?",
        ],
      },
      {
        id: "c2",
        title: "Casilla 2 – Objetivos y prioridades de negocio",
        feedforward:
          "Queremos conocer hacia dónde se proyecta su operación, para alinear nuestras soluciones al rumbo que están construyendo.",
        preguntas: [
          "Si tuviera que elegir uno de estos tres caminos como prioridad estratégica -descarbonizar, regenerar o descontaminar-, ¿cuál marcaría el norte de su operación hoy?",
          "¿En qué plazo esperan ver avances en esas prioridades: corto (3 meses), medio (6 meses) o más largo (12 meses)?",
        ],
      },
    ],
  },
  {
    id: "bloque2",
    title: "Bloque 2: Operación y Regulaciones",
    color: "from-emerald-400 to-cyan-400",
    casillas: [
      {
        id: "c3",
        title: "Casilla 3 – Indicadores críticos de operación (KPIs)",
        feedforward:
          "Nos interesa saber qué indicadores son clave para ustedes, para explorar cómo podrían mejorar de manera medible en los próximos meses.",
        preguntas: [
          "¿Qué indicadores de consumo, costos o continuidad de equipos siguen más de cerca en su operación, y qué metas se han fijado para mejorarlos en los próximos meses?",
        ],
      },
      {
        id: "c4",
        title: "Casilla 4 – Regulaciones y licencias",
        feedforward:
          "Sabemos que el entorno regulatorio cambia constantemente. Queremos identificar con ustedes cómo anticipar esos cambios y convertirlos en oportunidades de valor.",
        preguntas: [
          "¿Qué auditorías, inspecciones o normas recientes han representado mayor reto para su operación?",
          "¿Qué fechas o compromisos regulatorios tienen próximos en el radar (renovación de permisos, reportes, auditorías)?",
          "¿Qué apoyo adicional de Veolia les daría más tranquilidad frente al cumplimiento regulatorio?",
        ],
      },
    ],
  },
  {
    id: "bloque3",
    title: "Bloque 3: Relación con Veolia y Contratos Vigentes",
    color: "from-fuchsia-400 to-rose-400",
    casillas: [
      {
        id: "c5",
        title: "Casilla 5 – Servicios actuales y contratos",
        feedforward:
          "Queremos conocer cómo valoran los servicios actuales de Veolia y explorar juntos cómo podríamos fortalecerlos o ampliarlos en el corto plazo.",
        preguntas: [
          "De los servicios que hoy reciben de Veolia, ¿cuáles consideran más esenciales para su operación diaria?",
          "¿Hay algún servicio de Veolia que ven con potencial de fortalecerse o crecer en el corto plazo?",
          "¿Qué momentos clave tienen identificados en sus contratos actuales (renovación, prórroga o revisión)?",
        ],
      },
      {
        id: "c6",
        title: "Casilla 6 – Personas clave y proceso de decisiones",
        feedforward:
          "Queremos entender cómo se toman las decisiones en su organización, para acompañarlos con la información y el soporte adecuados.",
        preguntas: [
          "¿Quiénes participan normalmente en la decisión de ampliar o renovar un servicio como los de Veolia?",
          "¿Qué información o acompañamiento les resulta más útil para facilitar la aprobación interna?",
        ],
      },
    ],
  },
  {
    id: "bloque4",
    title: "Bloque 4: Dolencias y Datos",
    color: "from-cyan-400 to-indigo-400",
    casillas: [
      {
        id: "c7",
        title: "Casilla 7 – Dolencias y riesgos recientes",
        feedforward:
          "Queremos identificar qué situaciones recientes han generado presión en su operación, para encontrar juntos cómo evitar que se repitan.",
        preguntas: [
          "¿Cuáles situaciones recientes (como interrupciones operativas, sanciones, reprocesos o reclamos) han generado mayores costos o dificultades en su operación?",
          "¿Qué impacto tuvieron esas situaciones en costos, tiempo o imagen de la empresa?",
          "De estas situaciones, ¿cuál sería la prioridad número uno a prevenir?",
        ],
      },
      {
        id: "c8",
        title: "Casilla 8 – Datos y digitalización",
        feedforward:
          "Sabemos que los datos son clave para anticipar mejoras. Queremos entender qué información ya gestionan y cómo podemos ayudarles a aprovecharla mejor.",
        preguntas: [
          "¿Qué sistemas o mediciones utilizan actualmente para controlar agua, energía o residuos (y con qué frecuencia)?",
          "¿De qué manera les gustaría que Veolia los ayude a usar esa información para anticipar problemas o detectar oportunidades de mejora?",
          "¿Estarían abiertos a explorar un piloto/diagnóstico basado en datos para anticipar esas mejoras?",
        ],
      },
    ],
  },
  {
    id: "bloque5",
    title: "Bloque 5: Sostenibilidad y Oportunidades",
    color: "from-emerald-400 to-teal-400",
    casillas: [
      {
        id: "c9",
        title: "Casilla 9 – Agenda de sostenibilidad y circularidad",
        feedforward:
          "Queremos conocer sus metas de sostenibilidad, para ver cómo nuestras soluciones pueden acelerar su cumplimiento.",
        preguntas: [
          "¿Qué metas específicas se han propuesto en agua, residuos o energía para los próximos años, y hacia qué fecha esperan cumplirlas (2027, 2030…)?",
          "¿Qué compromisos de sostenibilidad -como certificaciones, reportes o metas de carbono- son hoy más relevantes para su empresa?",
          "¿En qué aspectos sienten que un aliado como Veolia podría apoyarlos para alcanzar esas metas?",
        ],
      },
      {
        id: "c10",
        title: "Casilla 10 – Oportunidades de valor (triggers)",
        feedforward:
          "Queremos aprovechar su experiencia con Veolia para descubrir nuevas soluciones que generen valor adicional en su operación.",
        preguntas: [
          "¿En qué procesos identifican hoy oportunidades claras de mejora, como reducir costos de agua, valorizar residuos o ganar eficiencia energética?",
          "Si pensaran en mejoras rápidas, ¿qué cambios les gustaría ver resueltos en los próximos 3 a 6 meses?",
        ],
      },
    ],
  },
  {
    id: "bloque6",
    title: "Bloque 6: Promotor y Expansión",
    color: "from-sky-400 to-indigo-400",
    casillas: [
      {
        id: "c11",
        title: "Casilla 11 – Lo que valoran y cómo expandirlo",
        feedforward:
          "Como promotores de Veolia, queremos explorar cómo podemos extender esa experiencia positiva a nuevas áreas de su operación.",
        preguntas: [
          "De su relación actual con Veolia, ¿qué valoran más: el cumplimiento, el soporte, el impacto ambiental u otro aspecto?",
          "Si trasladaran esa experiencia positiva a otra parte de su operación, ¿dónde creen que Veolia podría aportar un valor similar?",
        ],
      },
      {
        id: "c12",
        title: "Casilla 12 – Renovación y plan de expansión",
        feedforward:
          "Queremos definir con ustedes los próximos pasos de la relación: cómo asegurar continuidad con confianza y activar nuevas oportunidades de crecimiento.",
        preguntas: [
          "¿Qué fechas próximas de renovación o decisiones clave tienen en el radar?",
          "¿Qué pasos iniciales podríamos dar desde ya para asegurar que la próxima renovación sea fluida (por ejemplo, un diagnóstico, piloto o propuesta conjunta)?",
          "¿Qué condiciones serían críticas para que ustedes decidieran no renovar?",
          "De todo lo conversado, ¿qué oportunidad les entusiasmaría más comenzar de inmediato, sabiendo que podría dar resultados visibles en menos de 6 meses?",
        ],
      },
    ],
  },
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

  // 🔐 Sesión única: primero intenta URL (query o hash). Si no hay, un sid POR PESTAÑA.
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
    url.searchParams.set("sid", sid); // query
    const hash = new URLSearchParams(url.hash.replace(/^#/, ""));
    hash.set("sid", sid); // hash (respaldo)
    url.hash = hash.toString();
    window.history.replaceState({}, "", url);
  }

  const [sessionId] = useState<string>(() => {
    // 1) Si viene en el enlace, úsalo (sesión compartida)
    const fromUrl = getSidFromLocation();
    if (fromUrl) {
      ensureSidInUrl(fromUrl);
      return fromUrl;
    }
    // 2) Si no, crea un sid por pestaña (NO se comparte con otras pestañas)
    let sid = sessionStorage.getItem("veolia_tab_sid");
    if (!sid) {
      sid = crypto?.randomUUID?.() || String(Date.now());
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

  useEffect(() => {
    localStorage.setItem(
      `veolia_canvas_answers_${sessionId}`,
      JSON.stringify(answers)
    );
  }, [answers, sessionId]);

  const handleChange = (casillaId: string, qIdx: number, value: string) => {
    setAnswers((prev: AnswerMap) => ({
      ...prev,
      [casillaId]: { ...(prev[casillaId] || {}), [qIdx]: value },
    }));
  };

  const filteredBlocks = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return BLOCKS;
    return BLOCKS.map((b) => ({
      ...b,
      casillas: b.casillas.filter((c) => {
        const inTitle = c.title.toLowerCase().includes(q);
        const inFeed = c.feedforward.toLowerCase().includes(q);
        const inQs = c.preguntas.some((p) => p.toLowerCase().includes(q));
        return inTitle || inFeed || inQs;
      }),
    })).filter((b) => b.casillas.length);
  }, [query]);

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

        // JSON
        if (lowerName.endsWith(".json")) {
          const data = JSON.parse(raw);
          if (data && data.answers && typeof data.answers === "object") {
            setAnswers(data.answers as AnswerMap);
            return;
          }
          throw new Error("JSON inválido");
        }

        // TXT
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

  const resetAll = () => {
    if (confirm("¿Borrar todas las respuestas del canvas?")) {
      setAnswers({});
      localStorage.removeItem(`veolia_canvas_answers_${sessionId}`);
    }
  };

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

            {/* Reset */}
            <button
              onClick={resetAll}
              className="inline-flex items-center gap-2 rounded-xl bg-white/5 text-[var(--text)] px-3 py-2 hover:bg-white/10 border border-white/10"
              title="Borrar todas las respuestas"
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
