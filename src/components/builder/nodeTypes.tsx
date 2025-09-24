// src/components/builder/nodeTypes.tsx
import React from "react";
import type { NodeProps } from "reactflow";

/**
 * Shared card wrapper so every node gets the same look/feel
 * - Wider so labels & inputs never get cut off
 * - Text wraps (no ellipsis)
 * - Dark borders (reinforced in index.css too)
 */
const Card: React.FC<{ title?: string; children?: React.ReactNode }> = ({
  title,
  children,
}) => {
  return (
    <div className="node-card rounded-2xl border bg-white p-4 shadow-sm">
      {title ? (
        <div className="mb-3 text-[15px] font-bold text-black leading-tight">
          {title}
        </div>
      ) : null}
      <div className="space-y-3">{children}</div>
    </div>
  );
};

/** Simple label/message display */
export function MessageNode({ data }: NodeProps) {
  return (
    <Card title={data?.title ?? data?.label ?? "Message"}>
      {data?.body ? (
        <p className="text-[14px] font-medium text-black/90">{data.body}</p>
      ) : null}
    </Card>
  );
}

/** Single input capture (name/email/etc.) */
export function InputNode({ data }: NodeProps) {
  const label =
    data?.title ?? data?.label ?? "Input";
  const placeholder =
    data?.placeholder ?? "Type...";

  return (
    <Card title={label}>
      <input
        type="text"
        className="w-full rounded-xl border px-3 py-2 text-[14px] font-medium text-black placeholder:text-black/40 focus:outline-none"
        placeholder={placeholder}
        readOnly
      />
    </Card>
  );
}

/** Multiple choice selector */
export function ChoiceNode({ data }: NodeProps) {
  const label =
    data?.title ?? data?.label ?? "Choose an option";
  const options: string[] =
    data?.options ??
    data?.choices ??
    ["Option A", "Option B", "Option C"];

  return (
    <Card title={label}>
      <div className="space-y-2">
        {options.map((opt: string, idx: number) => (
          <button
            key={`${opt}-${idx}`}
            type="button"
            className="block w-full rounded-xl border bg-white px-3 py-2 text-left text-[14px] font-semibold text-black focus:outline-none"
          >
            {opt}
          </button>
        ))}
      </div>
    </Card>
  );
}

/** Placeholder action node (webhook, email, etc.) */
export function ActionNode({ data }: NodeProps) {
  const label = data?.title ?? data?.label ?? "Action";
  const desc =
    data?.description ?? data?.body ?? "Runs an action (placeholder)";

  return (
    <Card title={label}>
      <p className="text-[14px] font-medium text-black/90">{desc}</p>
    </Card>
  );
}

export const NODE_TYPES = {
  message: MessageNode,
  input: InputNode,
  choice: ChoiceNode,
  action: ActionNode,
};
