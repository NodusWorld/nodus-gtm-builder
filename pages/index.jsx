import { useState, useRef } from "react";

// ── Nodus brand colours extracted from logo ──
const N = {
  white:    "#FFFFFF",
  offWhite: "#F7F9F7",
  green:    "#7CC47A",   // logo green
  greenDark:"#5A9E58",   // darker shade for hover / accents
  greenMid: "#A8D9A6",   // lighter tint
  navy:     "#2D3142",   // logo text colour
  navyLight:"#4A5068",
  slate:    "#6B7280",
  mist:     "#EBF4EB",   // very light green tint
  sand:     "#E5EAE5",
};

// ── Nodus SVG logo mark ──
function NodusLogo({ size = 32 }) {
  // Simplified node-graph mark matching the logo
  return (
    <svg width={size * 2.2} height={size} viewBox="0 0 88 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Connecting lines */}
      <line x1="10" y1="26" x2="26" y2="18" stroke={N.green} strokeWidth="2.2" strokeLinecap="round"/>
      <line x1="26" y1="18" x2="44" y2="22" stroke={N.green} strokeWidth="2.2" strokeLinecap="round"/>
      <line x1="44" y1="22" x2="58" y2="12" stroke={N.green} strokeWidth="2.2" strokeLinecap="round"/>
      <line x1="58" y1="12" x2="70" y2="18" stroke={N.green} strokeWidth="2.2" strokeLinecap="round"/>
      <line x1="70" y1="18" x2="82" y2="14" stroke={N.green} strokeWidth="2.2" strokeLinecap="round"/>
      {/* Nodes */}
      <circle cx="10"  cy="26" r="5.5" fill={N.green} opacity="0.85"/>
      <circle cx="26"  cy="18" r="7"   fill={N.green}/>
      <circle cx="44"  cy="22" r="8"   fill={N.green}/>
      <circle cx="58"  cy="12" r="9"   fill={N.green}/>
      <circle cx="70"  cy="18" r="6"   fill={N.green} opacity="0.9"/>
      <circle cx="82"  cy="14" r="5"   fill={N.green} opacity="0.8"/>
    </svg>
  );
}

const contextFields = [
  { key: "company",  label: "Company name",                      placeholder: "e.g. Acme Inc.",                                          type: "input" },
  { key: "product",  label: "What does your product do?",        placeholder: "e.g. We help revenue ops teams automate reporting…",      type: "textarea" },
  { key: "stage",    label: "Funding / company stage",           placeholder: "e.g. Series A, bootstrapped, pre-seed…",                  type: "input" },
  { key: "market",   label: "Primary market(s)",                 placeholder: "e.g. US & UK, ANZ, Global…",                             type: "input" },
  { key: "deal",     label: "Average deal size (ACV)",           placeholder: "e.g. $24k, £8k…",                                        type: "input" },
  { key: "struggle", label: "Biggest GTM challenge right now",   placeholder: "e.g. Pipeline is too thin, not converting trials…",       type: "textarea" },
];

const STAGE_IDS    = ["context","positioning","demand","sales","onboarding","gate","results"];
const STAGE_LABELS = { positioning:"Positioning & ICP", demand:"Demand & Outbound", sales:"Sales Enablement", onboarding:"Onboarding & Expansion" };
const STAGE_ICONS  = { positioning:"◈", demand:"◉", sales:"◐", onboarding:"◑" };
const STAGE_ACCENTS = [N.green, N.greenDark, N.navyLight, N.slate];

const PROGRESS_STAGES = [
  { id:"context",     label:"Your Business",          icon:"◎" },
  { id:"positioning", label:"Positioning & ICP",      icon:"◈" },
  { id:"demand",      label:"Demand & Outbound",       icon:"◉" },
  { id:"sales",       label:"Sales Enablement",        icon:"◐" },
  { id:"onboarding",  label:"Onboarding & Expansion",  icon:"◑" },
];

// ── Parse ALL-CAPS headings out of Claude output ──
function parseSections(text) {
  if (!text) return [];
  const sections = [];
  let title = "", body = [];
  for (const line of text.split("\n")) {
    const t = line.trim();
    const isHead = t.length > 3 && t.length < 90
      && t === t.toUpperCase()
      && /^[A-Z]/.test(t)
      && !/[.!?,]$/.test(t)
      && !/^\d/.test(t);
    if (isHead) {
      if (title) sections.push({ title, body: body.join("\n").trim() });
      title = t; body = [];
    } else {
      body.push(line);
    }
  }
  if (title) sections.push({ title, body: body.join("\n").trim() });
  return sections.length ? sections : [{ title: "Your Output", body: text.trim() }];
}

// ── Claude API call ──
async function callClaude(system, user) {
  const res = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ system, prompt: user }),
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  const data = await res.json();
  if (!data.result) throw new Error("Empty response");
  return data.result;
}
// ── Sub-components ──

function OutputCard({ title, body, accent, delay = 0 }) {
  return (
    <div style={{
      background: N.white,
      border: `1.5px solid ${accent}33`,
      borderLeft: `4px solid ${accent}`,
      borderRadius: 14,
      padding: "22px 26px",
      marginBottom: 18,
      boxShadow: "0 2px 12px rgba(45,49,66,0.06)",
      animation: `fadeUp 0.5s ease ${delay}ms both`,
    }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.13em", color: accent, marginBottom: 10, fontFamily: "monospace", textTransform: "uppercase" }}>{title}</div>
      <div style={{ fontSize: 14.5, lineHeight: 1.8, color: N.navy, fontFamily: "'Georgia', serif", whiteSpace: "pre-wrap" }}>{body}</div>
    </div>
  );
}

function Spinner({ label }) {
  return (
    <div style={{ textAlign: "center", padding: "56px 24px" }}>
      <div style={{ display: "flex", justifyContent: "center", gap: 9, marginBottom: 22 }}>
        {[0,1,2].map(i => (
          <div key={i} style={{
            width: 11, height: 11, borderRadius: "50%", background: N.green,
            animation: `bounce 1.1s ease-in-out ${i*0.18}s infinite`,
          }}/>
        ))}
      </div>
      <div style={{ fontSize: 14, color: N.slate, fontFamily: "system-ui, sans-serif" }}>{label}</div>
    </div>
  );
}

function ProgressBar({ stageIndex }) {
  const pct = Math.round((stageIndex / 4) * 100);
  return (
    <div style={{ marginBottom: 36 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, flexWrap: "wrap", gap: 4 }}>
        {PROGRESS_STAGES.map((s, i) => (
          <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 5, opacity: i <= stageIndex ? 1 : 0.3, transition: "opacity 0.4s" }}>
            <span style={{ fontSize: 13, color: i === stageIndex ? N.green : N.slate }}>{s.icon}</span>
            <span style={{ fontSize: 10.5, fontFamily: "monospace", letterSpacing: "0.05em", color: i === stageIndex ? N.navy : N.slate, display: typeof window !== "undefined" && window.innerWidth < 560 ? "none" : "block" }}>{s.label}</span>
          </div>
        ))}
      </div>
      <div style={{ height: 3, background: N.mist, borderRadius: 4 }}>
        <div style={{ height: "100%", width: `${pct}%`, background: N.green, borderRadius: 4, transition: "width 0.7s ease" }}/>
      </div>
    </div>
  );
}

function SectionHeader({ eyebrow, title, sub }) {
  return (
    <div style={{ marginBottom: 30 }}>
      {eyebrow && <div style={{ fontSize: 11, fontFamily: "monospace", letterSpacing: "0.14em", color: N.green, marginBottom: 10, textTransform: "uppercase" }}>{eyebrow}</div>}
      <h2 style={{ fontSize: 26, fontWeight: 700, color: N.navy, lineHeight: 1.3, marginBottom: sub ? 10 : 0, fontFamily: "system-ui, sans-serif" }}>{title}</h2>
      {sub && <p style={{ fontSize: 14, color: N.slate, lineHeight: 1.65 }}>{sub}</p>}
    </div>
  );
}

// ── Main component ──
export default function GTMReadinessBuilder() {
  const [stageIndex, setStageIndex]       = useState(0);
  const [ctx, setCtx]                     = useState({});
  const [outputs, setOutputs]             = useState({});
  const [loading, setLoading]             = useState(false);
  const [loadMsg, setLoadMsg]             = useState("");
  const [error, setError]                 = useState(null);
  const [leadName, setLeadName]           = useState("");
  const [leadEmail, setLeadEmail]         = useState("");
  const [leadPhone, setLeadPhone]         = useState("");
  const [gateErr, setGateErr]             = useState(null);
  const [gateLoading, setGateLoading]     = useState(false);

  const topRef = useRef(null);
  const scrollTop = () => topRef.current?.scrollIntoView({ behavior: "smooth" });
  const currentId = STAGE_IDS[stageIndex];

  const system = `You are a senior B2B SaaS GTM strategist with deep experience across UK, US, ANZ and Gulf markets. Give specific, actionable, commercially sharp advice. Never be generic — always tailor to the company's stage, market, and product. Format: use ALL CAPS for section headings only (no markdown ** or ## symbols). Write in plain paragraphs beneath each heading.`;

  const ctxString = () =>
    `Company: ${ctx.company}. Product: ${ctx.product}. Stage: ${ctx.stage}. Markets: ${ctx.market}. ACV: ${ctx.deal}. Challenge: ${ctx.struggle}.`;

  const PROMPTS = {
    positioning: () => `${ctxString()}

Generate two outputs:

ICP DEFINITION
Write a sharp 3-paragraph ideal customer profile. Cover: the type of company (size, stage, industry), the specific person who buys (title, pains, motivations), and the trigger events that make them ready to buy right now.

POSITIONING STATEMENT
Write a crisp positioning statement: "For [ICP], [Company] is the [category] that [key benefit] — unlike [alternative], which [limitation]." Then write 2-3 sentences on why this positioning will land in their market right now.`,

    demand: () => `${ctxString()}

Generate two outputs:

CHANNEL PRIORITY STACK
Recommend the top 3 channels to drive pipeline, ranked by priority. For each: why it fits their stage and market, and one tactical starting move.

OUTBOUND SEQUENCE
Write a 3-touch cold email sequence for their ICP. Touch 1: pattern interrupt. Touch 2: value + social proof. Touch 3: easy ask. Each under 80 words. Label each touch clearly.`,

    sales: () => `${ctxString()}

Generate two outputs:

OBJECTION HANDLING FRAMEWORK
List the 4 most likely objections in sales conversations. For each: a sharp 2-sentence response that acknowledges and redirects.

DEAL STAGE CRITERIA
Define 5 deal stages with clear entry criteria and one key action to progress to the next stage.`,

    onboarding: () => `${ctxString()}

Generate two outputs:

SUCCESS MILESTONE MAP
Define 5 key milestones from Day 1 through Month 6. For each: the outcome that signals success and who owns it (customer vs vendor).

EXPANSION TRIGGER LOGIC
Define 3 signals that should trigger an expansion conversation. For each: the ideal expansion motion and the opening line a CSM should use.`,
  };

  const LOAD_MSGS = {
    positioning: "Defining your ICP and positioning…",
    demand:      "Mapping your channels and outbound strategy…",
    sales:       "Building your sales playbook…",
    onboarding:  "Designing your onboarding and expansion model…",
  };

  const generate = async (stageId) => {
    setLoading(true);
    setError(null);
    setLoadMsg(LOAD_MSGS[stageId] || "Thinking…");
    try {
      const result = await callClaude(system, PROMPTS[stageId]());
      setOutputs(prev => ({ ...prev, [stageId]: result }));
    } catch (e) {
      console.error(e);
      setError(`Something went wrong: ${e.message}. Please try again.`);
    }
    setLoading(false);
  };

  const handleContextSubmit = async () => {
    const missing = ["company","product","stage","market","deal","struggle"].filter(k => !ctx[k]?.trim());
    if (missing.length) { setError("Please fill in all fields before continuing."); return; }
    setError(null);
    setStageIndex(1);
    scrollTop();
    await generate("positioning");
  };

  const handleNext = async () => {
    const next = stageIndex + 1;
    setStageIndex(next);
    scrollTop();
    const nextId = STAGE_IDS[next];
    if (PROMPTS[nextId]) await generate(nextId);
  };

  const handleGate = () => {
    if (!leadName.trim() || !leadEmail.trim() || !leadPhone.trim()) {
      setGateErr("Please fill in all three fields."); return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(leadEmail)) {
      setGateErr("Please enter a valid email address."); return;
    }
    setGateErr(null);
    setGateLoading(true);
    // ── Send lead to Make → Airtable ──
    try {
      fetch("https://hook.eu1.make.com/gfgfe74tbrtt8aqkg2548654ejgoh8k9", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: leadName,
          email: leadEmail,
          phone: leadPhone,
          company: ctx.company,
          companyStage: ctx.stage,
          market: ctx.market,
          acv: ctx.deal,
        })
      });
    } catch(e) {
      console.error("Webhook error:", e);
    }
    setTimeout(() => { setGateLoading(false); setStageIndex(6); scrollTop(); }, 900);
  };

  // ── Shared styles ──
  const inputStyle = {
    width: "100%", padding: "13px 15px",
    border: `1.5px solid ${N.sand}`, borderRadius: 10,
    fontSize: 14, background: N.white, color: N.navy,
    fontFamily: "system-ui, sans-serif", outline: "none",
    transition: "border-color 0.2s",
  };
  const btnGreen = (disabled) => ({
    width: "100%", padding: "15px 28px",
    background: disabled ? N.slate : N.green, color: N.white,
    border: "none", borderRadius: 10, fontSize: 15, fontWeight: 600,
    cursor: disabled ? "not-allowed" : "pointer",
    fontFamily: "system-ui, sans-serif", transition: "all 0.2s",
    letterSpacing: "0.01em",
  });
  const btnNavy = {
    width: "100%", padding: "15px 28px",
    background: N.navy, color: N.white,
    border: "none", borderRadius: 10, fontSize: 15, fontWeight: 600,
    cursor: "pointer", fontFamily: "system-ui, sans-serif",
    transition: "opacity 0.2s",
  };

  return (
    <div ref={topRef} style={{ minHeight: "100vh", background: N.offWhite, fontFamily: "system-ui, sans-serif", paddingBottom: 80 }}>
      <style>{`
        @keyframes fadeUp   { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes bounce   { 0%,100%{transform:translateY(0);opacity:0.5} 50%{transform:translateY(-6px);opacity:1} }
        * { box-sizing: border-box; }
        input:focus, textarea:focus { border-color: ${N.green} !important; box-shadow: 0 0 0 3px ${N.green}22; }
        ::placeholder { color: #B0B8B0; }
        textarea { resize: vertical; }
        button:hover { opacity: 0.88; }
        a:hover { opacity: 0.85; }
      `}</style>

      {/* ── Header ── */}
      <div style={{
        borderBottom: `1px solid ${N.sand}`, padding: "16px 28px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: N.white, position: "sticky", top: 0, zIndex: 20,
        boxShadow: "0 1px 8px rgba(45,49,66,0.06)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <NodusLogo size={28} />
          <div style={{ width: 1, height: 28, background: N.sand }}/>
          <span style={{ fontSize: 14.5, fontWeight: 600, color: N.navy, letterSpacing: "-0.01em" }}>GTM Readiness Builder</span>
        </div>
        <div style={{ fontSize: 11.5, color: N.slate, fontFamily: "monospace", letterSpacing: "0.06em" }}>
          {stageIndex === 0 && "START"}
          {stageIndex >= 1 && stageIndex <= 4 && `STAGE ${stageIndex} / 4`}
          {stageIndex === 5 && "ALMOST THERE"}
          {stageIndex === 6 && "COMPLETE ✦"}
        </div>
      </div>

      <div style={{ maxWidth: 700, margin: "0 auto", padding: "44px 22px" }}>

        {stageIndex >= 1 && stageIndex <= 4 && <ProgressBar stageIndex={stageIndex} />}

        {/* ════ STAGE 0 — Context ════ */}
        {stageIndex === 0 && (
          <div style={{ animation: "fadeUp 0.5s ease" }}>
            <div style={{ marginBottom: 36 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: N.mist, border: `1px solid ${N.green}44`, borderRadius: 20, padding: "6px 14px", marginBottom: 18 }}>
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: N.green }}/>
                <span style={{ fontSize: 11.5, color: N.greenDark, fontFamily: "monospace", letterSpacing: "0.1em", fontWeight: 600 }}>FREE GTM STRATEGY BUILDER</span>
              </div>
              <h1 style={{ fontSize: 30, fontWeight: 700, color: N.navy, lineHeight: 1.25, marginBottom: 14 }}>
                Build your complete B2B GTM strategy in minutes.
              </h1>
              <p style={{ fontSize: 15, color: N.slate, lineHeight: 1.7, maxWidth: 560 }}>
                Answer six questions and Nodus will generate your ICP, demand strategy, sales playbook, and onboarding model — tailored to your company right now. Free. No fluff.
              </p>
            </div>

            <div style={{ background: N.white, border: `1px solid ${N.sand}`, borderRadius: 16, padding: "30px 28px", boxShadow: "0 2px 16px rgba(45,49,66,0.05)" }}>
              {contextFields.map(f => (
                <div key={f.key} style={{ marginBottom: 20 }}>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: N.navy, marginBottom: 7 }}>{f.label}</label>
                  {f.type === "textarea"
                    ? <textarea rows={3} placeholder={f.placeholder} value={ctx[f.key] || ""} onChange={e => setCtx(p => ({ ...p, [f.key]: e.target.value }))} style={{ ...inputStyle, lineHeight: 1.6 }} />
                    : <input type="text" placeholder={f.placeholder} value={ctx[f.key] || ""} onChange={e => setCtx(p => ({ ...p, [f.key]: e.target.value }))} style={inputStyle} />
                  }
                </div>
              ))}
              {error && <div style={{ color: "#C0392B", fontSize: 13, marginBottom: 14 }}>{error}</div>}
              <button onClick={handleContextSubmit} style={btnGreen(false)}>
                Build my GTM strategy →
              </button>
            </div>

            <p style={{ textAlign: "center", fontSize: 12, color: N.slate, marginTop: 20, lineHeight: 1.6 }}>
              Powered by Nodus · withnodus.com
            </p>
          </div>
        )}

        {/* ════ STAGES 1–4 — AI content ════ */}
        {stageIndex >= 1 && stageIndex <= 4 && (
          <div style={{ animation: "fadeUp 0.45s ease" }}>
            <SectionHeader
              eyebrow={`${STAGE_ICONS[currentId]}  Stage ${stageIndex} of 4`}
              title={STAGE_LABELS[currentId]}
              sub={ctx.company ? `Tailored for ${ctx.company}.` : undefined}
            />

            {loading
              ? <Spinner label={loadMsg} />
              : error
                ? (
                  <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 12, padding: "18px 22px", marginBottom: 24 }}>
                    <div style={{ fontSize: 13, color: "#B91C1C" }}>{error}</div>
                    <button onClick={() => generate(currentId)} style={{ marginTop: 12, background: N.navy, color: N.white, border: "none", borderRadius: 8, padding: "10px 20px", fontSize: 13, cursor: "pointer" }}>
                      Try again
                    </button>
                  </div>
                )
                : outputs[currentId]
                  ? (
                    <>
                      {parseSections(outputs[currentId]).map((s, i) => (
                        <OutputCard key={i} title={s.title} body={s.body} accent={STAGE_ACCENTS[i % STAGE_ACCENTS.length]} delay={i * 80} />
                      ))}
                      <div style={{ height: 12 }}/>
                      <button onClick={handleNext} style={btnNavy}>
                        {stageIndex < 4
                          ? `Continue to ${STAGE_LABELS[STAGE_IDS[stageIndex + 1]]} →`
                          : "Unlock my full GTM Snapshot →"}
                      </button>
                    </>
                  )
                  : null
            }
          </div>
        )}

        {/* ════ STAGE 5 — Lead gate ════ */}
        {stageIndex === 5 && (
          <div style={{ animation: "fadeUp 0.45s ease" }}>
            {/* Blurred results preview */}
            <div style={{ position: "relative", marginBottom: 32, borderRadius: 14, overflow: "hidden" }}>
              <div style={{ filter: "blur(4px)", opacity: 0.5, background: N.white, padding: "24px 26px", border: `1px solid ${N.sand}`, pointerEvents: "none", userSelect: "none", height: 190, overflow: "hidden" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: N.green, letterSpacing: "0.12em", fontFamily: "monospace", marginBottom: 10 }}>ICP DEFINITION</div>
                <div style={{ fontSize: 14, lineHeight: 1.8, color: N.navy, fontFamily: "'Georgia', serif" }}>
                  Your complete GTM strategy is ready — including your ICP definition, positioning statement, channel priority stack, 3-touch email sequences, objection handling framework, deal stage criteria, customer success milestones, and expansion trigger logic — all built specifically for {ctx.company || "your business"}.
                </div>
              </div>
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(247,249,247,0.05) 0%, rgba(247,249,247,0.92) 70%)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", paddingBottom: 24 }}>
                <div style={{ background: N.mist, border: `1.5px solid ${N.green}55`, borderRadius: 20, padding: "8px 18px", display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 7, height: 7, borderRadius: "50%", background: N.green }}/>
                  <span style={{ fontSize: 12, color: N.greenDark, fontFamily: "monospace", letterSpacing: "0.1em", fontWeight: 600 }}>YOUR RESULTS ARE READY</span>
                </div>
              </div>
            </div>

            {/* Gate card */}
            <div style={{ background: N.white, border: `1.5px solid ${N.sand}`, borderRadius: 18, padding: "34px 30px", boxShadow: "0 4px 24px rgba(45,49,66,0.07)" }}>
              <div style={{ fontSize: 11, fontFamily: "monospace", letterSpacing: "0.13em", color: N.green, marginBottom: 12, textTransform: "uppercase" }}>One last step</div>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: N.navy, marginBottom: 10, lineHeight: 1.3 }}>
                Where should we send your GTM Snapshot?
              </h2>
              <p style={{ fontSize: 14, color: N.slate, lineHeight: 1.7, marginBottom: 26 }}>
                Your full strategy is ready to unlock. Enter your details below — Bianca from Nodus will follow up personally with a note on your results.
              </p>

              {[
                { label: "Your name",    placeholder: "e.g. Alex Johnson",        val: leadName,  set: setLeadName,  type: "text"  },
                { label: "Work email",   placeholder: "e.g. alex@company.com",    val: leadEmail, set: setLeadEmail, type: "email" },
                { label: "Phone number", placeholder: "e.g. +44 7700 900000",     val: leadPhone, set: setLeadPhone, type: "tel"   },
              ].map((f, i) => (
                <div key={i} style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: N.navy, marginBottom: 7 }}>{f.label}</label>
                  <input type={f.type} placeholder={f.placeholder} value={f.val} onChange={e => f.set(e.target.value)} style={inputStyle} />
                </div>
              ))}

              {gateErr && <div style={{ color: "#B91C1C", fontSize: 13, marginBottom: 14 }}>{gateErr}</div>}

              <button onClick={handleGate} disabled={gateLoading} style={btnGreen(gateLoading)}>
                {gateLoading ? "Unlocking…" : "Unlock my GTM Snapshot →"}
              </button>
              <p style={{ fontSize: 11.5, color: N.slate, textAlign: "center", marginTop: 14, lineHeight: 1.55 }}>
                No spam. One follow-up from Bianca at Nodus — that's it.
              </p>
            </div>
          </div>
        )}

        {/* ════ STAGE 6 — Full results ════ */}
        {stageIndex === 6 && (
          <div style={{ animation: "fadeUp 0.45s ease" }}>
            {/* Hero */}
            <div style={{ textAlign: "center", marginBottom: 44 }}>
              <NodusLogo size={36} />
              <h2 style={{ fontSize: 26, fontWeight: 700, color: N.navy, marginTop: 18, marginBottom: 10 }}>
                Your GTM Snapshot
              </h2>
              <p style={{ fontSize: 15, color: N.slate, lineHeight: 1.7, maxWidth: 480, margin: "0 auto" }}>
                Everything we built for <strong style={{ color: N.navy }}>{ctx.company || "your company"}</strong> — ready to put to work.
              </p>
            </div>

            {[
              { id:"positioning", label:"Positioning & ICP",       icon:"◈", accent: N.green     },
              { id:"demand",      label:"Demand & Outbound",        icon:"◉", accent: N.greenDark },
              { id:"sales",       label:"Sales Enablement",         icon:"◐", accent: N.navyLight },
              { id:"onboarding",  label:"Onboarding & Expansion",   icon:"◑", accent: N.slate     },
            ].map(s => outputs[s.id] && (
              <div key={s.id} style={{ background: N.white, border: `1px solid ${N.sand}`, borderRadius: 14, marginBottom: 22, overflow: "hidden" }}>
                <div style={{ padding: "14px 22px", background: N.mist, borderBottom: `1px solid ${N.sand}`, display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ color: s.accent, fontSize: 15 }}>{s.icon}</span>
                  <span style={{ fontSize: 11.5, fontFamily: "monospace", letterSpacing: "0.1em", fontWeight: 700, color: N.navy }}>{s.label.toUpperCase()}</span>
                </div>
                <div style={{ padding: "20px 24px", fontSize: 14, lineHeight: 1.8, color: N.navy, fontFamily: "'Georgia', serif", whiteSpace: "pre-wrap" }}>
                  {outputs[s.id]}
                </div>
              </div>
            ))}

            {/* CTA block */}
            <div style={{ marginTop: 14, background: N.navy, borderRadius: 18, padding: "42px 34px", textAlign: "center" }}>
              <div style={{ marginBottom: 16 }}>
                <NodusLogo size={30} />
              </div>
              <div style={{ fontSize: 11, fontFamily: "monospace", letterSpacing: "0.14em", color: N.green, marginBottom: 14, textTransform: "uppercase" }}>What's next</div>
              <h3 style={{ fontSize: 21, fontWeight: 700, color: N.white, marginBottom: 12, lineHeight: 1.4 }}>
                This is your foundation.<br/>Nodus helps you execute it.
              </h3>
              <p style={{ fontSize: 14, color: "#A0A8C0", lineHeight: 1.75, marginBottom: 30, maxWidth: 440, margin: "0 auto 30px" }}>
                The hardest part isn't building the strategy — it's turning it into pipeline, conversations, and revenue across markets.
                {leadName ? ` We'll be in touch soon, ${leadName.split(" ")[0]}.` : " That's exactly what we do."}
              </p>
              <a
                href="https://calendly.com/bianca-withnodus/30min"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-block", background: N.green, color: N.white,
                  textDecoration: "none", borderRadius: 10,
                  padding: "16px 38px", fontSize: 15, fontWeight: 600,
                  fontFamily: "system-ui, sans-serif", letterSpacing: "0.01em",
                }}
              >
                Book a strategy session with Nodus →
              </a>
              <div style={{ marginTop: 22, fontSize: 11.5, color: "#6B7399", fontFamily: "monospace", letterSpacing: "0.06em" }}>
                withnodus.com · bianca@withnodus.com
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
