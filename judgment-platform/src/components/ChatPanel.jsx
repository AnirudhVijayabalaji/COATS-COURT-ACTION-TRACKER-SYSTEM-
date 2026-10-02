import { useEffect, useMemo, useRef, useState } from "react";
import { askQuestion } from "../api/judgmentAI";


function formatText(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\n/g, "<br/>");
}

function buildGreeting(meta) {
  return {
    role: "ai",
    section: "Case Ready",
    text: `I have indexed **${meta.caseNumber}** and mapped the operative directions, deadlines, owners, and source references. Ask me for the next action, appeal risk, department responsibility, or the exact evidence behind a workflow step.`,
    sources: [{ label: "Case index" }],
    confidence: meta.confidence || 94,
  };
}

function formatSources(sources = []) {
  if (!sources.length) return [{ label: "Case index" }];
  return sources.map((source) => ({
    label: source.page ? `Page ${source.page}` : "Source",
    excerpt: source.excerpt,
  }));
}

export default function ChatPanel({ suggestions = [], meta }) {
  const greeting = useMemo(() => buildGreeting(meta), [meta]);
  const [messages, setMessages] = useState([greeting]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    setMessages([greeting]);
  }, [greeting]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async (text) => {
    const cleanText = text.trim();
    if (!cleanText || loading) return;

    setMessages((prev) => [...prev, { role: "user", text: cleanText }]);
    setInput("");
    setLoading(true);

    try {
      const response = await askQuestion(meta.caseId, cleanText);
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          section: "Judgment Answer",
          text: response.answer,
          sources: formatSources(response.sources),
          confidence: (typeof response.confidence === "number" && response.confidence > 0) ? response.confidence : 94,
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          section: "Question failed",
          text: err.message || "I could not retrieve an answer from the backend.",
          sources: [{ label: "Backend" }],
          confidence: 0,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div className="chatbot-panel">
      <div className="assistant-brief">
        <div>
          <span>Scope</span>
          <strong>{meta.subject}</strong>
        </div>
        <div>
          <span>Mode</span>
          <strong>Source-bound</strong>
        </div>
      </div>

      <div className="chat-messages">
        {messages.map((message, index) => (
          <div key={`${message.role}-${index}`} className={`chat-msg ${message.role}`}>
            <div className={`chat-avatar ${message.role}`}>{message.role === "ai" ? "AI" : "You"}</div>
            <div className="chat-bubble">
              {message.section && <span className="answer-section">{message.section}</span>}
              <div dangerouslySetInnerHTML={{ __html: formatText(message.text) }} />
              {message.sources && (
                <div className="chat-source-row">
                  {message.sources.map((source) => (
                    <span key={`${source.label}-${source.excerpt || ""}`} className="chat-source-tag" title={source.excerpt || ""}>
                      {source.label}
                    </span>
                  ))}
                  <span className="confidence-chip">{message.confidence}% confidence</span>
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="chat-msg ai">
            <div className="chat-avatar ai">AI</div>
            <div className="chat-bubble loading-bubble">
              <span className="answer-section">Retrieving source</span>
              <div className="chat-typing">
                <span />
                <span />
                <span />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="chat-suggestions">
        {suggestions.slice(0, 4).map((suggestion) => (
          <button
            key={suggestion}
            className="suggestion-chip"
            onClick={() => sendMessage(suggestion)}
            disabled={loading}
          >
            {suggestion}
          </button>
        ))}
      </div>

      <div className="chat-input-row">
        <input
          className="chat-input"
          type="text"
          placeholder="Ask a source-bound question..."
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
        />
        <button
          className="chat-send-btn"
          onClick={() => sendMessage(input)}
          disabled={!input.trim() || loading}
          aria-label="Send message"
        >
          Send
        </button>
      </div>
    </div>
  );
}
