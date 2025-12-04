// src/pages/admin/Preview.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import ChatWidget from "@/widgets/ChatWidget";
import BotSelector from "@/components/BotSelector";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { fetchBots, updateBot } from '@/store/botsSlice';
import { fetchInstances, updateInstance } from '@/store/botInstancesSlice';
import { trackEvent } from "@/store/metricsSlice";

type Mode = "popup" | "inline" | "sidebar";
type Pos = "bottom-right" | "bottom-left";
type Shape =
  | "circle"
  | "rounded"
  | "square"
  | "oval"
  | "chat"
  | "badge"
  | "speech"
  | "speech-rounded";
type ImageFit = "cover" | "contain" | "center";
type PanelStyle = "step-by-step" | "conversation";


export default function Preview() {
  const dispatch = useDispatch();
  const bots = useSelector((state: RootState) => state.bots.list);
  const instances = useSelector((state: RootState) => state.instances.list);

  useEffect(() => {
    dispatch(fetchBots());
    dispatch(fetchInstances());
  }, [dispatch]);

  useEffect(() => {
    if (bots.length) setBotId(bots[0]._id);
  }, [bots])

  /* ---------- selection state ---------- */
  const [instId, setInstId] = useState<string>("");
  const [botId, setBotId] = useState<string>("");

  const onInstanceChange = (val) => {
    if (!val || val.kind !== "instance") return;
    setInstId(val.id);
    dispatch(trackEvent({
      type: "preview_select_instance",
      key: `inst:${instId}`,
      ts: Date.now()
    }));
  };

  const onBotChange = (val) => {
    if (!val || val.kind !== "template") return;
    setBotId(val.id);
    dispatch(trackEvent({
      type: "preview_select_bot",
      key: `bot:${botId}`,
      ts: Date.now()
    }));
  };

  const clearInstance = () => {
    if (!instId) return;
    dispatch(trackEvent({
      type: "preview_clear_instance",
      key: `inst:${instId}`,
      ts: Date.now()
    }));
    setInstId("");
  };

  useEffect(() => {
    let b = null;
    if (instId) {
      b = instances.find((m) => m._id == instId)?.branding
    }
    if (botId) {
      b = bots.find((b) => b._id == botId)?.branding 
    }

    setMode(b?.mode || "popup");
    setPos(b?.pos || "bottom-left");
    setSize(b?.size || 56);
    setBgColor(b?.bgColor || "#7aa8ff");
    setImg(b?.img || "");
    setShape(b?.shape || "circle");
    setImageFit(b?.imageFit || "cover");
    setLabel(b?.label || "Chat");
    setLabelColor(b?.labelColor || "#ffffff");
    setHideLabelWhenImage(b?.hideLabelWhenImage || false);
    setPanelStyle(b?.panelStyle || "step-by-step");
    setBorderColor(b?.borderColor || "#000000");
    setBotAvatar(b?.botAvatar || "");
  }, [instId, botId])

  const [mode, setMode] = useState<Mode>("popup");
  const [pos, setPos] = useState<Pos>("bottom-left");
  const [size, setSize] = useState<number>(56);
  const [bgColor, setBgColor] = useState<string>("#7aa8ff");
  const [img, setImg] = useState<string>("");
  const [shape, setShape] = useState<Shape>("circle");
  const [imageFit, setImageFit] = useState<ImageFit>("cover");
  const [label, setLabel] = useState<string>("Chat");
  const [labelColor, setLabelColor] = useState<string>("#ffffff");
  const [hideLabelWhenImage, setHideLabelWhenImage] = useState<boolean>(false);
  const [panelStyle, setPanelStyle] = useState<PanelStyle>("step-by-step");
  const [borderColor, setBorderColor] = useState<string>("#000000");
  const [botAvatar, setBotAvatar] = useState<string>("");

  const [openPanel, setOpenPanel] = useState(false);

  const widgetSrc = useMemo(() => {
    const qp = new URLSearchParams();
    if (instId) qp.set("inst", instId);
    else if (botId) qp.set("bot", botId);

    qp.set("mode", mode);
    qp.set("position", pos);
    qp.set("size", String(size));
    qp.set("shape", shape);
    qp.set("imageFit", imageFit);
    qp.set("panelStyle", panelStyle);

    if (label.trim()) qp.set("label", label.trim());
    if (labelColor.trim()) qp.set("labelColor", labelColor.trim());
    if (bgColor.trim()) qp.set("bgColor", bgColor.trim());
    if (img.trim()) qp.set("img", img.trim());
    if (borderColor.trim()) qp.set("borderColor", borderColor.trim());
    if (botAvatar.trim()) qp.set("botAvatar", botAvatar.trim());

    return `/widget?${qp.toString()}`;
  }, [
    instId,
    botId,
    mode,
    pos,
    size,
    shape,
    imageFit,
    label,
    labelColor,
    bgColor,
    img,
    borderColor,
    botAvatar,
    panelStyle
  ]);

  const apiBase = import.meta.env.VITE_API_BASE_URL || "";
  const embedIframe = `<iframe
      src="${apiBase}${widgetSrc}"
      style="border:0;width:100%;height:560px"
      loading="lazy"
      referrerpolicy="no-referrer-when-downgrade"
    ></iframe>`;

  /* ---------- save/reset ---------- */
  const [savedNote, setSavedNote] = useState<null | string>(null);

  const onSave = async () => {
    const branding = {
      mode,
      pos,
      shape,
      size,
      label,
      labelColor,
      bgColor,
      img,
      imageFit,
      hideLabelWhenImage,
      panelStyle,
      borderColor,
      botAvatar
    }

    try {
      const updateAction = instId 
        ? updateInstance({ id: instId, data: { branding } })
        : botId 
          ? updateBot({ id: botId, data: { branding } })
          : null;

      if (!updateAction) return;
      await dispatch(updateAction).unwrap();
      setSavedNote("Saved successfully!");
    } catch (err: any) {
      setSavedNote("Failed to save changes. Please try again.")
    }
  };

  const onReset = () => {
    setMode("popup");
    setPos("bottom-left" as Pos);
    setSize(56);
    setBgColor("#7aa8ff");
    setImg("");
    setShape("circle" as Shape);
    setImageFit("cover" as ImageFit);
    setLabel("Chat");
    setLabelColor("#ffffff");
    setHideLabelWhenImage(false);
    setSavedNote("Reset");
    setPanelStyle("step-by-step");
    setBorderColor("#000000");
    setBotAvatar("");
  };

  async function onPickBubbleImage(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => setImg(String(reader.result || ""));
    reader.readAsDataURL(f);
    e.currentTarget.value = "";
  }


  async function onPickBotAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => setBotAvatar(String(reader.result || ""));
    reader.readAsDataURL(f);
    e.currentTarget.value = "";
  }

  return (
    <ErrorBoundary>
      <div className="space-y-6 p-6">
        {/* Header Section */}
        <div className="p-5 strong-card">
          <div className="h-2 rounded-md bg-black mb-4" />
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-extrabold">Widget Preview</h1>
              <p className="text-foreground/80">
                Tune the customer-facing widget style and see it live.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                className="rounded-xl px-3.5 py-2 font-bold text-white shadow-[0_3px_0_#000] active:translate-y-[1px]"
                style={{background: "linear-gradient(to bottom right, var(--grad-from), var(--grad-via), var(--grad-to))", color: "var(--grad-text)"}}
                onClick={onSave}
              >
                Save
              </button>
              <button
                className="rounded-xl px-3.5 py-2 font-bold ring-1 ring-border bg-white hover:bg-muted/40"
                onClick={onReset}
              >
                Reset
              </button>
            </div>
          </div>
          {savedNote && (
            <div className="mt-3 text-xs font-bold text-emerald-700">{savedNote}</div>
          )}
        </div>

        {/* Controls Card */}
        <div
          className="strong-card"
          style={{background: "linear-gradient(to bottom right, var(--grad-from), var(--grad-via), var(--grad-to))"}}>
          <div className="h-2 rounded-md bg-black mb-0" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5">
            {/* Instance via BotSelector (optional) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold">Instance (optional)</label>
                <button
                  type="button"
                  className="text-xs font-semibold rounded-md px-2 py-1 border bg-white hover:bg-muted/40"
                  onClick={clearInstance}
                  disabled={!instId}
                  title={instId ? "Clear selected instance" : "No instance selected"}
                  aria-disabled={!instId}
                >
                  Clear
                </button>
              </div>
              <BotSelector
                scope="instance"
                templates={bots}
                instances={instances}
                value={instId}
                onChange={onInstanceChange}
                placeholderOption="— none —"
              />
              <div className="text-xs text-muted-foreground">
                If an instance is chosen, it overrides the Bot.
              </div>
            </div>

            {/* Bot via BotSelector (disabled when instance selected) */}
            <div className="space-y-2">
              <label className="text-sm font-semibold">Bot</label>
              <BotSelector
                scope="template"
                templates={bots}
                instances={instances}
                value={botId}
                onChange={onBotChange}
                disabled={!!instId}
              />
            </div>

            {/* Mode & Position */}
            <div className="space-y-2">
              <label className="text-sm font-semibold">Mode</label>
              <select
                className="w-full rounded-lg border px-3 py-2"
                value={mode}
                onChange={(e) => setMode(e.target.value as Mode)}
              >
                <option value="popup">popup (floating bubble)</option>
                <option value="inline">inline</option>
                <option value="sidebar">sidebar</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">Position</label>
              <select
                className="w-full rounded-lg border px-3 py-2"
                value={pos}
                onChange={(e) => setPos(e.target.value as Pos)}
              >
                <option value="bottom-right">bottom-right</option>
                <option value="bottom-left">bottom-left</option>
              </select>
            </div>

            {/* Size & Shape */}
            <div className="space-y-2">
              <label className="text-sm font-semibold">Size (px)</label>
              <input
                type="number"
                min={40}
                max={120}
                className="w-full rounded-lg border px-3 py-2"
                value={size}
                onChange={(e) => setSize(Number(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">Bubble Shape</label>
              <select
                className="w-full rounded-lg border px-3 py-2"
                value={shape}
                onChange={(e) => setShape(e.target.value as Shape)}
              >
                <option value="circle">circle</option>
                <option value="rounded">rounded</option>
                <option value="square">square</option>
                <option value="oval">oval</option>
                <option value="speech">speech (round)</option>
                <option value="speech-rounded">speech (rounded)</option>
              </select>
            </div>

            {/* Image & Fit (with upload + clear) */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-semibold">Bubble Image (optional)</label>
              <div className="flex items-center gap-3">
                <input
                  className="w-full rounded-lg border px-3 py-2"
                  placeholder="https://example.com/icon.png  — or use Upload"
                  value={img}
                  onChange={(e) => setImg(e.target.value)}
                />
                <label className="rounded-lg border px-3 py-2 font-semibold cursor-pointer bg-white">
                  Upload
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={onPickBubbleImage}
                  />
                </label>
                <button
                  className="rounded-lg border px-3 py-2 font-semibold bg-white"
                  onClick={() => setImg("")}
                  title="Clear bubble image"
                >
                  Clear
                </button>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <input
                  id="hideLabel"
                  type="checkbox"
                  className="h-3 w-3"
                  checked={hideLabelWhenImage}
                  onChange={(e) => setHideLabelWhenImage(e.target.checked)}
                />
                <label htmlFor="hideLabel">Hide label when an image is used</label>
              </div>
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-semibold">Bot Avatar (optional)</label>
              <div className="flex items-center gap-3">
                <input
                  className="w-full rounded-lg border px-3 py-2"
                  placeholder="https://example.com/avatar.png  — or use Upload"
                  value={botAvatar}
                  onChange={(e) => setBotAvatar(e.target.value)}
                />
                <label className="rounded-lg border px-3 py-2 font-semibold cursor-pointer bg-white">
                  Upload
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={onPickBotAvatar}
                  />
                </label>
                <button
                  className="rounded-lg border px-3 py-2 font-semibold bg-white"
                  onClick={() => setBotAvatar("")}
                  title="Clear bot avatar"
                >
                  Clear
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">Image Fit</label>
              <select
                className="w-full rounded-lg border px-3 py-2"
                value={imageFit}
                onChange={(e) => setImageFit(e.target.value as ImageFit)}
              >
                <option value="cover">cover (fill bubble)</option>
                <option value="contain">contain (fit inside)</option>
                <option value="center">center (no scale)</option>
              </select>
            </div>

            {/* Label & Colors */}
            <div className="space-y-2">
              <label className="text-sm font-semibold">Bubble Label</label>
              <input
                className="w-full rounded-lg border px-3 py-2"
                placeholder="Chat"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">Accent Color</label>
              <input
                type="color"
                className="h-10 w-full rounded-lg border"
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">Label Color</label>
              <input
                type="color"
                className="h-10 w-full rounded-lg border"
                value={labelColor}
                onChange={(e) => setLabelColor(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">Border Color</label>
              <input
                type="color"
                className="h-10 w-full rounded-lg border"
                value={borderColor}
                onChange={(e) => setBorderColor(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">Panel Style</label>
              <select
                className="w-full rounded-lg border px-3 py-2"
                value={panelStyle}
                onChange={(e) => setPanelStyle(e.target.value as PanelStyle)}
              >
                <option value="step-by-step">Step by Step</option>
                <option value="conversation">Conversation</option>
              </select>
            </div>

            {/* Open modal + embed url (copy) */}
            <div className="md:col-span-2 flex items-center gap-3">
              <button
                className="rounded-lg border px-3 py-2 font-semibold bg-white"
                onClick={() => { 
                  dispatch(trackEvent({
                    type: "open_widget",
                    key: (instId ? `inst:${instId}` : `bot:${botId}`),
                    meta: { from: "preview_button" },
                    ts: Date.now()
                  }));
                  setOpenPanel(true);
                }}
              >
                Open Preview Modal
              </button>

              <div className="ml-auto text-sm font-semibold">Embed URL:</div>
              <input
                readOnly
                value={widgetSrc}
                className="w-[420px] max-w-full rounded-lg border px-3 py-2 text-xs font-mono"
                onFocus={(e) => e.currentTarget.select()}
                aria-label="Embed URL"
              />
            </div>

            {/* Full iframe code (copyable) */}
            <div className="md:col-span-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold">Embed (iframe)</label>
              </div>
              <textarea
                readOnly
                className="w-full rounded-lg border px-3 py-2 text-xs font-mono"
                rows={4}
                value={embedIframe}
                onFocus={(e) => e.currentTarget.select()}
              />
            </div>
          </div>
        </div>
        
        <div className="relative">
          <ChatWidget
            mode={mode}
            openPanel={openPanel}
            onOpenChange={setOpenPanel}
            botId={instId || botId}
            kind={instId ? "inst" : "bot"}
            position={pos}
            size={size}
            color={bgColor || undefined}
            image={img || undefined}
            shape={shape as any}
            imageFit={imageFit as any}
            label={label}
            labelColor={labelColor}
            hideLabelWhenImage={hideLabelWhenImage}
            panelStyle={panelStyle}
            botAvatarUrl={botAvatar}
            borderColor={borderColor}
          />
        </div>
      </div>
    </ErrorBoundary>
  );
}
