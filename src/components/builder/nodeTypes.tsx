// src/components/builder/nodeTypes.tsx
import React from "react";
import { Handle, Position, NodeProps } from "reactflow";

export const MessageNode: React.FC<NodeProps> = ({ data }) => (
  <div className="rounded-xl border bg-white shadow-sm p-3 w-56">
    <div className="text-xs text-gray-500">Message</div>
    <div className="font-semibold">{data?.title ?? "Message"}</div>
    <p className="text-sm text-gray-700 mt-1">{data?.text ?? "…"}</p>
    <Handle type="source" position={Position.Right} />
  </div>
);

export const InputNode: React.FC<NodeProps> = ({ data }) => (
  <div className="rounded-xl border bg-white shadow-sm p-3 w-56">
    <div className="text-xs text-gray-500">Input</div>
    <label className="font-medium text-sm">{data?.label ?? "Ask user"}</label>
    <input
      className="mt-2 w-full rounded-md border px-2 py-1 text-sm"
      placeholder={data?.placeholder ?? "Type…"}
    />
    <Handle type="target" position={Position.Left} />
    <Handle type="source" position={Position.Right} />
  </div>
);

export const ChoiceNode: React.FC<NodeProps> = ({ data }) => (
  <div className="rounded-xl border bg-white shadow-sm p-3 w-56">
    <div className="text-xs text-gray-500">Choice</div>
    <div className="font-medium text-sm">{data?.label ?? "Choose one"}</div>
    <ul className="mt-2 space-y-1 text-sm">
      {(data?.options ?? ["A", "B"]).map((o: string) => (
        <li key={o} className="rounded border px-2 py-1">{o}</li>
      ))}
    </ul>
    <Handle type="target" position={Position.Left} />
    <Handle type="source" position={Position.Right} />
  </div>
);

export const ActionNode: React.FC<NodeProps> = ({ data }) => (
  <div className="rounded-xl border bg-white shadow-sm p-3 w-56">
    <div className="text-xs text-gray-500">Action</div>
    <div className="font-semibold text-sm">{data?.label ?? "Do something"}</div>
    <div className="text-xs text-gray-500 mt-1">
      {data?.action ?? "sendEmail"} → {data?.destination ?? "admin@example.com"}
    </div>
    <Handle type="target" position={Position.Left} />
  </div>
);

export const NODE_TYPES = {
  message: MessageNode,
  inputNode: InputNode,
  choiceNode: ChoiceNode,
  actionNode: ActionNode,
};

