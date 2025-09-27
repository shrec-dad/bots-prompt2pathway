// src/components/ModalChat.tsx
import React, { useEffect, useMemo, useState } from "react";

type ModalChatProps = {
  open: boolean;
  onClose: () => void;
  accent?: string; // button tint
  title?: string;  // header title
};

type Submission = {
  email: string;
  interest: "Curious" | "Very interested" | "VIP";
  ts: number;
};

const EMAIL_RE =
  // simple but effective
  /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

export default function ModalChat({
  open,
  onClose,
  accent = "#3ca58c",
  title = "Quick intake to match you with the right plan",
}: ModalChatProps) {
  // Steps: 0=welcome, 1=email, 2=interest, 3=confirm (done)
  const [step, setStep] = useState(0);
  const [email, setEmail] = useState("");
  const [interest, setInterest] = useState<"Curious" | "Very interested" | "VIP" | "">("");
  const canNext = useMemo(() => {
    if (step === 0) return true;
    if (step === 1) return EMAIL_RE.test(email);
    if (step === 2) return Boolean(interest);
    return true;
  }, [step, email, interest]);

  // Reset flow whenever the modal opens
  useEffect(() => {
    if (open) {
      setStep(0);
      setEmail("");
      setInterest("");
    }
  }, [open]);

  // Keyboard shortcuts: Esc to close, Enter to advance (when valid)
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "Enter") {
        if (canNext) next();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, canNext]);

  const back = () => setStep((s) => Math.max(0, s - 1));

  const next = () => {
    if (step === 1 && !EMAIL_RE.test(email)) return;
    if (step === 2 && !interest) return;

    if (step < 3) {
      setStep(step + 1);
      if (step === 2) {
        // Save submission on transition to confirmation
        const payload: Submission = {
          email,
          interest: interest as Submission["interest"],
          ts: Date.now(),
        };
        try {
          const key = "previewSubmissions";
          const prev = JSON.parse(localStorage.getItem(key) || "[]");
          prev.push(payload);
          localStorage.setItem(key, JSON.stringify(prev));
        } catch {
          // ignore
        }
      }
    }
  };

  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15, 23, 42, 0.45)",
        backdropFilter: "blur(4px)",
        zIndex: 10000,
        display: "grid",
        placeItems: "center",
        padding: 16,
      }}
    >
      <div
        style={{
          width: "min(720px, 94%)",
          height: "min(78vh, 720px)",
          borderRadius: 18,
          overflow: "hidden",
          boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
          display: "flex",
          flexDirection: "column",
          border: "1px solid rgba(0,0,0,0.8)",
          background: "white",
        }}
      >
        {/* Header gradient */}
        <div
          style={{
            background:
              "linear-gradient(90deg, #e9a6d1, #b099f3, #8fe3cf 90%)",
            color: "white",
            fontWeight: 800,
            padding: "12px 56px 12px 24px",
            position: "relative",
          }}
        >
          <div style={{ fontSize: 16, letterSpacing: 0.2 }}>{title}</div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              position: "absolute",
              right: 8,
              top: 8,
              width: 36,
              height: 36,
              borderRadius: 999,
              background: "rgba(255,255,255,0.25)",
              border: "2px solid #000",
              color: "#111",
              fontWeight: 900,
              display: "grid",
              placeItems: "center",
              cursor: "pointer",
            }}
          >
            ×
          </button>
        </div>

        {/* Progress indicator */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 6,
            padding: "10px 16px",
            background: "rgba(0,0,0,0.03)",
            borderBottom: "1px solid rgba(0,0,0,0.12)",
          }}
        >
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                height: 8,
                borderRadius: 999,
                border: "1px solid #000",
                background:
                  i <= (step === 3 ? 2 : step) ? accent : "white",
              }}
            />
          ))}
        </div>

        {/* Body */}
        <div
          style={{
            flex: 1,
            background:
              "linear-gradient(140deg, rgba(255,255,255,0.65), rgba(255,255,255,0.45))",
            backdropFilter: "blur(8px)",
            display: "grid",
            placeItems: "center",
            padding: 24,
          }}
        >
          {/* Animated step container */}
          <div
            key={step}
            style={{
              width: "100%",
              maxWidth: 560,
              textAlign: "center",
              animation: "fadeIn .26s ease",
            }}
          >
            {step === 0 && <Welcome />}
            {step === 1 && (
              <EmailStep
                email={email}
                setEmail={setEmail}
                valid={EMAIL_RE.test(email)}
              />
            )}
            {step === 2 && (
              <InterestStep
                interest={interest}
                setInterest={setInterest}
                accent={accent}
              />
            )}
            {step === 3 && <Confirm email={email} interest={interest as any} />}
          </div>
        </div>

        {/* Footer (controls) */}
        <div
          style={{
            display: "flex",
            gap: 12,
            alignItems: "center",
            justifyContent: "space-between",
            padding: 16,
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.02), rgba(0,0,0,0.05))",
            borderTop: "1px solid rgba(0,0,0,0.15)",
          }}
        >
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={onClose}
              style={ghostBtn}
            >
              <span style={{ fontSize: 18 }}>✕</span> Close
            </button>
            {step > 0 && step < 3 && (
              <button onClick={back} style={ghostBtn}>
                ← Back
              </button>
            )}
          </div>

          {step < 3 ? (
            <button
              onClick={next}
              disabled={!canNext}
              style={{
                ...primaryBtn(accent),
                opacity: canNext ? 1 : 0.5,
                cursor: canNext ? "pointer" : "not-allowed",
              }}
            >
              Next
            </button>
          ) : (
            <button onClick={onClose} style={primaryBtn(accent)}>
              Done
            </button>
          )}
        </div>
      </div>

      {/* tiny keyframes */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

/* ---------- Sub-views ---------- */

function Welcome() {
  return (
    <div>
      <div style={{ fontSize: 56, marginBottom: 18 }}>👋</div>
      <h2
        style={{
          fontSize: 28,
          fontWeight: 800,
          color: "#11423d",
          marginBottom: 12,
        }}
      >
        Welcome to Our Client Intake Bot
      </h2>
      <p
        style={{
          color: "#3f7a72",
          fontSize: 18,
          lineHeight: 1.5,
          marginBottom: 4,
        }}
      >
        I will ask a few quick questions to help our team help you.
      </p>
      <p style={{ color: "#3f7a72" }}>Press <b>Enter</b> to continue.</p>
    </div>
  );
}

function EmailStep({
  email,
  setEmail,
  valid,
}: {
  email: string;
  setEmail: (v: string) => void;
  valid: boolean;
}) {
  return (
    <div>
      <h3
        style={{
          fontSize: 22,
          fontWeight: 800,
          color: "#11423d",
          marginBottom: 10,
        }}
      >
        What’s your email?
      </h3>
      <p style={{ color: "#3f7a72", marginBottom: 16 }}>
        We’ll send your confirmation there.
      </p>
      <input
        autoFocus
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@domain.com"
        style={{
          width: "100%",
          maxWidth: 420,
          border: "2px solid #000",
          borderRadius: 12,
          padding: "14px 16px",
          fontSize: 16,
          outline: "none",
          boxShadow: "0 6px 0 #000",
        }}
      />
      {!valid && email.length > 3 && (
        <div style={{ color: "#a73d3d", fontWeight: 700, marginTop: 8 }}>
          Please enter a valid email.
        </div>
      )}
    </div>
  );
}

function InterestStep({
  interest,
  setInterest,
  accent,
}: {
  interest: string;
  setInterest: (v: any) => void;
  accent: string;
}) {
  const options: Array<"Curious" | "Very interested" | "VIP"> = [
    "Curious",
    "Very interested",
    "VIP",
  ];
  return (
    <div>
      <h3
        style={{
          fontSize: 22,
          fontWeight: 800,
          color: "#11423d",
          marginBottom: 10,
        }}
      >
        Your interest level?
      </h3>
      <p style={{ color: "#3f7a72", marginBottom: 16 }}>
        Choose one to help us tailor your next steps.
      </p>

      <div
        style={{
          display: "grid",
          gap: 12,
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          maxWidth: 520,
          margin: "0 auto",
        }}
      >
        {options.map((opt) => {
          const selected = interest === opt;
          return (
            <button
              key={opt}
              onClick={() => setInterest(opt)}
              style={{
                border: "2px solid #000",
                borderRadius: 12,
                padding: "14px 16px",
                fontWeight: 800,
                boxShadow: "0 6px 0 #000",
                background: selected ? accent : "white",
                color: selected ? "white" : "#111",
                cursor: "pointer",
              }}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Confirm({
  email,
  interest,
}: {
  email: string;
  interest: "Curious" | "Very interested" | "VIP";
}) {
  return (
    <div>
      <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
      <h3
        style={{
          fontSize: 22,
          fontWeight: 800,
          color: "#11423d",
          marginBottom: 10,
        }}
      >
        You’re all set!
      </h3>
      <p style={{ color: "#3f7a72", marginBottom: 8 }}>
        We saved your details:
      </p>
      <div
        style={{
          display: "inline-block",
          textAlign: "left",
          border: "2px solid #000",
          borderRadius: 12,
          padding: "12px 16px",
          boxShadow: "0 6px 0 #000",
          background: "white",
          minWidth: 280,
        }}
      >
        <div>
          <b>Email:</b> {email}
        </div>
        <div>
          <b>Interest:</b> {interest}
        </div>
      </div>
      <p style={{ color: "#3f7a72", marginTop: 16 }}>
        (Saved to <code>localStorage["previewSubmissions"]</code> for now.)
      </p>
    </div>
  );
}

/* ---------- button styles ---------- */

const ghostBtn: React.CSSProperties = {
  border: "2px solid #000",
  background: "white",
  color: "#111",
  fontWeight: 800,
  borderRadius: 999,
  padding: "12px 18px",
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  boxShadow: "0 6px 0 #000",
  transform: "translateY(-2px)",
  cursor: "pointer",
};

const primaryBtn = (accent: string): React.CSSProperties => ({
  background: accent,
  border: "2px solid #000",
  color: "white",
  fontWeight: 900,
  borderRadius: 12,
  padding: "14px 32px",
  boxShadow: "0 6px 0 #000",
  transform: "translateY(-2px)",
  minWidth: 140,
  cursor: "pointer",
});
