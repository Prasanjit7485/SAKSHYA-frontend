import { useState } from "react";
import { COLORS, PRIORITY_COLORS } from "../theme";
import { Badge, Card, SectionTitle, Stat } from "./UI";
import DirectiveCard from "./DirectiveCard";

const OutcomeBadge = ({ outcome }) => {
  const map = {
    allowed: { label: "✅ Allowed", color: "#1db954" },
    dismissed: { label: "❌ Dismissed", color: "#e03e3e" },
    partly_allowed: { label: "⚖️ Partly Allowed", color: "#f59e0b" },
    disposed: { label: "📋 Disposed", color: "#1a6bff" },
    unknown: { label: "❓ Unknown", color: "#4a5a72" },
  };
  const o = map[outcome] || map.unknown;
  return <Badge color={o.color}>{o.label}</Badge>;
};

const AppealBadge = ({ rec }) => {
  const map = {
    comply: { label: "✅ Comply", color: "#1db954" },
    appeal: { label: "⚠️ Consider Appeal", color: "#e03e3e" },
    review: { label: "🔍 Review Required", color: "#f59e0b" },
    unclear: { label: "❓ Unclear", color: "#4a5a72" },
  };
  const r = map[rec] || map.unclear;
  return <Badge color={r.color}>{r.label}</Badge>;
};

const RiskFlag = ({ flag, severity }) => {
  const map = {
    high: { c: "#e03e3e", i: "🔴" },
    medium: { c: "#f59e0b", i: "🟡" },
    low: { c: "#1db954", i: "🟢" },
  };
  const s = map[severity] || map.medium;
  return (
    <div style={{
      display: "flex", gap: 8, alignItems: "flex-start",
      padding: "8px 12px", background: `${s.c}0d`,
      borderRadius: 8, marginBottom: 6, border: `1px solid ${s.c}33`,
    }}>
      <span>{s.i}</span>
      <span style={{ fontSize: 13, color: COLORS.textPrimary }}>{flag}</span>
    </div>
  );
};

export default function ResultsPanel({ data, fileName }) {
  const [tab, setTab] = useState("overview");

  const tabs = [
    { id: "overview", label: "Overview", icon: "📊" },
    { id: "directives", label: `Directives (${data.keyDirectives?.length || 0})`, icon: "📋" },
    { id: "risks", label: `Risk Flags (${data.riskFlags?.length || 0})`, icon: "⚠️" },
    { id: "details", label: "Details", icon: "🔍" },
  ];

  const critical = data.keyDirectives?.filter((d) => d.priority === "critical").length || 0;
  const high = data.keyDirectives?.filter((d) => d.priority === "high").length || 0;

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: "#1a6bff22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>⚖️</div>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, color: COLORS.textPrimary, fontFamily: "'Playfair Display', serif" }}>
              {data.caseTitle || "Judgment Analysis"}
            </h2>
            <div style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 2 }}>{fileName}</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <OutcomeBadge outcome={data.outcome} />
          <AppealBadge rec={data.appealRecommendation} />
          {data.complianceRequired && <Badge color="#e03e3e">🚨 Compliance Required</Badge>}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 24 }}>
        <Card style={{ padding: "14px 10px" }}><Stat label="Total Directives" value={data.keyDirectives?.length || 0} color="#1a6bff" /></Card>
        <Card style={{ padding: "14px 10px" }}><Stat label="Critical" value={critical} color="#e03e3e" /></Card>
        <Card style={{ padding: "14px 10px" }}><Stat label="High Priority" value={high} color="#f59e0b" /></Card>
        <Card style={{ padding: "14px 10px" }}><Stat label="Risk Flags" value={data.riskFlags?.length || 0} color="#f0a500" /></Card>
      </div>

      <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: `1px solid ${COLORS.border}` }}>
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            background: "none", border: "none", cursor: "pointer",
            padding: "8px 16px", fontSize: 13,
            fontWeight: tab === t.id ? 700 : 400,
            color: tab === t.id ? "#1a6bff" : COLORS.textSecondary,
            borderBottom: `2px solid ${tab === t.id ? "#1a6bff" : "transparent"}`,
            transition: "all 0.15s",
          }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div>
          <Card style={{ marginBottom: 16 }} glow="#1a6bff33">
            <SectionTitle icon="📝" title="Judgment Summary" />
            <p style={{ margin: 0, fontSize: 14, color: COLORS.textPrimary, lineHeight: 1.75 }}>{data.summary}</p>
          </Card>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            <Card>
              <SectionTitle icon="🏛️" title="Case Parties" />
              {[["Petitioner", data.petitioner], ["Respondent", data.respondent]].map(([k, v]) => (
                <div key={k} style={{ marginBottom: 8 }}>
                  <span style={{ color: COLORS.textMuted, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>{k}</span>
                  <div style={{ color: COLORS.textPrimary, fontSize: 13, marginTop: 2 }}>{v || "—"}</div>
                </div>
              ))}
            </Card>
            <Card>
              <SectionTitle icon="📅" title="Key Dates" />
              {data.criticalDates?.length ? data.criticalDates.map((d, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 13 }}>
                  <span style={{ color: COLORS.textSecondary }}>{d.label}</span>
                  <span style={{ color: "#f0a500", fontWeight: 600 }}>{d.date}</span>
                </div>
              )) : <div style={{ color: COLORS.textMuted, fontSize: 13 }}>No specific dates extracted</div>}
            </Card>
          </div>
          <Card glow={data.complianceRequired ? "#e03e3e33" : undefined}>
            <SectionTitle icon="⚖️" title="Administrative Decision Required" />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
              <div>
                <div style={{ color: COLORS.textMuted, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Compliance</div>
                <div style={{ fontSize: 13, color: data.complianceRequired ? "#e03e3e" : "#1db954", fontWeight: 600 }}>
                  {data.complianceRequired ? "🚨 Required" : "✅ Not Required"}
                </div>
                {data.complianceDeadline && <div style={{ fontSize: 11, color: "#f59e0b", marginTop: 2 }}>By: {data.complianceDeadline}</div>}
              </div>
              <div>
                <div style={{ color: COLORS.textMuted, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Responsible Authority</div>
                <div style={{ fontSize: 13, color: COLORS.textPrimary }}>{data.responsibleAuthority || "To be determined"}</div>
              </div>
              <div>
                <div style={{ color: COLORS.textMuted, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Appeal Limitation</div>
                <div style={{ fontSize: 13, color: "#f0a500", fontWeight: 600 }}>{data.limitationPeriod || "Verify independently"}</div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {tab === "directives" && (
        <div>
          {data.keyDirectives?.length ? (
            [...data.keyDirectives]
              .sort((a, b) => {
                const ord = { critical: 0, high: 1, medium: 2, low: 3 };
                return (ord[a.priority] ?? 4) - (ord[b.priority] ?? 4);
              })
              .map((d, i) => <DirectiveCard key={d.id || i} d={d} index={i + 1} />)
          ) : (
            <div style={{ textAlign: "center", color: COLORS.textMuted, padding: 40 }}>No directives extracted</div>
          )}
        </div>
      )}

      {tab === "risks" && (
        <div>
          {data.riskFlags?.length ? data.riskFlags.map((r, i) => (
            <RiskFlag key={i} {...r} />
          )) : (
            <div style={{ textAlign: "center", color: COLORS.textMuted, padding: 40 }}>✅ No significant risk flags identified</div>
          )}
        </div>
      )}

      {tab === "details" && (
        <div>
          <Card style={{ marginBottom: 16 }}>
            <SectionTitle icon="🏛️" title="Court Details" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, fontSize: 13 }}>
              {[["Court", data.court], ["Date", data.judgmentDate], ["Bench", data.bench]].map(([k, v]) => (
                <div key={k}>
                  <span style={{ color: COLORS.textMuted, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>{k}</span>
                  <div style={{ color: COLORS.textPrimary, marginTop: 2 }}>{v || "—"}</div>
                </div>
              ))}
            </div>
          </Card>
          {data.legalProvisions?.length > 0 && (
            <Card>
              <SectionTitle icon="📜" title="Legal Provisions Cited" />
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {data.legalProvisions.map((p, i) => (
                  <Badge key={i} color="#1a6bff">{p}</Badge>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}