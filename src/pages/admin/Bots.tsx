// src/pages/admin/Bots.tsx - SOCIAL MEDIA REMOVED
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import { fetchBots, addBot, updateBot, deleteBot, duplicateBot } from '@/store/botsSlice';
import { fetchInstances, updateInstance, deleteInstance } from '@/store/botInstancesSlice';

/* ---------- Small inline Emoji Picker Modal ---------- */
function EmojiPickerModal({
  onClose,
  onPick,
  current,
}: {
  onClose: () => void;
  onPick: (emoji: string) => void;
  current?: string;
}) {
  const emojis = [
    "🎯", "📅", "💬", "⏳", "☎️", "🤖", "💼", "🌟", "🧭",
    "🏥", "🛍️", "🧾", "🧰", "🛠️", "💡",
  ];
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
      <div className="bg-white rounded-2xl border-2 border-black p-5 w-full max-w-sm shadow-xl">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xl font-extrabold">Choose Emoji</h3>
          <button
            className="rounded-lg border px-2 py-1 text-sm font-bold hover:bg-muted/40"
            onClick={onClose}
          >
            Close
          </button>
        </div>
        <div className="text-sm text-foreground/70 mb-3">
          Pick an emoji to represent this bot template.
        </div>
        <div className="grid grid-cols-6 gap-3">
          {emojis.map((emj) => (
            <button
              key={emj}
              onClick={() => {
                onPick(emj);
                onClose();
              }}
              className={`text-2xl rounded-xl border-2 p-2 transition ${
                current === emj
                  ? "border-black bg-yellow-100 shadow"
                  : "border-gray-200 hover:border-gray-400"
              }`}
              title={emj}
            >
              {emj}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------------- main page ---------------- */
export default function Bots() {
  const dispatch = useDispatch();
  const instances = useSelector((state: RootState) => state.instances.list);
  const bots = useSelector((state: RootState) => state.bots.list);
  const [loading, setLoading] = React.useState(false);

  useEffect(() => {
    dispatch(fetchBots());
    dispatch(fetchInstances());
  }, [dispatch]);

  const [showHidden, setShowHidden] = useState(false);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newBotName, setNewBotName] = useState("");
  const [newBotEmoji, setNewBotEmoji] = useState("🤖");
  const [showEmojiPickerFor, setShowEmojiPickerFor] = useState<null | { id: string; emoji: string }>(null);

  const handleCreateBot = async (data) => {
    try {
      await dispatch(addBot(data)).unwrap();
      dispatch(fetchBots());
    } catch (err: any) {

    }
  }

  const handleDeleteBot = async (id) => {
    try {
      await dispatch(deleteBot(id)).unwrap();
      dispatch(fetchBots());
    } catch (err: any) {

    }
  }
  
  const handleDeleteInstance = async (id) => {
    try {
      await dispatch(deleteInstance(id)).unwrap();
      dispatch(fetchInstances());
    } catch (err: any) {

    }
  }

  const handleDuplicateInstanceFromBot = async (id, plan, name) => {
    try {
      await dispatch(duplicateBot({ id, data: { plan, name }})).unwrap();
      dispatch(fetchInstances());
    } catch (err: any) {

    }
  } 

  const handleUpdateBot = async (id, data) => {
    try {
      await dispatch(updateBot({id, data})).unwrap();
      dispatch(fetchBots());
      dispatch(fetchInstances());
    } catch (err: any) {

    }
  }

  const handleUpdateInstance = async (id, data) => {
    try {
      await dispatch(updateInstance({id, data})).unwrap();
      dispatch(fetchInstances()); 
    } catch (err: any) {

    }
  }

  return (
    <div className="p-5 md:p-6 space-y-6">
      {/* Header + Create / Reset buttons */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-xl font-extrabold">Bots</div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm font-semibold mr-2">
            <input
              type="checkbox"
              checked={showHidden}
              onChange={(e) => setShowHidden(e.target.checked)}
            />
            Show Hidden Templates
          </label>
          <button
            className="rounded-xl px-4 py-2 font-bold ring-1 ring-border bg-gradient-to-r from-purple-500/20 to-emerald-500/20 hover:from-purple-500/30 hover:to-emerald-500/30"
            title="Reset Conversations and Leads"
          >
            Reset
          </button>
          <button
            className="rounded-xl px-4 py-2 font-bold ring-1 ring-border bg-gradient-to-r from-indigo-500/20 to-emerald-500/20 hover:from-indigo-500/30 hover:to-emerald-500/30"
            onClick={() => setShowCreateModal(true)}
          >
            + Create New Bot
          </button>
        </div>
      </div>

      {/* Hidden Templates */}
      {showHidden && (
        <div className="mb-8">
          <div className="text-lg font-extrabold mb-3">Hidden Templates</div>
          {bots.filter(b => b.hide).length === 0 ? (
            <div className="rounded-2xl border-[3px] border-black/80 bg-card p-4 shadow-[0_6px_0_rgba(0,0,0,0.8)]">
              No hidden templates right now.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {bots.filter(b => b.hide).map((b) => (
                <div
                  key={b._id}
                  className="rounded-2xl border-[3px] border-black/80 bg-card p-5 shadow-[0_6px_0_rgba(0,0,0,0.8)] transition group flex flex-col"
                >
                  {/* header stripe */}
                  <div className="h-2 rounded-md bg-black mb-4" />
                  <div className={`rounded-2xl p-4 ring-1 ring-border bg-gradient-to-br from-purple-500/20 via-fuchsia-400/20 to-pink-500/20`}>
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 grid place-items-center rounded-2xl bg-white/70 ring-1 ring-border text-2xl">
                        {b.emoji}
                      </div>
                      <div>
                        <h3 className="text-xl font-extrabold tracking-tight">{b.name}</h3>
                        <p className="text-sm font-semibold text-foreground/80">{b.description}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <button
                      className="inline-flex items-center justify-center rounded-lg border px-4 py-2 text-sm font-bold bg-white hover:bg-emerald-50"
                      onClick={() => {
                        handleUpdateBot(b._id, {hide: false});
                      }}
                      aria-label={`Unhide ${b.name}`}
                    >
                      Unhide
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Header metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-6">
        <Stat label="Active Bots" value={String(instances.length)} />
        <Stat label="Conversations (7d)" value="0" />
        <Stat label="Leads / Tickets (7d)" value="0" />
      </div>

      {/* Template catalog */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {bots.filter(b => b.hide == false).map((b) => (
          <div
            key={b._id}
            className="rounded-2xl border-[3px] border-black/80 bg-card p-5 shadow-[0_6px_0_rgba(0,0,0,0.8)] transition group flex flex-col"
          >
            {/* header stripe */}
            <div className="h-2 rounded-md bg-black mb-4" />
            <div className={`rounded-2xl p-4 ring-1 ring-border bg-gradient-to-br from-purple-500/20 via-fuchsia-400/20 to-pink-500/20`}>
              <div className="flex items-center gap-3">
                <div className="relative h-12 w-12 grid place-items-center rounded-2xl bg-white/70 ring-1 ring-border text-2xl">
                  <span>{b.emoji}</span>
                  <button
                    title="Change emoji"
                    onClick={() => setShowEmojiPickerFor({ id: b._id, emoji: b.emoji })}
                    className="absolute -right-2 -bottom-2 opacity-0 group-hover:opacity-100 transition
                               rounded-full border bg-white text-xs px-1.5 py-0.5 shadow ring-1 ring-border"
                    aria-label={`Change emoji for ${b.name}`}
                  >
                    ✏️
                  </button>
                </div>
                <div>
                  <h3 className="text-xl font-extrabold tracking-tight">{b.name}</h3>
                  <p className="text-sm font-semibold text-foreground/80">{b.description}</p>
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <div className="text-sm font-semibold text-foreground/80">Plan:</div>

              <select
                className="ml-auto rounded-lg border bg-card px-3 py-2 text-sm font-bold shadow-sm"
                value={b.plan}
                onChange={(e) => {
                  handleUpdateBot(b._id, {plan: e.target.value});
                }}
                aria-label={`${b.name} plan`}
              >
                <option value="basic">Basic</option>
                <option value="custom">Custom</option>
              </select>

              <button
                className="rounded-xl px-4 py-2 font-bold ring-1 ring-border bg-gradient-to-r from-indigo-500/20 to-emerald-500/20 hover:from-indigo-500/30 hover:to-emerald-500/30"
                onClick={() => (window.location.href = `/admin/builder?bot=${b._id}`)}
                aria-label={`Open ${b.name} in Builder`}
              >
                Open Builder
              </button>
            </div>

            <div className="mt-3 flex items-center gap-2">
              <button
                className="inline-flex items-center justify-center rounded-lg border px-4 py-2 text-sm font-bold bg-white hover:bg-muted/40"
                onClick={() => {
                  const defaultName = `${b.name} (Copy)`;
                  const desired =
                    prompt("Name this new client bot:", defaultName)?.trim() || defaultName;

                  handleDuplicateInstanceFromBot(b._id, b.plan, desired);
                }}
                aria-label={`Duplicate ${b.name}`}
              >
                Duplicate
              </button>

              <button
                className="inline-flex items-center justify-center rounded-lg border px-4 py-2 text-sm font-bold bg-white hover:bg-rose-50"
                onClick={() => {
                  const ok = confirm(
                    b.builtin
                      ? `Hide "${b.name}" (built-in) from your Templates?\n\nThis does NOT delete existing instances and can be restored later.`
                      : `Delete custom template "${b.name}"?\n\nThis removes it from your Templates and deletes its stored graphs.\nExisting instances remain intact.`
                  );
                  if (!ok) return;
                  handleDeleteBot(b._id);
                }}
                aria-label={`Delete ${b.name}`}
                title="Delete (built-ins are hidden; customs are removed)"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* My Bots (instances) */}
      <div className="mt-10">
        <div className="text-lg font-extrabold mb-3">My Bots</div>

        {instances.length === 0 ? (
          <div className="rounded-2xl border-[3px] border-black/80 bg-card p-4 shadow-[0_6px_0_rgba(0,0,0,0.8)]">
            You don't have any instances yet. Click <b>Duplicate</b> on a card above or use{" "}
            <b>Create New Bot</b>.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {instances.map((b) => {
              return (
                <div key={b._id} className="rounded-2xl border-[3px] border-black/80 bg-card overflow-visible flex flex-col shadow-[0_6px_0_rgba(0,0,0,0.8)]">
                  {/* header stripe */}
                  <div className="h-2 rounded-md bg-black mx-4 mt-4 mb-3" />
                  <div className="mx-4 px-4 pb-1 rounded-md ring-1 ring-border bg-gradient-to-br from-purple-500/20 via-fuchsia-400/20 to-pink-500/20">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 grid place-items-center rounded-xl bg-white/70 ring-1 ring-border text-xl">
                        {b.botId.emoji}
                      </div>
                      <div>
                        <div className="text-lg font-extrabold leading-tight">{b.name}</div>
                        <div className="text-sm text-foreground/80">{b.botId.name}</div>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 sm:p-4 pr-2 flex flex-wrap items-center gap-2 sm:gap-3 w-full">
                    <button
                      className="rounded-lg border bg-white px-3 py-1.5 text-sm font-bold hover:bg-muted/40"
                      onClick={() => (window.location.href = `/admin/builder?inst=${b._id}`)}
                    >
                      Open
                    </button>

                    <button
                      className="rounded-lg border bg-white px-3 py-1.5 text-sm font-bold hover:bg-muted/40"
                      onClick={() => (window.location.href = `/admin/nurture?inst=${b._id}`)}
                      title="Open nurture schedule for this client bot"
                    >
                      Nurture
                    </button>

                    <button
                      className="rounded-lg border bg-white px-3 py-1.5 text-sm font-bold hover:bg-muted/40"
                      onClick={() => {
                        const next = prompt("Rename this bot instance:", b.name)?.trim();
                        if (!next) return;
                        handleUpdateInstance(b._id, { name: next });
                      }}
                    >
                      Rename
                    </button>

                    <button
                      className="rounded-lg border bg-white px-3 py-1.5 text-sm font-bold hover:bg-rose-50"
                      onClick={() => {
                        if (!confirm(`Remove "${b.name}" instance? This cannot be undone.`)) return;
                        handleDeleteInstance(b._id);
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create New Bot Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl border-2 border-black p-6 w-full max-w-md shadow-xl">
            <h2 className="text-2xl font-extrabold mb-2">Create New Bot</h2>
            <p className="text-sm text-gray-600 mb-4">
              Name your new bot template and choose an emoji that represents it.
            </p>

            <label className="font-semibold block mb-1">Bot Name</label>
            <input
              className="w-full rounded-lg border px-3 py-2 font-semibold mb-4"
              placeholder="e.g. Receptionist Bot"
              value={newBotName}
              onChange={(e) => setNewBotName(e.target.value)}
            />

            <label className="font-semibold block mb-2">Choose an Emoji</label>
            <div className="flex flex-wrap gap-3 mb-4">
              {["🎯","📅","💬","⏳","☎️","🤖","💼","🌟","🧭"].map((emj) => (
                <button
                  key={emj}
                  type="button"
                  onClick={() => setNewBotEmoji(emj)}
                  className={`text-3xl rounded-xl border-2 p-2 transition-all ${
                    newBotEmoji === emj
                      ? "border-black bg-yellow-100 shadow-md scale-110"
                      : "border-gray-200 hover:border-gray-400"
                  }`}
                >
                  {emj}
                </button>
              ))}
            </div>

            <div className="flex justify-end gap-3">
              <button
                className="px-4 py-2 font-bold ring-1 ring-border bg-white rounded-xl hover:bg-muted/40"
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 font-bold text-white bg-gradient-to-r from-purple-500 via-indigo-500 to-teal-500 rounded-xl shadow-[0_3px_0_#000] active:translate-y-[1px]"
                onClick={() => {
                  const name = newBotName.trim() || "New Template";
                  if (instances.some((b) => b.name === name)) {
                    alert("A template with this name/key already exists. Please choose a different name.");
                    return;
                  }
                  handleCreateBot({ name, emoji: newBotEmoji });
                  setShowCreateModal(false);
                }}
              >
                Create Bot
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inline Emoji Picker */}
      {showEmojiPickerFor && (
        <EmojiPickerModal
          current={showEmojiPickerFor.emoji}
          onClose={() => setShowEmojiPickerFor(null)}
          onPick={(emoji) => handleUpdateBot(showEmojiPickerFor.id, { emoji })}
        />
      )}
    </div>
  );
}

/* ---------- Small Stat component ---------- */
function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border-[3px] border-black/80 bg-card px-4 py-3 shadow-[0_6px_0_rgba(0,0,0,0.8)]">
      <div className="text-xs font-semibold uppercase tracking-wide text-foreground/80">
        {label}
      </div>
      <div className="text-xl font-extrabold leading-tight">{value}</div>
    </div>
  );
}
