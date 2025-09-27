// src/widgets/ChatWidget.tsx
import React from "react";

type Props = {
  mode: "popup" | "inline" | "sidebar";
  botId: string;
  color?: string;
  size?: number;
  position?: "bottom-right" | "bottom-left";
  image?: string;
};

export default function ChatWidget(props: Props) {
  const size = props.size ?? 64;
  const style: React.CSSProperties = {
    position: props.mode === "inline" ? "relative" : "fixed",
    bottom: props.mode === "inline" ? undefined : 24,
    right: props.mode === "inline" ? undefined : (props.position === "bottom-right" ? 24 : undefined),
    left: props.mode === "inline" ? undefined : (props.position === "bottom-left" ? 24 : undefined),
    width: props.mode === "sidebar" ? 360 : size,
    height: props.mode === "sidebar" ? "100vh" : size,
    border: "2px solid #000",
    borderRadius: props.mode === "sidebar" ? 0 : "50%",
    background: props.color ?? "#7aa8ff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    zIndex: 9999
  };

  return (
    <div style={style} title={`Bot: ${props.botId}`}>
      {props.image
        ? <img src={props.image} alt="chat bubble" style={{ width: "70%", height: "70%", objectFit: "contain" }} />
        : <span style={{ fontWeight: 900 }}>Chat</span>}
    </div>
  );
}

/* Example mount helper if you later export as a UMD bundle:
  (window as any).ChatWidget = {
    mount: (el: HTMLElement, opts: Props) => {
      const root = ReactDOM.createRoot(el);
      root.render(React.createElement(ChatWidget, opts));
      return root;
    }
  };
*/
