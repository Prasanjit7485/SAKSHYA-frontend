import { useEffect, useRef, useState } from "react";

/* ---------------- SYSTEM PROMPT ---------------- */
const SYSTEM_PROMPT = `
You are an AI legal assistant specialized in Indian law.

- Use Constitution of India, IPC, CrPC
- Mention Articles/Sections when relevant
- Be accurate and structured

Format:
Crime Type:
Answer:
Relevant Law:
Explanation:
Limitations:
`;

/* ---------------- QUICK QUERIES ---------------- */
const QUICK_QUERIES = [
  "What is Article 21?",
  "Explain FIR in India",
  "What are my fundamental rights?",
  "Cyber crime laws in India",
  "What is bail?",
];

/* ---------------- CRIME DETECTION ---------------- */
const detectCrime = (text) => {
  const t = text.toLowerCase();
  if (t.includes("hack") || t.includes("otp")) return "Cyber Crime";
  if (t.includes("murder") || t.includes("kill")) return "Homicide";
  if (t.includes("theft") || t.includes("stolen")) return "Theft";
  if (t.includes("rape") || t.includes("assault")) return "Sexual Offence";
  if (t.includes("fraud") || t.includes("scam")) return "Fraud";
  return "General Legal Query";
};

/* ---------------- CASE STRENGTH ---------------- */
const analyzeStrength = (text) => {
  let score = 0;
  if (text.includes("evidence")) score += 3;
  if (text.includes("witness")) score += 2;
  if (text.length > 50) score += 2;

  if (score >= 5) return "Strong 🟢";
  if (score >= 3) return "Moderate 🟡";
  return "Weak 🔴";
};

/* ---------------- UI TEXT ---------------- */
const TEXT = {
  en: {
    title: "⚖️ Legal Assistant",
    placeholder: "Ask about Indian law...",
    typing: "Typing...",
  },
  hi: {
    title: "⚖️ कानूनी सहायक",
    placeholder: "भारतीय कानून के बारे में पूछें...",
    typing: "टाइप हो रहा है...",
  },
};

export default function LegalPage() {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "⚖️ Ask me anything about Indian law." },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [listening, setListening] = useState(false);
  const [lang, setLang] = useState("en");
  const [voiceLang, setVoiceLang] = useState("en-IN");

  const recognitionRef = useRef(null);
  const chatEndRef = useRef(null);

  /* -------- SCROLL -------- */
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* -------- SPEECH INPUT -------- */
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) return;

    const rec = new SpeechRecognition();
    rec.continuous = false;

    rec.onstart = () => setListening(true);
    rec.onend = () => setListening(false);

    rec.onresult = (e) => {
      setInput(e.results[0][0].transcript);
    };

    recognitionRef.current = rec;
  }, []);

  const toggleVoice = () => {
    if (!recognitionRef.current) return;

    if (listening) recognitionRef.current.stop();
    else {
      recognitionRef.current.lang = voiceLang;
      recognitionRef.current.start();
    }
  };

  /* -------- TEXT TO SPEECH -------- */
  const speak = (text) => {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = voiceLang;
    window.speechSynthesis.speak(u);
  };

  /* -------- SEND MESSAGE -------- */
  const sendMessage = async (custom) => {
    const text = custom || input;
    if (!text.trim()) return;

    const crime = detectCrime(text);
    const strength = analyzeStrength(text);

    const userMsg = {
      role: "user",
      content: `${text}\n\n[Crime: ${crime} | Case: ${strength}]`,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setTyping(true);

    try {
      const res = await fetch(import.meta.env.VITE_API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "openai/gpt-4o-mini",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            userMsg,
          ],
          temperature: 0.3,
        }),
      });

      const data = await res.json();
      const reply =
        data.choices?.[0]?.message?.content || "No response";

      const botMsg = { role: "assistant", content: "" };
      setMessages((prev) => [...prev, botMsg]);

      // typing animation
      let temp = "";
      for (let i = 0; i < reply.length; i++) {
        temp += reply[i];
        await new Promise((r) => setTimeout(r, 8));
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1].content = temp;
          return updated;
        });
      }

      speak(reply);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "❌ Error" },
      ]);
    }

    setTyping(false);
  };

  const copy = (text) => navigator.clipboard.writeText(text);

  return (
    <div className="flex flex-col h-[600px] bg-[#0f172a] text-white rounded-xl">
      
      {/* Header */}
      <div className="p-3 flex justify-between border-b border-gray-700">
        <span>{TEXT[lang].title}</span>

        <div className="flex gap-2">
          <button onClick={() => setLang(lang === "en" ? "hi" : "en")}>🌐</button>
          <button onClick={() => setVoiceLang(voiceLang === "en-IN" ? "hi-IN" : "en-IN")}>🎙️</button>
        </div>
      </div>

      {/* Quick Chips */}
      <div className="p-2 flex gap-2 flex-wrap">
        {QUICK_QUERIES.map((q, i) => (
          <button
            key={i}
            onClick={() => sendMessage(q)}
            className="bg-gray-700 px-2 py-1 rounded text-xs"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Chat */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.map((m, i) => (
          <div key={i} className="group">
            <div
              className={`max-w-[75%] px-3 py-2 rounded ${
                m.role === "user"
                  ? "ml-auto bg-blue-600"
                  : "bg-gray-800"
              }`}
            >
              {m.content}
            </div>

            {m.role === "assistant" && (
              <button
                onClick={() => copy(m.content)}
                className="text-xs text-gray-400 opacity-0 group-hover:opacity-100"
              >
                📋 Copy
              </button>
            )}
          </div>
        ))}

        {typing && <div>{TEXT[lang].typing}</div>}
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div className="p-2 flex gap-2 border-t border-gray-700">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={TEXT[lang].placeholder}
          className="flex-1 p-2 bg-gray-800 rounded"
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />

        <button onClick={toggleVoice}>
          {listening ? "⏹️" : "🎤"}
        </button>

        <button onClick={() => sendMessage()} className="bg-blue-600 px-3">
          Send
        </button>
      </div>

      {/* Footer */}
      <div className="text-xs text-center p-1 text-gray-400">
        ⚠️ Informational only. Not legal advice.
      </div>
    </div>
  );
}