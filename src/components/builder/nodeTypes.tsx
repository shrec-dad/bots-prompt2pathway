// src/components/builder/nodeTypes.tsx
import React from "react";
import { Handle, Position, type NodeProps } from "reactflow";

/** MESSAGE ************************************************************/
export const MessageNode: React.FC<NodeProps> = ({ data }) => {
  return (
    <div className="rounded-xl border border-gray-400 bg-white shadow p-3 w-56">
      <div className="text-xs text-gray-500">Message</div>
      <div className="font-semibold">{data?.title ?? "Message"}</div>
      <p className="text-sm text-gray-700 mt-1">{data?.text ?? "…"}</p>
      <Handle type="source" position={Position.Right} />
    </div>
  );
};

/** INPUT **************************************************************/
export const InputNode: React.FC<NodeProps> = ({ data }) => {
  return (
    <div className="rounded-xl border border-gray-400 bg-white shadow p-3 w-56">
      <div className="text-xs text-gray-500">Input</div>
      <label className="font-medium text-sm">
        {data?.label ?? "Ask user"}
      </label>
      <input
        className="mt-2 w-full rounded-md border px-2 py-1 text-sm"
        placeholder={data?.placeholder ?? "Type…"}
        readOnly
      />
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  );
};

/** CHOICE *************************************************************/
export const ChoiceNode: React.FC<NodeProps> = ({ data }) => {
  const options: string[] = data?.options ?? ["A", "B"];
  return (
    <div className="rounded-xl border border-gray-400 bg-white shadow p-3 w-56">
      <div className="text-xs text-gray-500">Choice</div>
      <div className="font-medium text-sm">{data?.label ?? "Choose one"}</div>
      <ul className="mt-2 space-y-1 text-sm">
        {options.map((o) => (
          <li key={o} className="rounded border px-2 py-1">
            {o}
          </li>
        ))}
      </ul>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  );
};

/** ACTION *************************************************************/
export const ActionNode: React.FC<NodeProps> = ({ data }) => {
  return (
    <div className="rounded-xl border border-gray-400 bg-white shadow p-3 w-56">
      <div className="text-xs text-gray-500">Action</div>
      <div className="font-semibold text-sm">{data?.label ?? "Do something"}</div>
      <div className="text-xs text-gray-700 mt-1">
        {data?.action ?? "sendEmail"} → {data?.destination ?? "admin@example.com"}
      </div>
      <Handle type="target" position={Position.Left} />
    </div>
  );
};

/** MAP FOR REACT FLOW *************************************************/
export const NODE_TYPES = {
  message: MessageNode,
  inputNode: InputNode,
  choiceNode: ChoiceNode,
  actionNode: ActionNode,
};

    
    
