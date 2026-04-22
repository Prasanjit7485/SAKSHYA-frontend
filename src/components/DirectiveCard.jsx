import { COLORS, PRIORITY_COLORS, CATEGORY_COLORS } from "../theme";
import { Badge } from "./UI";

export default function DirectiveCard({ d, index }) {
  return (
    <div style={{
      background: COLORS.surface,
      border: `1px solid ${COLORS.border}`,
      borderLeft: `3px solid ${PRIORITY_COLORS[d.priority] || COLORS.textMuted}`,
      borderRadius: 10, padding: "14px 16px", marginBottom: 10,
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <div style={{
          minWidth: 24, height: 24, borderRadius: "50%",
          background: `${PRIORITY_COLORS[d.priority]}22`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 11, fontWeight: 800, color: PRIORITY_COLORS[d.priority],
        }}>
          {index}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
            <Badge color={PRIORITY_COLORS[d.priority]}>{d.priority}</Badge>
            <Badge color={CATEGORY_COLORS[d.category] || COLORS.textMuted}>{d.category}</Badge>
          </div>
          <p style={{ margin: 0, fontSize: 13.5, color: COLORS.textPrimary, lineHeight: 1.6 }}>
            {d.directive}
          </p>
          <div style={{ marginTop: 8, display: "flex", gap: 16, flexWrap: "wrap" }}>
            {d.deadline && (
              <span style={{ fontSize: 11, color: COLORS.warn }}>
                ⏰ Deadline: <strong>{d.deadline}</strong>
              </span>
            )}
            {d.authority && (
              <span style={{ fontSize: 11, color: COLORS.textSecondary }}>
                🏛️ {d.authority}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}