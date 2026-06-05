import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { askAI } from "../api/api";
import { useAuth } from "../context/AuthContext";
import ReactMarkdown from "react-markdown";

export default function Chat() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const questionSentRef = useRef(false);

  const [messages, setMessages] = useState([
    {
      role: "ai",
      text: "👋 Hi! I'm FinSage, your personal finance coach. Ask me anything about your spending, savings, or budget!",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (location.state?.question && location.state.question.trim() && !questionSentRef.current) {
      questionSentRef.current = true;
      const question = location.state.question;
      window.history.replaceState({}, document.title);

      setTimeout(() => {
        setMessages((prev) => [...prev, { role: "user", text: question }]);
        setLoading(true);
        askAI(question)
          .then((res) => {
            setMessages((prev) => [...prev, { role: "ai", text: res.data.reply }]);
          })
          .catch((err) => {
            console.error("AI error:", err);
            setMessages((prev) => [...prev, { role: "ai", text: "Sorry, I couldn't process that. Please try again." }]);
          })
          .finally(() => {
            setLoading(false);
          });
      }, 300);
    }
  }, []);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: userMessage }]);
    setLoading(true);
    try {
      const res = await askAI(userMessage);
      setMessages((prev) => [...prev, { role: "ai", text: res.data.reply }]);
    } catch (err) {
      setMessages((prev) => [...prev, { role: "ai", text: "Sorry, I couldn't process that. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div style={styles.page}>
      <nav style={styles.navbar}>
        <h1 style={styles.navLogo}>💰 FinSage</h1>
        <div style={styles.navRight}>
          <button style={styles.navBtn} onClick={() => navigate("/dashboard")}>Dashboard</button>
          <span style={styles.navUser}>👋 {user?.name}</span>
          <button style={styles.logoutBtn} onClick={handleLogout}>Logout</button>
        </div>
      </nav>

      <div style={styles.container}>
        <div style={styles.chatCard}>
          <div style={styles.chatHeader}>
            <span style={styles.aiAvatar}>🤖</span>
            <div>
              <h2 style={styles.chatTitle}>FinSage AI Coach</h2>
              <p style={styles.chatSubtitle}>Powered by Gemini • Knows your finances</p>
            </div>
          </div>

          <div style={styles.messagesBox}>
            {messages.map((msg, index) => (
              <div key={index} style={{
                ...styles.messageBubble,
                alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
                background: msg.role === "user" ? "#0f3460" : "#f0f2f5",
                color: msg.role === "user" ? "white" : "#1a1a2e",
                borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
              }}>
                <ReactMarkdown>{msg.text}</ReactMarkdown>
              </div>
            ))}
            {loading && (
              <div style={{ ...styles.messageBubble, alignSelf: "flex-start", background: "#f0f2f5", color: "#888" }}>
                FinSage is thinking...
              </div>
            )}
          </div>

          <div style={styles.inputRow}>
            <input
              style={styles.chatInput}
              placeholder="Ask about your finances... (Press Enter to send)"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
            />
            <button
              style={{ ...styles.sendBtn, opacity: loading || !input.trim() ? 0.6 : 1 }}
              onClick={handleSend}
              disabled={loading || !input.trim()}
            >
              Send
            </button>
          </div>
        </div>

        <div style={styles.suggestionsCard}>
          <h3 style={styles.suggestTitle}>💡 Try asking</h3>
          {[
            "Where am I spending the most?",
            "How can I save more this month?",
            "Am I spending too much on food?",
            "Give me a budget plan",
            "What is my current balance?",
          ].map((q, i) => (
            <button key={i} style={styles.suggestionBtn} onClick={() => setInput(q)}>{q}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", background: "#f0f2f5" },
  navbar: {
    background: "#1a1a2e", color: "white", padding: "1rem 2rem",
    display: "flex", justifyContent: "space-between", alignItems: "center",
    boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
  },
  navLogo: { fontSize: "1.4rem", fontWeight: "700" },
  navRight: { display: "flex", alignItems: "center", gap: "1rem" },
  navUser: { fontSize: "0.95rem" },
  navBtn: {
    background: "transparent", color: "white", border: "1px solid rgba(255,255,255,0.3)",
    padding: "0.4rem 1rem", borderRadius: "6px", fontWeight: "500",
  },
  logoutBtn: {
    background: "#e94560", color: "white", border: "none",
    padding: "0.4rem 1rem", borderRadius: "6px", fontWeight: "600",
  },
  container: {
    maxWidth: "900px", margin: "0 auto", padding: "2rem",
    display: "grid", gridTemplateColumns: "1fr 280px", gap: "1.5rem",
  },
  chatCard: {
    background: "white", borderRadius: "16px",
    boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
    display: "flex", flexDirection: "column", height: "75vh",
  },
  chatHeader: {
    display: "flex", alignItems: "center", gap: "1rem",
    padding: "1.2rem 1.5rem", borderBottom: "1px solid #f0f0f0",
  },
  aiAvatar: { fontSize: "2rem" },
  chatTitle: { fontSize: "1.1rem", fontWeight: "600", margin: 0 },
  chatSubtitle: { fontSize: "0.8rem", color: "#888", margin: 0 },
  messagesBox: {
    flex: 1, overflowY: "auto", padding: "1.5rem",
    display: "flex", flexDirection: "column", gap: "0.8rem",
  },
  messageBubble: {
    maxWidth: "75%", padding: "0.75rem 1rem",
    fontSize: "0.92rem", lineHeight: "1.5",
  },
  inputRow: {
    display: "flex", gap: "0.8rem", padding: "1rem 1.5rem",
    borderTop: "1px solid #f0f0f0",
  },
  chatInput: {
    flex: 1, padding: "0.75rem 1rem", borderRadius: "8px",
    border: "1.5px solid #e0e0e0", fontSize: "0.95rem", outline: "none",
  },
  sendBtn: {
    background: "#0f3460", color: "white", border: "none",
    padding: "0.75rem 1.5rem", borderRadius: "8px",
    fontWeight: "600", fontSize: "0.95rem",
  },
  suggestionsCard: {
    background: "white", borderRadius: "16px", padding: "1.5rem",
    boxShadow: "0 2px 12px rgba(0,0,0,0.07)", height: "fit-content",
  },
  suggestTitle: { fontSize: "1rem", fontWeight: "600", marginBottom: "1rem", color: "#1a1a2e" },
  suggestionBtn: {
    display: "block", width: "100%", textAlign: "left",
    background: "#f0f2f5", border: "none", borderRadius: "8px",
    padding: "0.7rem 1rem", marginBottom: "0.6rem",
    fontSize: "0.85rem", color: "#1a1a2e", cursor: "pointer",
  },
};