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
  zIndex = 1000000,
  borderColor = "#000000",
  continueButtonBackground = "#3b82f6"
}: ChatWidgetProps) {
  const [open, setOpen] = useState(openPanel ?? false);
  const [wasOpen, setWasOpen] = useState(openPanel ?? false);
  
  useEffect(() => {
    if (openPanel !== undefined) setOpen(openPanel);
  }, [openPanel]);

  // Reset wasOpen tracking
  useEffect(() => {
    setWasOpen(open);
  }, [open]);

  const handleSetOpen = (value: boolean) => {
    setOpen(value);
    if (onOpenChange) onOpenChange(value);
  }

  const containerRef = useRef<HTMLDivElement | null>(null);
  const uniqId = useRef(`cw_${Math.random().toString(36).slice(2)}`).current;

  const [name, setName] = useState("");
  const [allNodes, setAllNodes] = useState([]);
  const [allEdges, setAllEdges] = useState([]);
  const [messages, setMessages] = useState<Record<string, string>>({});
  const [botInstanceId, setBotInstanceId] = useState<string>('');
  const [botKey, setBotKey] = useState<string>('');

  function getChatMessages(nodes) {
    const messages: Record<string, string> = {};

    // Loop through all nodes
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      let text = '';
      
      if (node.type === "message") {
        text = node.data.text;
      } else if (node.type === "input") {
        text = node.data.label;
      } else if (node.type === "choice") {
        text = node.data.label + " Options: " + node.data.options.join(", ");
      }
      
      if (text) {
        messages[node.id] = text;
      }
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

  // Helper function to check if a node is the last node (no outgoing edges)
  const isLastNode = (nodeId: string): boolean => {
    // Check if there are any edges where source === nodeId
    const hasOutgoingEdges = allEdges.some(
      (edge) => edge.source === nodeId
    );
    return !hasOutgoingEdges;
  };

  // Helper function to find the start node (node that is not the target of any edge)
  const getStartNode = (): any => {
    if (!allNodes.length || !allEdges.length) {
      return null;
    }

    // Get all target node IDs from edges
    const targetNodeIds = new Set(allEdges.map(edge => edge.target));

    // Find the node whose id is not in the target set
    const startNode = allNodes.find(node => !targetNodeIds.has(node.id));

    // Return the start node, or fallback to first node if not found
    return startNode || allNodes[0] || null;
  };

  // Helper function to find the next node from the current node
  const getNextNode = (currentNode: any): any => {
    if (!currentNode || !allNodes.length || !allEdges.length) {
      return null;
    }

    // Filter out choice option edges (edges with sourceHandle starting with 'option-')
    // Find the next edge from the current node
    const nextEdge = allEdges.find(
      (edge) => edge.source === currentNode.id && 
                (!edge.sourceHandle || !edge.sourceHandle.startsWith('option-'))
    );

    if (!nextEdge || !nextEdge.target) {
      return null;
    }

    // Find the target node
    const nextNode = allNodes.find((node) => node.id === nextEdge.target);
    return nextNode || null;
  };

  useEffect(() => {
    async function fetchBotData() {
      const apiUrl = `${import.meta.env.VITE_API_BASE_URL}/${kind == "inst" ? "bot_instances" : "bots"}/${botId}`
      const res = await fetch(apiUrl);
      const data = await res.json();
      const { name, plan, nodes, edges, botId: bot } = data;
      
      const planNodes = nodes?.[plan] ?? [];
      const planEdges = edges?.[plan] ?? [];
      
      setName(kind == "inst" ? bot.name : name);
      setAllNodes(planNodes);
      setAllEdges(planEdges);
      setMessages(getChatMessages(planNodes));
      
      // Store botInstanceId and botKey for lead capture (only for instances)
      if (kind === "inst") {
        setBotInstanceId(data._id);
        setBotKey('');
      } else {
        setBotInstanceId('');
        setBotKey(data.key);
      }
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

  const bubbleSideStyle = position === "bottom-left" ? { left: 20, right: "auto" as const } : { right: 20, left: "auto" as const };

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

    const anchoredStyle: React.CSSProperties = opts.anchored ? {
      position: "fixed",
      bottom: bubbleDims.height + 32,
      ...(position === "bottom-left" ? { left: 20 } : { right: 20 }),
      zIndex,
    } : {};

    const sidebarStyle: React.CSSProperties = opts.fullHeightRight ? { position: "fixed", top: 0, bottom: 0, right: 0, zIndex } : {};

    const [curNode, setCurNode] = useState(null);
    const [answers, setAnswers] = useState({});
    const [input, setInput] = useState("");
    const [answeredNodeIds, setAnsweredNodeIds] = useState<string[]>([]);
    const capturedLeadNodeIdRef = useRef<string | null>(null);

    // Initialize curNode with the start node
    useEffect(() => {
      const startNode = getStartNode();
      setCurNode(startNode);
      // Add start node to answeredNodeIds initially
      if (startNode && startNode.id) {
        setAnsweredNodeIds([startNode.id]);
      }
    }, [allNodes, allEdges]);
    
    // Check if curNode is the last node and capture lead
    useEffect(() => {
      if (!curNode || !allNodes.length || !allEdges.length) return;
      
      // If curNode is action type, move to next node
      if (curNode.type === "action") {
        const nextNode = getNextNode(curNode);
        if (nextNode) {
          setCurNode(nextNode);
          // Add next node to answeredNodeIds so its message is displayed
          setAnsweredNodeIds(prev => prev.includes(nextNode.id) ? prev : [...prev, nextNode.id]);
        }
        return; // Don't check for last node if it's an action node
      }
      
      if (isLastNode(curNode.id)) {
        // Only capture lead once per last node
        if (capturedLeadNodeIdRef.current !== curNode.id) {
          capturedLeadNodeIdRef.current = curNode.id;
          captureLead(answers);
        }
      }
    }, [curNode, allNodes, allEdges, answers]);
    
    // Reset to start node and answers when widget is reopened
    useEffect(() => {
      if (open && !wasOpen) {
        const startNode = getStartNode();
        setCurNode(startNode);
        setAnswers({});
        setInput("");
        capturedLeadNodeIdRef.current = null; // Reset captured lead tracking
        // Add start node to answeredNodeIds when widget is reopened
        if (startNode && startNode.id) {
          setAnsweredNodeIds([startNode.id]);
        } else {
          setAnsweredNodeIds([]);
        }
      }
    }, [open, wasOpen]);

    const send = () => {
      const txt = input.trim();
      if (!txt) return;

      setAnswers({ ...answers, [curNode.id]: txt });
      // Add nodeId to answered nodes list if not already present
      setAnsweredNodeIds(prev => prev.includes(curNode.id) ? prev : [...prev, curNode.id]);
      setInput("");
      
      let nextNode = null;
      
      // If current node is a choice node, find next node by matching answer with options
      if (curNode.type === "choice" && curNode.data?.options) {
        // Find the option that matches the answer (case-insensitive)
        const matchedOption = curNode.data.options.find(
          (opt: string) => opt.toLowerCase().trim() === txt.toLowerCase().trim()
        );
        
        if (matchedOption) {
          // Find edge with sourceHandle matching this option
          const optionEdge = allEdges.find(
            (e) => e.source === curNode.id && e.sourceHandle === `option-${matchedOption}`
          );
          
          if (optionEdge && optionEdge.target) {
            // Find the next node from the selected option
            nextNode = allNodes.find((node) => node.id === optionEdge.target);
          }
        }
      }
      
      // If not a choice node or no match found, use getNextNode
      if (!nextNode) {
        nextNode = getNextNode(curNode);
      }
      
      if (nextNode) {
        setCurNode(nextNode);
        // Add next node to answeredNodeIds so its message is displayed
        setAnsweredNodeIds(prev => prev.includes(nextNode.id) ? prev : [...prev, nextNode.id]);
      }
    };

    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    useEffect(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, answers]);

    // Function to capture lead when chat is finished
    const captureLead = async (currentAnswers: any) => {
      // Only capture if we have botInstanceId or botKey
      if (!botInstanceId && !botKey) return;

      // Extract email and phone from answers
      let email = '';
      let phone = '';
      let name = '';
      let company = '';
      let message = '';

      // Check all answers to find email, phone, name, company, and message
      Object.keys(currentAnswers).forEach((key) => {
        const value = currentAnswers[key];
        if (!value) return;

        const node = allNodes.find(n => n.id === key);
        const nodeLabel = (node?.data?.label || node?.data?.title || '').toLowerCase();

        // Check node label to determine field type
        if (nodeLabel.includes('email')) {
          email = value.trim();
        } else if (nodeLabel.includes('phone') || nodeLabel.includes('tel')) {
          phone = value.trim();
        } else if (nodeLabel.includes('name')) {
          name = value.trim();
        } else if (nodeLabel.includes('company') || nodeLabel.includes('business')) {
          company = value.trim();
        } else if (nodeLabel.includes('message')) {
          message = value.trim();
        }
      });

      // Only capture if we have at least one of email, phone, name, or company
      if (!email && !phone && !name && !company) return;

      try {
        const leadData = {
          botInstanceId: botInstanceId,
          botKey: botKey,
          email,
          phone,
          name,
          company,
          message,
          answers: currentAnswers,
          source: 'chatwidget',
          status: 'new',
        };

        const apiUrl = `${import.meta.env.VITE_API_BASE_URL}/leads`;
        await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(leadData),
        });
      } catch (error) {
        console.error('Error capturing lead on finish:', error);
      }
    };

    return (
      <div style={{ ...baseCard, ...anchoredStyle, ...sidebarStyle }}>
        {panelStyle == "conversation" && (
          <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
            {/* Header */}
            <div
              style={{
                background: borderColor,
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
                    meta: { nodeId: curNode.id },
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
              {answeredNodeIds.map((nodeId, i) => {
                const message = messages[nodeId];
                const answer = answers[nodeId];
                
                if (!message) return null;
                
                return (
                  <React.Fragment key={nodeId}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 8,
                        justifyContent: "flex-start",
                      }}
                    >
                      <BotAvatar />
                      <div style={msgStyles.bot}>{message}</div>
                    </div>
                    {answer && (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 8,
                          justifyContent: "flex-end",
                        }}
                      >
                        <div style={msgStyles.user}>{answer}</div>
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
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
        {panelStyle == "step-by-step" && (
          <div>
            <div
              style={{borderTopLeftRadius: "1rem", borderTopRightRadius: "1rem", padding: "1rem", height: "0.5rem", backgroundColor: borderColor}}
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
                {curNode?.data?.title || curNode?.data?.label || ''}
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
                {curNode && (() => {
                  if (curNode.type === "message") {
                    return <div style={{ fontWeight: "bold" }}>{curNode.data.text}</div>;
                  }

                  if (curNode.type === "input") {
                    return (
                      <div>
                        <input
                          style={{
                            width: "100%",
                            border: "1px solid #ccc",
                            borderRadius: "0.5rem",
                            padding: "0.5rem 0.75rem",
                          }}
                          placeholder={curNode.data.placeholder}
                          value={answers[curNode.id] || ""}
                          onChange={(e) =>
                            setAnswers({ ...answers, [curNode.id]: e.target.value })
                          }
                        />
                      </div>
                    );
                  }

                  if (curNode.type === "choice") {
                    return (
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        {curNode.data.options.map((opt) => (
                          <button
                            key={opt}
                            onClick={() => {
                              setAnswers({ ...answers, [curNode.id]: opt });
                              // Add nodeId to answered nodes list if not already present
                              setAnsweredNodeIds(prev => prev.includes(curNode.id) ? prev : [...prev, curNode.id]);
                              
                              // Find edge with sourceHandle matching this option
                              const optionEdge = allEdges.find(
                                (e) => e.source === curNode.id && e.sourceHandle === `option-${opt}`
                              );
                              
                              if (optionEdge && optionEdge.target) {
                                // Find the next node from the selected option
                                const nextNode = allNodes.find((node) => node.id === optionEdge.target);
                                
                                if (nextNode) {
                                  // Update curNode to the next node
                                  setCurNode(nextNode);
                                  // Add next node to answeredNodeIds so its message is displayed
                                  setAnsweredNodeIds(prev => prev.includes(nextNode.id) ? prev : [...prev, nextNode.id]);
                                }
                              }
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

                  return null;
                })()}
              </div>

              {(() => {
                if (!curNode) return null;

                if (isLastNode(curNode.id)) {
                  return null;
                }

                return (
                  <button
                    onClick={() => {                      
                      // Find next node from curNode
                      const nextNode = getNextNode(curNode);
                      if (nextNode) {
                        setCurNode(nextNode);
                        // Add next node to answeredNodeIds so its message is displayed
                        setAnsweredNodeIds(prev => prev.includes(nextNode.id) ? prev : [...prev, nextNode.id]);
                      }
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
                );
              })()}
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
