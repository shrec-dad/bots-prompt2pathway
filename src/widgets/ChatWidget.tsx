import React, { useEffect, useMemo, useRef, useState } from "react";

/** Public props you can pass from Preview/Embed */
export type ChatWidgetProps = {
  mode?: "popup" | "inline" | "sidebar";
  openPanel: boolean;
  onOpenChange?: (v: boolean) => void;
  botId?: string;
  kind: "bot" | "inst";

  // Bubble controls
  position?: "bottom-right" | "bottom-left";
  size?: number;                 // base size in px (used by circle/square); oval auto-scales
  color?: string;                // bubble background color if no image
  image?: string;                // optional bubble image URL (may be data:URI)
  imageFit?: "cover" | "contain";
  shape?:
    | "circle"
    | "rounded"
    | "oval"
    | "square"
    | "speech"          // round speech bubble
    | "speech-rounded"; // rounded-rect speech bubble
  label?: string;                // text on the bubble (e.g., "Chat")
  labelColor?: string;           // text color for label
  hideLabelWhenImage?: boolean;  // NEW: hide label automatically if an image is set

  // Message appearance in the chat transcript
  messageStyle?:
    | "outlined-black"
    | "accent-yellow"
    | "modern-soft"
    | "pill"
    | "rounded-rect"
    | "minimal-outline";

  panelStyle?: "step-by-step" | "conversation";

  // Optional avatar (real photo or logo) for BOT messages
  botAvatarUrl?: string;
  // z-index control for embedding on busy pages
  zIndex?: number;
  borderColor?: string;
  // Continue button background color (for step-by-step mode)
  continueButtonBackground?: string;
};

export default function ChatWidget({
  mode = "popup",
  openPanel = false,
  onOpenChange,
  botId = "",
  kind = "bot",
  position = "bottom-right",
  size = 64,
  color = "#7aa8ff",
  image,
  imageFit = "cover",
  shape = "circle",
  label = "Chat",
  labelColor = "#ffffff",
  hideLabelWhenImage = false,
  panelStyle = "conversation",
  messageStyle = "outlined-black",
  botAvatarUrl,
  zIndex = 2147483000,
  borderColor = "#000000",
  continueButtonBackground = "#3b82f6"
}: ChatWidgetProps) {
  const [open, setOpen] = useState(openPanel ?? false);
  
  useEffect(() => {
    if (openPanel !== undefined) setOpen(openPanel);
  }, [openPanel]);

  const handleSetOpen = (value: boolean) => {
    setOpen(value);
    if (onOpenChange) onOpenChange(value);
  }

  const containerRef = useRef<HTMLDivElement | null>(null);
  const uniqId = useRef(`cw_${Math.random().toString(36).slice(2)}`).current;

  const [name, setName] = useState("");
  const [flowNodes, setFlowNodes] = useState([]);
  const [messages, setMessages] = useState<string[]>([]);

  const getOrderedNodes = (nodes, edges) => {
    const sourceToTarget = Object.fromEntries(edges.map(e => [e.source, e.target]));
    const startNode = nodes.find(n => !edges.some(e => e.target === n.id)); // find node with no incoming edge

    const ordered = [];
    let current = startNode;
    while (current) {
      ordered.push(current);
      const nextId = sourceToTarget[current.id];
      current = nodes.find(n => n.id === nextId);
    }
    return ordered;
  }

  function getChatMessages(nodes, edges) {
    // Build mapping of source → target
    const sourceToTarget = Object.fromEntries(edges.map(e => [e.source, e.target]));
    
    // Find the first node (no incoming edge)
    const startNode = nodes.find(n => !edges.some(e => e.target === n.id));

    const messages = [];
    let current = startNode;

    while (current) {
      if (current.type === "message") {
        messages.push(current.data.text);
      } else if (current.type === "input") {
        messages.push(current.data.label);
      } else if (current.type === "choice") {
        messages.push(current.data.label + " Options: " + current.data.options.join(", "));
      }
      const nextId = sourceToTarget[current.id];
      current = nodes.find(n => n.id === nextId);
    }

    return messages;
  }

  async function trackEvent(data) {
    const apiUrl = `${import.meta.env.VITE_API_BASE_URL}/metrics`
    await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
  }


  useEffect(() => {
    async function fetchBotData() {
      const apiUrl = `${import.meta.env.VITE_API_BASE_URL}/${kind == "inst" ? "bot_instances" : "bots"}/${botId}`
      const res = await fetch(apiUrl);
      const { name, plan, nodes, edges, botId: bot } = await res.json();
      setName(kind == "inst" ? bot.name : name);
      setFlowNodes(getOrderedNodes(nodes?.[plan] ?? [], edges?.[plan] ?? []));
      setMessages(getChatMessages(nodes?.[plan] ?? [], edges?.[plan] ?? []));
    }
    fetchBotData();
  }, [botId, kind]);

  // ─────────────────────────────────────────────────────────────────────────────
  // Bubble geometry (oval & speech-rounded change width/height; others square)
  // ─────────────────────────────────────────────────────────────────────────────
  const bubbleDims = useMemo(() => {
    if (shape === "oval" || shape === "speech-rounded") {
      return {
        width: Math.round(size * 1.55),
        height: Math.round(size * 0.9),
        radius: Math.round(size * 0.9),
      };
    }
    const squareish = { width: size, height: size };
    if (shape === "rounded") return { ...squareish, radius: 14 };
    if (shape === "square") return { ...squareish, radius: 6 };
    // default circle & "speech" use radius = half
    return { ...squareish, radius: size / 2 };
  }, [shape, size]);

  const bubbleSideStyle =
    position === "bottom-left"
      ? { left: 20, right: "auto" as const }
      : { right: 20, left: "auto" as const };


  // Keep reserved; nothing heavy here
  useEffect(() => {
    const onResize = () => {};
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // ─────────────────────────────────────────────────────────────────────────────
  // Message style maps
  // ─────────────────────────────────────────────────────────────────────────────
  const msgStyles = useMemo(() => {
    const common = {
      botBase: { maxWidth: "80%", padding: "10px 12px", borderWidth: 2 } as React.CSSProperties,
      userBase: { maxWidth: "80%", padding: "10px 12px", borderWidth: 2 } as React.CSSProperties,
    };
    switch (messageStyle) {
      case "outlined-black":
        return {
          bot: { ...common.botBase, background: "#fff", color: "#000", border: "2px solid #000", borderRadius: 12 },
          user: { ...common.userBase, background: "#E9F5FF", color: "#000", border: "2px solid #000", borderRadius: 12 },
        };
      case "accent-yellow":
        return {
          bot: { ...common.botBase, background: "#FEF08A", color: "#0F172A", border: "2px solid #D97706", borderRadius: 12 },
          user: { ...common.userBase, background: "#FFF7ED", color: "#0F172A", border: "2px solid #D6D3D1", borderRadius: 12 },
        };
      case "modern-soft":
        return {
          bot: { ...common.botBase, background: "#EEF1F7", color: "#111827", border: "1px solid #E5E7EB", borderRadius: 18 },
          user: { ...common.userBase, background: "#E9F5FF", color: "#111827", border: "1px solid #BFDBFE", borderRadius: 18 },
        };
      case "rounded-rect":
        return {
          bot: { ...common.botBase, background: "#FFFFFF", color: "#111827", border: "1px solid #E5E7EB", borderRadius: 12 },
          user: { ...common.userBase, background: "#EEF2FF", color: "#111827", border: "1px solid #C7D2FE", borderRadius: 12 },
        };
      case "minimal-outline":
        return {
          bot: { ...common.botBase, background: "#FFFFFF", color: "#111827", border: "1px solid #E5E7EB", borderRadius: 10 },
          user: { ...common.userBase, background: "#FFFFFF", color: "#111827", border: "1px solid #D1D5DB", borderRadius: 10 },
        };
      case "pill":
      default:
        return {
          bot: { ...common.botBase, background: "#FFFFFF", color: "#111827", border: "1px solid #E5E7EB", borderRadius: 9999 },
          user: { ...common.userBase, background: "#EEF2FF", color: "#111827", border: "1px solid #C7D2FE", borderRadius: 9999 },
        };
    }
  }, [messageStyle]);

  // Avatar for bot
  const BotAvatar = () => (
    <div
      style={{
        width: 32,
        height: 32,
        borderRadius: "50%",
        border: "2px solid #000",
        overflow: "hidden",
        background: "#fff",
      }}
    >
      {botAvatarUrl ? (
        <img src={botAvatarUrl} alt="bot avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        <div style={{ width: "100%", height: "100%", display: "grid", placeItems: "center", fontWeight: 800 }}>🤖</div>
      )}
    </div>
  );

  // Panel container for different modes
  const Panel: React.FC = () => {
    if (mode === "inline") return renderPanel({ anchored: false, fullHeightRight: false });
    if (mode === "sidebar") return renderPanel({ anchored: false, fullHeightRight: true });
    return renderPanel({ anchored: true, fullHeightRight: false }); // popup
  };

  function renderPanel(opts: { anchored: boolean; fullHeightRight: boolean }) {
    const baseCard: React.CSSProperties = {
      width: opts.fullHeightRight ? 400 : 380,
      height: opts.fullHeightRight ? "100vh" : 520,
      maxHeight: "min(700px, 90vh)",
      background: "#fff",
      border: `2px solid ${borderColor}`,
      borderRadius: opts.fullHeightRight ? 0 : 18,
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
    };

    const anchoredStyle: React.CSSProperties = opts.anchored
      ? {
          position: "fixed",
          bottom: bubbleDims.height + 32,
          ...(position === "bottom-left" ? { left: 20 } : { right: 20 }),
          zIndex,
        }
      : {};

    const sidebarStyle: React.CSSProperties = opts.fullHeightRight
      ? { position: "fixed", top: 0, bottom: 0, right: 0, zIndex }
      : {};

    const [answers, setAnswers] = useState({});
    const [input, setInput] = useState("");

    const send = () => {
      const txt = input.trim();
      if (!txt) return;

      setAnswers({ ...answers, [step]: txt })

      setInput("");
      
      // Move to the next step
      setStep((s) => s + 1);
    };
    const [step, setStep] = useState(0);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, answers]);

    return (
      <div style={{ ...baseCard, ...anchoredStyle, ...sidebarStyle }}>
        {panelStyle == "conversation" && (
          <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
            {/* Header */}
            <div
              style={{
                background: color,
                padding: "12px 14px",
                borderBottom: `2px solid ${borderColor}`,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <div style={{ fontWeight: 900 }}>{name}</div>
              <button
                onClick={() => {
                  trackEvent({
                    type: "close_widget",
                    key: `${kind}:${botId}`,
                    meta: { step },
                    ts: Date.now()
                  });
                  handleSetOpen(false);
                }}
                aria-label="Close"
                style={{
                  marginLeft: "auto",
                  padding: "4px 10px",
                  fontWeight: 800,
                  border: `2px ${borderColor} #000`,
                  color: borderColor,
                  background: "#fff",
                  borderRadius: 8,
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>

            {/* Messages area */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: 12,
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              {messages.slice(0, step + 1).map((m, i) => (
                <React.Fragment key={i}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 8,
                    justifyContent: "flex-start",
                  }}
                >
                  <BotAvatar />
                  <div style={msgStyles.bot}>{m}</div>
                </div>
                {answers[i] && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 8,
                      justifyContent: "flex-end",
                    }}
                  >
                    <div style={msgStyles.user}>{answers[i]}</div>
                  </div>
                )}
                </React.Fragment>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input + button fixed at bottom */}
            <div
              style={{
                display: "flex",
                borderTop: `2px solid ${borderColor}`,
                padding: "8px 12px",
                background: "#fff",
                gap: 8,
              }}
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder="Type a message…"
                style={{ flex: 1, padding: "12px", fontWeight: 600, outline: "none", borderRadius: 6, border: "1px solid #ccc" }}
              />
              <button
                onClick={send}
                style={{
                  padding: "12px 16px",
                  fontWeight: 800,
                  borderLeft: "2px solid #000",
                  background: color,
                  color: "#fff",
                  borderRadius: 6,
                }}
              >
                Send
              </button>
            </div>
          </div>
        )}
        {panelStyle == "step-by-step" && flowNodes.length > 0 && (
          <div>
            <div
              style={{borderTopLeftRadius: "1rem", borderTopRightRadius: "1rem", padding: "1rem", height: "0.5rem", backgroundColor: color}}
              aria-hidden="true"
            />
            <div 
              style={{
                padding: "1rem",
                display: "flex",
                flexDirection: "column",
                maxHeight: "80vh",
                overflowY: "auto",
              }}
            >
              <div style={{ display: "flex" }}>
                <button
                  style={{
                    marginLeft: "auto",
                    borderRadius: "1rem",
                    padding: "0.375rem 0.75rem",
                    fontWeight: "bold",
                    border: "1px solid #ccc",
                    backgroundColor: "white",
                    cursor: "pointer",
                  }}
                  onClick={() => {
                    trackEvent({
                      type: "close_widget",
                      key: `${kind}:${botId}`,
                      meta: { step },
                      ts: Date.now()
                    })
                    handleSetOpen(false);
                  }}
                  autoFocus
                  aria-label="Close preview"
                >
                  Close
                </button>
              </div>

              {/* emoji + text */}
              <div style={{ display: "grid", placeItems: "center", fontSize: "3.75rem" }}>👋</div>
              <h2 style={{ textAlign: "center", fontSize: "1.5rem", fontWeight: 800, marginTop: "0.5rem" }}>
                Welcome to { name }!
              </h2>

              <div
                style={{
                  marginTop: "1rem",
                  textAlign: "center",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.25rem",
                }}
              >
                {flowNodes[step] && (() => {
                  const node = flowNodes[step];

                  if (node.type === "message") {
                    return <div style={{ fontWeight: "bold" }}>{node.data.text}</div>;
                  }

                  if (node.type === "input") {
                    return (
                      <div>
                        <label style={{ display: "block", fontWeight: "bold", marginBottom: "0.25rem" }}>{node.data.label}</label>
                        <input
                          style={{
                            width: "100%",
                            border: "1px solid #ccc",
                            borderRadius: "0.5rem",
                            padding: "0.5rem 0.75rem",
                          }}
                          placeholder={node.data.placeholder}
                          value={answers[node.id] || ""}
                          onChange={(e) =>
                            setAnswers({ ...answers, [node.id]: e.target.value })
                          }
                        />
                      </div>
                    );
                  }

                  if (node.type === "choice") {
                    return (
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        {node.data.options.map((opt) => (
                          <button
                            key={opt}
                            onClick={() => {
                              setAnswers({ ...answers, [node.id]: opt });
                              setStep((s) => s + 1);
                            }}
                            style={{
                              borderRadius: "1rem",
                              padding: "0.5rem 1rem",
                              fontWeight: "bold",
                              border: "1px solid black",
                              cursor: "pointer",
                              backgroundColor: "white",
                            }}
                            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#f3f3f3")}
                            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "white")}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    );
                  }

                  if (node.type === "action") {
                    if (node.data.label.includes("lead")) {
                      trackEvent({
                        type: "widget.lead_captured",
                        key: `${kind}:${botId}`,
                        meta: { step },
                        ts: Date.now()
                      })
                    }
                  }

                  setStep((s) => s + 1);
                })()}
              </div>

              {step < flowNodes.length - 1 && (
                <button
                  onClick={() => {
                    trackEvent({
                      type: "step_next",
                      key: `${kind}:${botId}`,
                      meta: { step },
                      ts: Date.now()
                    })
                    setStep((s) => s + 1)
                  }}
                  style={{
                    borderRadius: "1rem",
                    padding: "0.5rem 1.25rem",
                    fontWeight: "bold",
                    color: "white",
                    marginTop: "2rem",
                    background: continueButtonBackground,
                    boxShadow: "0 3px 0 #000",
                    cursor: "pointer",
                  }}
                >
                  Continue
                </button>
              )}

              {step === flowNodes.length - 1 && (
                <div style={{ marginTop: "2rem", textAlign: "center", fontWeight: "bold" }}>🎉 All steps completed!</div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Bubble renderers
  // ─────────────────────────────────────────────────────────────────────────────

  /** SVG speech bubbles with optional image fill via clipPath */
  const SpeechBubble = ({ variant }: { variant: "round" | "rounded" }) => {
    const w = bubbleDims.width;
    const h = bubbleDims.height;

    const tailOnLeft = position === "bottom-right"; // tail points inward
    const bodyId = `${uniqId}_clip`;

    const body =
      variant === "round" ? (
        // <circle cx={w / 2} cy={h / 2} r={Math.min(w, h) / 2 - 3} />
        <path 
          d="M 25
            4.0625
            C 12.414063 4.0625 2.0625 12.925781 2.0625 24
            C 2.0625 30.425781 5.625 36.09375 11 39.71875
            C 10.992188 39.933594 11 40.265625 10.71875 41.3125
            C 10.371094 42.605469 9.683594 44.4375 8.25 46.46875
            L 7.21875 47.90625
            L 9 47.9375
            C 15.175781 47.964844 18.753906 43.90625 19.3125 43.25
            C 21.136719 43.65625 23.035156 43.9375 25 43.9375
            C 37.582031 43.9375 47.9375 35.074219 47.9375 24
            C 47.9375 12.925781 37.582031 4.0625 25 4.062
            Z" 
          fill="none" 
          stroke={borderColor} 
          strokeWidth="2"
          transform={tailOnLeft ? "" : "scale(-1,1) translate(-50,0)"}/>
      ) : (
        // <rect
        //   x={3}
        //   y={3}
        //   width={w - 6}
        //   height={h - 6}
        //   rx={roundR}
        //   ry={roundR}
        // />
        <path 
          d="M5 5 
            h40 
            a5 5 0 0 1 5 5 
            v25 
            a5 5 0 0 1 -5 5 
            h-25 
            l-10 10 
            v-10 
            h-5 
            a5 5 0 0 1 -5 -5 
            v-25 
            a5 5 0 0 1 5 -5 
            z" 
          fill="none" 
          stroke={borderColor}  
          strokeWidth="2"
          transform={tailOnLeft ? "" : "scale(-1,1) translate(-50,0)"}/>
      );

    return (
      <svg
        width={w}
        height={h}
        viewBox={`0 0 50 50`}
        style={{ position: "absolute", inset: 0, overflow: "visible" }}
      >
        <defs>
          <clipPath id={bodyId}>
            {body}
            {/* {tail} */}
          </clipPath>
        </defs>

        {image ? (
          <>
            <image
              href={image}
              width={w}
              height={h}
              preserveAspectRatio={imageFit === "cover" ? "xMidYMid slice" : "xMidYMid meet"}
              clipPath={`url(#${bodyId})`}
            />
            <g fill="none" stroke="#000" strokeWidth="2">
              {body}
            </g>
          </>
        ) : (
          <>
            <g clipPath={`url(#${bodyId})`}>
              <rect x="0" y="0" width={w} height={h} fill={color || "#fff"} />
            </g>
            <g fill="none" stroke="#000" strokeWidth="2">
              {body}
            </g>
          </>
        )}
      </svg>
    );
  };

  const renderLabel = !!label && !(hideLabelWhenImage && !!image);

  const BubbleInner = () =>
    renderLabel ? (
      <span
        style={{
          position: "relative",
          zIndex: 1,
          color: labelColor,
          fontWeight: 900,
          padding: "0 8px",
          userSelect: "none",
        }}
      >
        {label}
      </span>
    ) : null;

  const BoxBubble = () => (
    <>
      {/* optional image fill */}
      {image && (
        <img
          src={image}
          alt="bubble"
          style={{
            width: "100%",
            height: "100%",
            objectFit: imageFit,
            position: "absolute",
            inset: 0,
            borderRadius: bubbleDims.radius,
          }}
        />
      )}
      {!image && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: bubbleDims.radius,
            background: color,
          }}
        />
      )}
      <BubbleInner />
    </>
  );

  const SpeechBubbleWrapper = ({ variant }: { variant: "round" | "rounded" }) => (
    <>
      <SpeechBubble variant={variant} />
      <div
        style={{
          position: "relative",
          zIndex: 1,
          display: "grid",
          placeItems: "center",
          width: "100%",
          height: "100%",
          textAlign: "center"
        }}
      >
        <BubbleInner/>
      </div>
    </>
  );

  const handleBubbleClick = () => {
    if (open) {
      trackEvent({
        type: "close_widget",
        key: `${kind}:${botId}`,
        ts: Date.now()
      })
    } else {
      trackEvent({
        type: "open_widget",
        key: `${kind}:${botId}`,
        ts: Date.now()
      })
    }
    setOpen((v) => !v);
  };

  return (
    <div ref={containerRef}>
      {/* Bubble (always rendered for popup mode; optional for others) */}
      {mode === "popup" && (
        <button
          onClick={handleBubbleClick}
          aria-label="Open chat"
          style={{
            position: "fixed",
            bottom: 20,
            ...bubbleSideStyle,
            width: bubbleDims.width,
            height: bubbleDims.height,
            borderRadius: shape.startsWith("speech") ? undefined : bubbleDims.radius,
            border: ((shape !== "speech" && shape !== "speech-rounded" ) ? `2px solid ${borderColor}` : "0"),
            background: "transparent",
            overflow: "hidden",
            zIndex,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {shape === "speech" && <SpeechBubbleWrapper variant="round" />}
          {shape === "speech-rounded" && <SpeechBubbleWrapper variant="rounded" />}
          {shape !== "speech" && shape !== "speech-rounded" && <BoxBubble />}
        </button>
      )}

      {/* Panels */}
      {mode === "popup" && open && <Panel />}
      {mode === "inline" && open && (
        <div style={{ margin: "12px 0" }}>
          <Panel />
        </div>
      )}
      {mode === "sidebar" && open && <Panel />}
    </div>
  );
}
