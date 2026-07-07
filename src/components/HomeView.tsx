import React, { useState } from "react";
import {
  ChevronDown,
  Check,
  Copy,
  FileText,
  Mic,
  MicOff,
  Paperclip,
  Plus,
  Send,
  X
} from "lucide-react";
import { ModelId, ModelConfig } from "../types";
import { AnimatePresence, motion } from "motion/react";

interface HomeViewProps {
  promptInput: string;
  setPromptInput: (value: string) => void;
  onSendMessage: (content: string, attachment?: any) => void;
  selectedModel: ModelId;
  onSelectModel: (model: ModelId) => void;
  isListening?: boolean;
  onToggleListen?: () => void;
}

const MODELS: ModelConfig[] = [
  { id: "gemini", name: "Flash", provider: "Nova", badgeColor: "", description: "Fast, everyday answers", simulatedCostPer1kInput: 0.000075, simulatedCostPer1kOutput: 0.0003 },
  { id: "gpt5", name: "GPT-5", provider: "OpenAI", badgeColor: "", description: "Advanced strategy and reasoning", simulatedCostPer1kInput: 0.005, simulatedCostPer1kOutput: 0.015 },
  { id: "gpt4", name: "GPT-4.1", provider: "OpenAI", badgeColor: "", description: "Reliable coding and writing", simulatedCostPer1kInput: 0.01, simulatedCostPer1kOutput: 0.03 },
  { id: "claude", name: "Sonnet", provider: "Claude 3.5", badgeColor: "", description: "Polished writing and analysis", simulatedCostPer1kInput: 0.003, simulatedCostPer1kOutput: 0.015 },
  { id: "deepseek", name: "R1", provider: "DeepSeek", badgeColor: "", description: "Reasoning-focused assistant", simulatedCostPer1kInput: 0.00014, simulatedCostPer1kOutput: 0.00028 },
  { id: "llama", name: "Llama", provider: "Meta 3.3", badgeColor: "", description: "General open model", simulatedCostPer1kInput: 0.0005, simulatedCostPer1kOutput: 0.001 },
  { id: "mistral", name: "Large 2", provider: "Mistral", badgeColor: "", description: "Multilingual work", simulatedCostPer1kInput: 0.002, simulatedCostPer1kOutput: 0.006 },
  { id: "qwen", name: "Qwen Max", provider: "Alibaba", badgeColor: "", description: "Coding and translation", simulatedCostPer1kInput: 0.001, simulatedCostPer1kOutput: 0.003 }
];

export default function HomeView({
  promptInput,
  setPromptInput,
  onSendMessage,
  selectedModel,
  onSelectModel,
  isListening = false,
  onToggleListen
}: HomeViewProps) {
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [attachment, setAttachment] = useState<{ name: string; type: string; size: number; base64?: string } | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isInputCopied, setIsInputCopied] = useState(false);

  const activeModel = MODELS.find(model => model.id === selectedModel) || MODELS[0];

  const handleCopyInput = () => {
    if (promptInput) {
      navigator.clipboard.writeText(promptInput);
      setIsInputCopied(true);
      setTimeout(() => setIsInputCopied(false), 2000);
    }
  };

  const handleSend = () => {
    if (!promptInput.trim() && !attachment) return;
    onSendMessage(promptInput.trim(), attachment);
    setPromptInput("");
    setAttachment(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const readFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64String = (reader.result as string).split(",")[1];
      setAttachment({
        name: file.name,
        type: file.type || "text/plain",
        size: file.size,
        base64: base64String
      });
    };
    reader.readAsDataURL(file);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) readFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) readFile(file);
  };

  return (
    <main
      className={`gemini-stage relative flex h-full min-h-0 flex-1 flex-col overflow-hidden px-5 py-5 transition-all duration-200 md:px-10 ${
        isDragOver ? "ring-2 ring-sky-300" : ""
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
      id="home-view"
    >
      <AnimatePresence>
        {isDragOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-30 flex items-center justify-center bg-sky-100/25 text-sky-700 backdrop-blur-sm"
          >
            <div className="rounded-full bg-white px-5 py-3 text-sm font-medium shadow-lg shadow-sky-200/60">
              Drop file to attach
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <section className="relative z-10 mx-auto flex w-full max-w-[880px] flex-1 flex-col items-center justify-center pb-20">
        <div className="w-full">
          <AnimatePresence>
            {attachment && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="mb-3 flex max-w-xs items-center justify-between rounded-2xl border border-sky-100 bg-white/85 px-3 py-2 text-left shadow-sm"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <FileText size={16} className="shrink-0 text-sky-600" />
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium text-slate-700">{attachment.name}</p>
                    <p className="text-[10px] text-slate-400">{(attachment.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>
                <button
                  onClick={() => setAttachment(null)}
                  className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  title="Remove attachment"
                >
                  <X size={14} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="gemini-prompt-shell relative flex min-h-[80px] w-full items-center gap-4 rounded-full bg-white px-6 shadow-[0_8px_22px_rgba(60,120,180,0.14)] ring-1 ring-slate-100/80">
            <label className="grid h-9 w-9 shrink-0 cursor-pointer place-items-center rounded-full text-black transition hover:bg-slate-100" title="Attach file">
              <input
                type="file"
                onChange={handleFileUpload}
                className="hidden"
                accept=".pdf,.docx,.txt,.md,image/*"
              />
              <Plus size={28} strokeWidth={1.8} />
            </label>

            <textarea
              id="home-prompt-textarea"
              rows={1}
              value={promptInput}
              onChange={(e) => setPromptInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Ask Nova"
              className="max-h-28 min-h-10 flex-1 resize-none bg-transparent py-3 text-[20px] leading-10 text-slate-800 outline-none placeholder:text-[#5f6368]"
            />

            <div className="relative shrink-0">
              <button
                onClick={() => setShowModelDropdown(!showModelDropdown)}
                className="flex items-center gap-2 rounded-full px-3 py-2 text-[17px] font-medium text-[#202124] transition hover:bg-slate-100"
              >
                <span>{activeModel.name}</span>
                <ChevronDown size={18} className={`transition ${showModelDropdown ? "rotate-180" : ""}`} />
              </button>

              <AnimatePresence>
                {showModelDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.98 }}
                    className="absolute right-0 top-11 z-40 max-h-[260px] w-56 overflow-y-auto rounded-2xl border border-slate-100 bg-white p-1.5 text-left shadow-2xl shadow-slate-200/70"
                  >
                    {MODELS.map(model => (
                      <button
                        key={model.id}
                        onClick={() => {
                          onSelectModel(model.id);
                          setShowModelDropdown(false);
                        }}
                        className={`w-full rounded-xl px-2.5 py-2 text-left transition ${
                          selectedModel === model.id
                            ? "bg-sky-50 text-sky-900"
                            : "text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <span className="block text-[13px] font-semibold leading-tight">{model.name}</span>
                        <span className="block text-[11px] leading-snug text-slate-500">{model.provider} - {model.description}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {onToggleListen && (
              <button
                onClick={onToggleListen}
                title={isListening ? "Stop listening" : "Voice input"}
                className={`grid h-10 w-10 shrink-0 place-items-center rounded-full transition ${
                  isListening
                    ? "bg-red-50 text-red-500"
                    : "text-black hover:bg-slate-100"
                }`}
              >
                {isListening ? <MicOff size={22} /> : <Mic size={22} />}
              </button>
            )}

            <button
              onClick={handleSend}
              disabled={!promptInput.trim() && !attachment}
              className={`grid h-10 w-10 shrink-0 place-items-center rounded-full transition ${
                promptInput.trim() || attachment
                  ? "bg-sky-600 text-white hover:bg-sky-700"
                  : "hidden"
              }`}
              title="Send"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
