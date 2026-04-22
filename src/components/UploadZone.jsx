import { useRef, useState, useCallback } from "react";
import { COLORS } from "../theme";

export default function UploadZone({ onFile, loading }) {
  const [drag, setDrag] = useState(false);
  const inputRef = useRef();

  const handle = useCallback((file) => {
    if (file && file.type === "application/pdf") onFile(file);
  }, [onFile]);

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => { e.preventDefault(); setDrag(false); handle(e.dataTransfer.files[0]); }}
      onClick={() => !loading && inputRef.current?.click()}
      style={{
        border: `2px dashed ${drag ? COLORS.accent : COLORS.border}`,
        borderRadius: 16, padding: "52px 32px", textAlign: "center",
        cursor: loading ? "not-allowed" : "pointer",
        background: drag ? `${COLORS.accent}0a` : COLORS.card,
        transition: "all 0.2s", position: "relative", overflow: "hidden",
      }}
    >
      <input
        ref={inputRef} type="file" accept=".pdf"
        style={{ display: "none" }}
        onChange={(e) => handle(e.target.files[0])}
      />
      <div style={{
        position: "absolute", inset: 0, opacity: 0.04,
        backgroundImage: `repeating-linear-gradient(45deg, ${COLORS.accent} 0, ${COLORS.accent} 1px, transparent 0, transparent 50%)`,
        backgroundSize: "20px 20px",
      }} />
      <div style={{ position: "relative" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>{loading ? "⏳" : "📄"}</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: COLORS.textPrimary, marginBottom: 6, fontFamily: "'Playfair Display', serif" }}>
          {loading ? "Analyzing Judgment..." : "Upload Judgment PDF"}
        </div>
        <div style={{ color: COLORS.textSecondary, fontSize: 13 }}>
          {loading ? "AI is extracting directives and action items" : "Drag & drop or click to upload High Court judgment"}
        </div>
        {!loading && (
          <div style={{ marginTop: 20, display: "inline-flex", alignItems: "center", gap: 8, background: COLORS.accent, color: "#fff", padding: "10px 24px", borderRadius: 8, fontSize: 13, fontWeight: 600 }}>
            📂 Browse Files
          </div>
        )}
        {loading && (
          <div style={{ marginTop: 20, display: "flex", justifyContent: "center", gap: 6 }}>
            {[0, 1, 2].map((i) => (
              <div key={i} style={{
                width: 8, height: 8, borderRadius: "50%", background: COLORS.accent,
                animation: `bounce 1.2s ${i * 0.2}s ease-in-out infinite`,
              }} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}