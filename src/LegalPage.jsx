import { useEffect, useRef, useState, useCallback } from "react";

/* ---------------- QUICK QUERIES ---------------- */
const QUICK_QUERIES = [
  "What is Article 21?",
  "Explain FIR in India",
  "What are my fundamental rights?",
  "Cyber crime laws in India",
  "What is bail?",
];

const API_URL =
  import.meta.env.VITE_API_BASE_URL || "https://sakshya-backend.onrender.com";

// ─── Web Speech API helpers ───────────────────────────────────────────────────
const SpeechRecognition =
  typeof window !== "undefined"
    ? window.SpeechRecognition || window.webkitSpeechRecognition
    : null;

// Ensure utterances are not garbage collected
window.__tts_utterances = window.__tts_utterances || [];

function speak(text, lang = "en", onEnd = () => {}) {
  if (!window.speechSynthesis || !text) {
    onEnd();
    return;
  }

  const synth = window.speechSynthesis;
  synth.cancel();
  window.__tts_utterances = []; // clear old references

  // Clean markdown symbols
  const cleanText = text.replace(/[*#_`~]/g, '');

  // Split text into chunks to prevent silent failure on long texts
  const chunks = cleanText.match(/[^.!?\n]+[.!?\n]*/g) || [cleanText];

  const doSpeak = () => {
    const voices = synth.getVoices();

    let selectedVoice;
    if (voices.length > 0) {
      if (lang === "hi") {
        selectedVoice =
          voices.find(v => v.lang === "hi-IN" && v.name.includes("Ananya")) ||
          voices.find(v => v.lang === "hi-IN") ||
          voices.find(v => v.lang.startsWith("hi"));
      } else {
        selectedVoice =
          voices.find(v => v.lang === "en-IN") ||
          voices.find(v => v.lang === "en-US") ||
          voices.find(v => v.lang.startsWith("en"));
      }
    }

    chunks.forEach((chunk, index) => {
      const trimmed = chunk.trim();
      if (!trimmed) {
        if (index === chunks.length - 1) onEnd();
        return;
      }
      const utterance = new SpeechSynthesisUtterance(trimmed);
      utterance.lang  = lang === "hi" ? "hi-IN" : "en-US";
      utterance.rate  = 0.95;
      if (selectedVoice) utterance.voice = selectedVoice;
      
      if (index === chunks.length - 1) {
        utterance.onend = onEnd;
      }
      
      utterance.onerror = (e) => {
        console.warn("TTS error:", e.error);
        if (index === chunks.length - 1) onEnd();
      };
      
      window.__tts_utterances.push(utterance); // Prevent GC
      synth.speak(utterance);
    });
  };

  if (synth.getVoices().length === 0) {
    let hasSpoken = false;
    synth.onvoiceschanged = () => {
      if (hasSpoken) return;
      hasSpoken = true;
      synth.onvoiceschanged = null;
      doSpeak();
    };
    // Failsafe: if event doesn't fire in 500ms, try anyway
    setTimeout(() => {
      if (!hasSpoken) {
        hasSpoken = true;
        doSpeak();
      }
    }, 500);
  } else {
    doSpeak();
  }
}

let speechUnlocked = false;

function unlockSpeech() {
  if (!speechUnlocked && window.speechSynthesis) {
    const u = new SpeechSynthesisUtterance(" ");
    window.speechSynthesis.speak(u);
    speechUnlocked = true;
  }
}

/* ---------------- UI TEXT ---------------- */
const TEXT = {
  en: {
    title: "⚖️ Legal Assistant",
    placeholder: "Ask about Indian law...",
    typing: "Typing...",
    error: "❌ Failed to get a response. Please try again.",
    welcome: "⚖️ Ask me anything about Indian law.",
  },
  hi: {
    title: "⚖️ कानूनी सहायक",
    placeholder: "भारतीय कानून के बारे में पूछें...",
    typing: "टाइप हो रहा है...",
    error: "❌ जवाब पाने में विफल। कृपया पुनः प्रयास करें।",
    welcome: "⚖️ भारतीय कानून के बारे में कुछ भी पूछें।",
  },
};

export default function LegalPage({ C }) {
  const [messages, setMessages] = useState([
    { role: "assistant", content: TEXT["en"].welcome },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [lang, setLang] = useState("en");
  const [ttsStatus, setTtsStatus] = useState("idle");

  const recognizerRef = useRef(null);
  const chatContainerRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: "smooth"
      });
    }
  }, [messages, loading]);

  // Preload voices
  useEffect(() => {
    if (window.speechSynthesis) {
      const load = () => window.speechSynthesis.getVoices();
      load();
      window.speechSynthesis.onvoiceschanged = load;
      return () => { window.speechSynthesis.onvoiceschanged = null; };
    }
  }, []);

  // Update welcome message on lang change if empty chat
  useEffect(() => {
    if (messages.length === 1 && messages[0].role === "assistant") {
      setMessages([{ role: "assistant", content: TEXT[lang].welcome }]);
    }
  }, [lang]);

  // ─── Voice Input ───────────────────────────────────────────────────────────
  const toggleVoiceInput = useCallback(() => {
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in your browser.");
      return;
    }
    if (listening) {
      recognizerRef.current?.stop();
      setListening(false);
      return;
    }

    const recognizer = new SpeechRecognition();
    recognizer.lang            = lang === "hi" ? "hi-IN" : "en-IN";
    recognizer.interimResults  = false;
    recognizer.maxAlternatives = 1;

    recognizer.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setInput(transcript);
      setListening(false);
      setTimeout(() => sendMessage(transcript), 300);
    };
    recognizer.onerror = () => setListening(false);
    recognizer.onend   = () => setListening(false);

    recognizerRef.current = recognizer;
    recognizer.start();
    setListening(true);
  }, [listening, lang]);

  // ─── Send Message ──────────────────────────────────────────────────────────
  const sendMessage = async (customText) => {
    const text = (customText || input).trim();
    if (!text || loading) return;

    unlockSpeech();
    window.speechSynthesis.cancel();
    setTtsStatus("idle");

    const userMsg = { role: "user", content: text };
    const nextMessages = [...messages, userMsg];
    
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const history = nextMessages
        .slice(-10)
        .filter(m => m.role !== "system")
        .map(({ role, content }) => ({ role, content }));

      const res = await fetch(`${API_URL}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          context: { isGeneralLegalQuery: true },
          history: history.slice(0, -1),
          message: lang === "hi"
            ? `Answer in Hindi:\n${text}`
            : `Answer in English:\n${text}`,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Server error");

      const reply = json.reply;
      const botMsg = { role: "assistant", content: reply };
      setMessages((prev) => [...prev, botMsg]);

      // Auto-speak removed, user will click the button to play the message
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: TEXT[lang].error },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const copy = (text) => {
    navigator.clipboard.writeText(text);
  };

  if (!C) return null;

  return (
    <div style={{
      display: "flex", flexDirection: "column", height: 600,
      background: C.surface, color: C.textPrimary,
      fontFamily: "'DM Sans', sans-serif"
    }}>
      
      {/* ── HEADER ── */}
      <div style={{
        padding: "16px 20px",
        background: `linear-gradient(135deg, ${C.accent}18, #8b5cf620)`,
        borderBottom: `1px solid ${C.border}`,
        display: "flex", justifyContent: "space-between", alignItems: "center"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: "50%",
            background: `linear-gradient(135deg, ${C.accent}, #8b5cf6)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18
          }}>⚖️</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 14, color: C.textPrimary }}>{TEXT[lang].title}</div>
            <div style={{ fontSize: 11, color: C.textMuted }}>Powered by CCMS AI</div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          {/* TTS toggle */}
          <button
            onClick={() => {
              if (ttsStatus === "playing") {
                window.speechSynthesis.pause();
                setTtsStatus("paused");
              } else if (ttsStatus === "paused") {
                window.speechSynthesis.resume();
                setTtsStatus("playing");
              } else {
                const lastMsg = [...messages].reverse().find(m => m.role === "assistant");
                if (lastMsg) {
                  setTtsStatus("playing");
                  speak(lastMsg.content, lang, () => setTtsStatus("idle"));
                }
              }
            }}
            title={ttsStatus === "playing" ? "Pause" : ttsStatus === "paused" ? "Resume" : "Play last message"}
            style={{
              background: ttsStatus !== "idle" ? `${C.accent}30` : "transparent",
              border: `1px solid ${ttsStatus !== "idle" ? C.accent : C.border}`,
              borderRadius: 8, padding: "6px 10px", cursor: "pointer",
              color: ttsStatus !== "idle" ? C.accent : C.textMuted, fontSize: 14,
              transition: "all 0.2s"
            }}
          >{ttsStatus === "playing" ? "⏸" : ttsStatus === "paused" ? "▶️" : "🔊"}</button>

          {/* Lang toggle */}
          <button
            onClick={() => { stop(); setLang(lang === "en" ? "hi" : "en"); }}
            title="Switch Language"
            style={{
              background: "transparent",
              border: `1px solid ${C.border}`,
              borderRadius: 8, padding: "6px 10px",
              cursor: "pointer", color: C.textMuted,
              fontSize: 12, fontWeight: 700,
              transition: "all 0.2s"
            }}
          >
            {lang === "en" ? "EN" : "हिं"}
          </button>
        </div>
      </div>

      {/* ── QUICK CHIPS ── */}
      <div style={{ padding: "12px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", gap: 8, flexWrap: "wrap", background: C.card }}>
        {QUICK_QUERIES.map((q, i) => (
          <button
            key={i}
            onClick={() => sendMessage(q)}
            disabled={loading}
            style={{
              background: `${C.accent}15`, border: `1px solid ${C.accent}40`,
              borderRadius: 12, padding: "6px 12px", cursor: loading ? "not-allowed" : "pointer",
              color: C.accent, fontSize: 12, fontWeight: 600,
              transition: "background 0.15s", whiteSpace: "nowrap"
            }}
            onMouseEnter={e => !loading && (e.currentTarget.style.background = `${C.accent}28`)}
            onMouseLeave={e => !loading && (e.currentTarget.style.background = `${C.accent}15`)}
          >
            {q}
          </button>
        ))}
      </div>

      {/* ── CHAT AREA ── */}
      <div 
        ref={chatContainerRef}
        style={{ flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: 16 }}
      >
        {messages.map((m, i) => {
          const isUser = m.role === "user";
          return (
            <div key={i} style={{
              display: "flex",
              flexDirection: isUser ? "row-reverse" : "row",
              alignItems: "flex-end", gap: 10,
            }}>
              {!isUser && (
                <div style={{
                  width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
                  background: `${C.accent}20`, display: "flex",
                  alignItems: "center", justifyContent: "center", fontSize: 14,
                }}>⚖️</div>
              )}

              <div style={{ maxWidth: "78%", position: "relative", group: "true" }}>
                <div style={{
                  background: isUser
                    ? `linear-gradient(135deg, ${C.accent}cc, #8b5cf6cc)`
                    : C.card,
                  border: isUser ? "none" : `1px solid ${C.accent}20`,
                  borderRadius: isUser
                    ? "16px 16px 4px 16px"
                    : "4px 16px 16px 16px",
                  padding: "12px 16px",
                  fontSize: 14, color: isUser ? "#fff" : C.textPrimary,
                  lineHeight: 1.65, whiteSpace: "pre-wrap",
                  wordBreak: "break-word", boxShadow: `0 4px 12px rgba(0,0,0,0.1)`
                }}>
                  {m.content}
                </div>
                {!isUser && (
                  <button
                    onClick={() => copy(m.content)}
                    style={{
                      position: "absolute", bottom: -20, left: 4,
                      background: "transparent", border: "none",
                      color: C.textMuted, fontSize: 11, cursor: "pointer",
                      display: "flex", gap: 4, alignItems: "center"
                    }}
                  >
                    📋 Copy
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {/* typing indicator */}
        {loading && (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
              background: `${C.accent}20`, display: "flex",
              alignItems: "center", justifyContent: "center", fontSize: 14,
            }}>⚖️</div>
            <div style={{
              background: C.card, border: `1px solid ${C.border}`,
              borderRadius: "4px 16px 16px 16px",
              padding: "12px 16px",
              display: "flex", gap: 6, alignItems: "center",
            }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  width: 6, height: 6, borderRadius: "50%",
                  background: C.accent,
                  animation: `dotBounce 1.2s ${i * 0.2}s ease-in-out infinite`,
                }} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── INPUT AREA ── */}
      <div style={{
        padding: "14px 20px",
        borderTop: `1px solid ${C.border}`,
        display: "flex", gap: 10, alignItems: "center",
        background: C.card,
      }}>
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter") {
              e.preventDefault();
              sendMessage();
            }
          }}
          placeholder={TEXT[lang].placeholder}
          disabled={loading}
          style={{
            flex: 1, background: C.surface, border: `1px solid ${C.border}`,
            borderRadius: 14, padding: "12px 16px",
            color: C.textPrimary, fontSize: 14,
            fontFamily: "'DM Sans', sans-serif",
            outline: "none", transition: "border-color 0.2s"
          }}
          onFocus={e => e.target.style.borderColor = C.accent}
          onBlur={e => e.target.style.borderColor = C.border}
        />

        {SpeechRecognition && (
          <button
            onClick={() => { unlockSpeech(); toggleVoiceInput(); }}
            disabled={loading}
            title={listening ? "Stop listening" : "Voice input"}
            style={{
              width: 44, height: 44, borderRadius: "50%", flexShrink: 0,
              background: listening ? `${C.danger}20` : `${C.accent}15`,
              border: `1px solid ${listening ? C.danger : C.accent}40`,
              cursor: "pointer", fontSize: 18,
              display: "flex", alignItems: "center", justifyContent: "center",
              animation: listening ? "pulseRing 1.5s ease-out infinite" : "none",
              transition: "background 0.2s",
            }}
          >
            {listening ? "⏹" : "🎤"}
          </button>
        )}

        <button
          onClick={() => { unlockSpeech(); sendMessage(); }}
          disabled={!input.trim() || loading}
          style={{
            width: 44, height: 44, borderRadius: "50%", flexShrink: 0,
            background: input.trim() && !loading
              ? `linear-gradient(135deg, ${C.accent}, #8b5cf6)`
              : `${C.accent}20`,
            border: "none", cursor: input.trim() && !loading ? "pointer" : "not-allowed",
            fontSize: 18, color: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.2s",
            boxShadow: input.trim() && !loading ? `0 4px 16px ${C.accent}60` : "none"
          }}
        >
          ➤
        </button>
      </div>

      {/* Footer Disclaimer */}
      <div style={{
        padding: "8px", textAlign: "center", fontSize: 11,
        color: C.textMuted, background: C.surface, borderTop: `1px solid ${C.border}`
      }}>
        ⚠️ Informational only. Not legal advice.
      </div>
    </div>
  );
}