import { useState } from "react";
import { analyzeJudgment } from "./api";
import { COLORS } from "./theme";
import { Badge } from "./components/UI";
import UploadZone from "./components/UploadZone";
import ResultsPanel from "./components/ResultsPanel";

export default function App() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState("");

  const handleFile = async (f) => {
    setFile(f);
    setLoading(true);
    setResult(null);
    setError(null);
    setProgress("Reading PDF...");
    try {
      setProgress("Sending to server for AI analysis...");
      const data = await analyzeJudgment(f);
      setResult(data);
    } catch (err) {
      setError(err.message || "Failed to analyze judgment");
    } finally {
      setLoading(false);
      setProgress("");
    }
  };

  const reset = () => { setResult(null); setFile(null); setError(null); };

  return (
    <div style={{ minHeight: "100vh", background: COLORS.bg, fontFamily: "'DM Sans', sans-serif", color: COLORS.textPrimary }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=DM+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: ${COLORS.bg}; }
        ::-webkit-scrollbar-thumb { background: ${COLORS.border}; border-radius: 3px; }
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); opacity: 0.3; }
          40% { transform: scale(1); opacity: 1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: none; }
        }
        .animate-in { animation: fadeIn 0.4s ease both; }
      `}</style>

      <nav style={{
        background: `${COLORS.surface}ee`, backdropFilter: "blur(12px)",
        borderBottom: `1px solid ${COLORS.border}`,
        position: "sticky", top: 0, zIndex: 100,
        padding: "0 32px", height: 60,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 34, height: 34, borderRadius: 8, background: "linear-gradient(135deg, #1a6bff, #0044cc)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>⚖️</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 14, color: COLORS.textPrimary, letterSpacing: "-0.02em" }}>CCMS</div>
            <div style={{ fontSize: 10, color: COLORS.textMuted, marginTop: -2, letterSpacing: "0.04em" }}>JUDGMENT INTELLIGENCE</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Badge color={COLORS.success}>● System Active</Badge>
          <Badge color={COLORS.accent}>High Court Integration</Badge>
        </div>
      </nav>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px" }}>
        {!result && (
          <div style={{ textAlign: "center", marginBottom: 40, animation: "fadeIn 0.5s ease" }}>
            <div style={{ fontSize: 11, color: COLORS.accent, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 12, fontWeight: 700 }}>
              Centre for e-Governance · Court Case Monitoring System
            </div>
            <h1 style={{
              fontSize: 38, fontWeight: 800, margin: "0 0 12px",
              fontFamily: "'Playfair Display', serif", lineHeight: 1.15,
              background: `linear-gradient(135deg, ${COLORS.textPrimary}, ${COLORS.accent})`,
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>
              Judgment Intelligence<br />Analysis System
            </h1>
            <p style={{ color: COLORS.textSecondary, fontSize: 15, maxWidth: 520, margin: "0 auto 32px", lineHeight: 1.7 }}>
              Upload High Court judgment PDFs to automatically extract critical directives,
              compliance requirements, appeal recommendations, and risk flags.
            </p>
            <div style={{ display: "flex", justifyContent: "center", gap: 8, flexWrap: "wrap", marginBottom: 40 }}>
              {["AI-Powered Extraction", "Compliance Tracking", "Appeal Analysis", "Risk Flags", "Critical Dates"].map((f) => (
                <div key={f} style={{ padding: "6px 14px", borderRadius: 20, background: COLORS.card, border: `1px solid ${COLORS.border}`, fontSize: 12, color: COLORS.textSecondary }}>
                  {f}
                </div>
              ))}
            </div>
          </div>
        )}

        {result && (
          <button onClick={reset} style={{
            background: COLORS.card, border: `1px solid ${COLORS.border}`,
            color: COLORS.textSecondary, padding: "8px 16px", borderRadius: 8,
            cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center",
            gap: 6, marginBottom: 24,
          }}>
            ← Analyze Another Judgment
          </button>
        )}

        {!result && <div className="animate-in"><UploadZone onFile={handleFile} loading={loading} /></div>}

        {loading && progress && (
          <div style={{ textAlign: "center", marginTop: 16, color: COLORS.textSecondary, fontSize: 13 }}>{progress}</div>
        )}

        {error && (
          <div style={{ marginTop: 20, padding: "14px 18px", background: "#e03e3e15", border: "1px solid #e03e3e44", borderRadius: 10, color: "#e03e3e", fontSize: 13 }}>
            ⚠️ {error} — Please check the PDF and try again.
          </div>
        )}

        {result && <div className="animate-in"><ResultsPanel data={result} fileName={file?.name || "judgment.pdf"} /></div>}

        {!result && !loading && (
          <div style={{ marginTop: 24, padding: "12px 18px", background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 10, fontSize: 12, color: COLORS.textMuted, display: "flex", gap: 8 }}>
            <span>ℹ️</span>
            <span>Upload any High Court judgment PDF. The server will securely process it and return a structured analysis.</span>
          </div>
        )}
      </div>
    </div>
  );
}