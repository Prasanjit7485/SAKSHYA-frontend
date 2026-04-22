import { COLORS } from "../theme";

export const Badge = ({ children, color = COLORS.accent }) => (
  <span style={{
    display: "inline-flex", alignItems: "center", gap: 4,
    padding: "3px 10px", borderRadius: 20,
    fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase",
    background: `${color}22`, color, border: `1px solid ${color}44`,
  }}>
    {children}
  </span>
);

export const Card = ({ children, style = {}, glow }) => (
  <div style={{
    background: COLORS.card,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 12,
    padding: 20,
    boxShadow: glow ? `0 0 24px ${glow}` : "0 2px 12px #0006",
    ...style,
  }}>
    {children}
  </div>
);

export const SectionTitle = ({ icon, title }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
    <span style={{ fontSize: 16 }}>{icon}</span>
    <h3 style={{
      margin: 0, fontSize: 13, fontWeight: 700,
      color: COLORS.textSecondary,
      textTransform: "uppercase", letterSpacing: "0.1em",
    }}>
      {title}
    </h3>
  </div>
);

export const Stat = ({ label, value, color = COLORS.textPrimary }) => (
  <div style={{ textAlign: "center" }}>
    <div style={{ fontSize: 26, fontWeight: 800, color, fontFamily: "'Playfair Display', serif" }}>
      {value}
    </div>
    <div style={{ fontSize: 11, color: COLORS.textSecondary, marginTop: 2, textTransform: "uppercase", letterSpacing: "0.05em" }}>
      {label}
    </div>
  </div>
);