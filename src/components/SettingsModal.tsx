import React, { useState } from "react";
import { X, Sparkles, Sliders, Settings, BookOpen, User, HelpCircle, Check } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { SystemPromptPreset } from "../types";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  systemPrompt: string;
  onChangeSystemPrompt: (prompt: string) => void;
  temperature: number;
  onChangeTemperature: (temp: number) => void;
  maxTokens: number;
  onChangeMaxTokens: (tokens: number) => void;
  topP: number;
  onChangeTopP: (p: number) => void;
  streamingEnabled: boolean;
  onToggleStreaming: (enabled: boolean) => void;
  fontSize: "sm" | "md" | "lg";
  onChangeFontSize: (size: "sm" | "md" | "lg") => void;
  selectedLanguage: string;
  onChangeLanguage: (lang: string) => void;
  user?: any;
  onLogout?: () => void;
}

const PRESETS: SystemPromptPreset[] = [
  { id: "1", name: "Expert Software Engineer", prompt: "You are an expert staff software engineer. Provide extremely precise, modern, type-safe, and highly optimized code implementations. Avoid unnecessary hand-waving or chatty talk. Always include documentation and clean code commentary.", avatar: "💻" },
  { id: "2", name: "Personal Fitness Coach", prompt: "You are an elite personal fitness coach and sports nutritionist. Design tailored, progressive, and scientifically backed workout plans, recovery drills, and macro-balanced diets designed for maximum performance.", avatar: "🏃‍♂️" },
  { id: "3", name: "Curated Travel Planner", prompt: "You are an expert bespoke travel planner and local guide. Provide comprehensive, culturally rich, and highly practical travel itineraries, hidden landmarks, scheduling advice, and dining locations.", avatar: "✈️" },
  { id: "4", name: "Creative Writer & Editor", prompt: "You are a master creative content editor. Enhance raw text flow, sentence variety, vocabulary, and persuasive clarity. Structure thoughts beautifully while maintaining a distinct human essence.", avatar: "✍️" },
];

export default function SettingsModal({
  isOpen,
  onClose,
  systemPrompt,
  onChangeSystemPrompt,
  temperature,
  onChangeTemperature,
  maxTokens,
  onChangeMaxTokens,
  topP,
  onChangeTopP,
  streamingEnabled,
  onToggleStreaming,
  fontSize,
  onChangeFontSize,
  selectedLanguage,
  onChangeLanguage,
  user,
  onLogout,
}: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<"general" | "llm" | "presets" | "account">("general");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      />

      {/* Modal Card */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-2xl rounded-3xl border border-gray-100 bg-white shadow-2xl overflow-hidden flex flex-col md:flex-row h-[500px]"
        id="settings-modal"
      >
        {/* Left Nav Pane */}
        <div className="w-full md:w-1/3 bg-gray-50/70 p-5 border-r border-gray-100 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
                <Settings size={16} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-800 font-display">System Settings</h3>
                <p className="text-[10px] text-gray-400 leading-none mt-0.5">Configure AI behaviors</p>
              </div>
            </div>

            <div className="space-y-1 pt-4">
              <button 
                onClick={() => setActiveTab("general")}
                className={`w-full text-left px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${activeTab === 'general' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/15' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <Sliders size={14} />
                <span>General Config</span>
              </button>
              <button 
                onClick={() => setActiveTab("presets")}
                className={`w-full text-left px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${activeTab === 'presets' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/15' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <BookOpen size={14} />
                <span>Prompt Presets</span>
              </button>
              <button 
                onClick={() => setActiveTab("llm")}
                className={`w-full text-left px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${activeTab === 'llm' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/15' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <Sparkles size={14} />
                <span>Hyperparameters</span>
              </button>
              <button 
                onClick={() => setActiveTab("account")}
                className={`w-full text-left px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${activeTab === 'account' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/15' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <User size={14} />
                <span>Account</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Content Pane */}
        <div className="flex-1 p-6 flex flex-col justify-between overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-50 pb-3 mb-4">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider font-mono">
              {activeTab === "general" && "General Customization"}
              {activeTab === "presets" && "Choose Agent System Persona"}
              {activeTab === "llm" && "LLM Parameter Optimization"}
              {activeTab === "account" && "Account Settings"}
            </span>
            <button 
              onClick={onClose}
              className="p-1 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          {/* Main settings tabs content */}
          <div className="flex-1 space-y-4">
            {activeTab === "general" && (
              <div className="space-y-4">
                {/* Language Select */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700">Default Language</label>
                  <select 
                    value={selectedLanguage}
                    onChange={(e) => onChangeLanguage(e.target.value)}
                    className="w-full text-xs rounded-xl border border-gray-100 bg-white text-gray-800 p-2.5 outline-none focus:border-blue-500"
                  >
                    <option value="English">English (United States)</option>
                    <option value="Spanish">Spanish (Español)</option>
                    <option value="French">French (Français)</option>
                    <option value="German">German (Deutsch)</option>
                    <option value="Chinese">Chinese (中文)</option>
                  </select>
                </div>

                {/* Font Size Selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700">Chat Font Size</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["sm", "md", "lg"] as const).map(sz => (
                      <button
                        key={sz}
                        onClick={() => onChangeFontSize(sz)}
                        className={`py-2 px-3 rounded-xl border text-xs font-semibold capitalize transition-all cursor-pointer ${fontSize === sz ? 'bg-blue-50 text-blue-600 border-blue-500/30' : 'border-gray-100 hover:bg-gray-50 text-gray-600'}`}
                      >
                        {sz === "sm" && "Small (14px)"}
                        {sz === "md" && "Standard (16px)"}
                        {sz === "lg" && "Comfortable (18px)"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Simulated Streaming Toggle */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl border border-gray-100 bg-gray-50/40">
                  <div>
                    <h4 className="text-xs font-bold text-gray-800">Simulate Response Streaming</h4>
                    <p className="text-[10px] text-gray-400 pr-4 leading-normal mt-0.5">Increases immersion by rendering generative output word-by-word with animation.</p>
                  </div>
                  <button
                    onClick={() => onToggleStreaming(!streamingEnabled)}
                    className={`w-11 h-6 rounded-full p-1 transition-colors cursor-pointer ${streamingEnabled ? 'bg-blue-600' : 'bg-gray-300'}`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${streamingEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>
              </div>
            )}

            {activeTab === "presets" && (
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {PRESETS.map(preset => (
                  <button
                    key={preset.id}
                    onClick={() => onChangeSystemPrompt(preset.prompt)}
                    className={`w-full text-left p-3 rounded-2xl border transition-all flex items-start gap-3 cursor-pointer ${systemPrompt === preset.prompt ? 'bg-blue-50/70 border-blue-500/40' : 'border-gray-150 hover:bg-gray-50'}`}
                  >
                    <span className="text-2xl mt-0.5">{preset.avatar}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-gray-800">{preset.name}</h4>
                        {systemPrompt === preset.prompt && (
                          <span className="p-0.5 rounded-full bg-blue-500 text-white">
                            <Check size={10} />
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-400 line-clamp-2 mt-0.5 leading-relaxed">{preset.prompt}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {activeTab === "llm" && (
              <div className="space-y-4">
                {/* Custom System Prompt Textarea */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700">Custom System Instruction</label>
                  <textarea
                    rows={3}
                    value={systemPrompt}
                    onChange={(e) => onChangeSystemPrompt(e.target.value)}
                    placeholder="E.g., You are a friendly, concise assistant specializing in finance..."
                    className="w-full text-xs rounded-xl border border-gray-100 bg-white text-gray-800 p-2.5 outline-none focus:border-blue-500 resize-none font-sans"
                  />
                </div>

                {/* Hyperparameter: Temperature */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-gray-700">Temperature: <span className="font-mono text-blue-500">{temperature.toFixed(2)}</span></label>
                    <span className="text-[10px] text-gray-400">Low values are predictable, high are creative</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="1.5" 
                    step="0.05"
                    value={temperature}
                    onChange={(e) => onChangeTemperature(Number(e.target.value))}
                    className="w-full accent-blue-600 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Hyperparameter: Max Tokens */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700">Max Tokens</label>
                    <input 
                      type="number" 
                      min="256" 
                      max="8192" 
                      step="256"
                      value={maxTokens}
                      onChange={(e) => onChangeMaxTokens(Number(e.target.value))}
                      className="w-full text-xs rounded-xl border border-gray-100 bg-white text-gray-800 p-2 outline-none focus:border-blue-500 font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700">Top P</label>
                    <input 
                      type="number" 
                      min="0.1" 
                      max="1.0" 
                      step="0.05"
                      value={topP}
                      onChange={(e) => onChangeTopP(Number(e.target.value))}
                      className="w-full text-xs rounded-xl border border-gray-100 bg-white text-gray-800 p-2 outline-none focus:border-blue-500 font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === "account" && (
              <div className="space-y-4">
                {user ? (
                  <>
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-100">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                          {user?.email?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Signed in as</p>
                          <p className="text-sm font-semibold text-gray-800 truncate">{user?.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-semibold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">Free Plan</span>
                      </div>
                    </div>

                    <button
                      onClick={onLogout}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold text-xs cursor-pointer hover:opacity-90 transition-opacity shadow-lg shadow-blue-500/20"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 text-center">
                    <p className="text-sm text-gray-600 mb-3">Sign in to access your account</p>
                    <button className="py-2 px-4 rounded-xl bg-blue-600 text-white font-semibold text-xs cursor-pointer hover:bg-blue-700 transition-colors">
                      Sign In
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer Action */}
          <div className="border-t border-gray-50 pt-4 mt-4 flex justify-end">
            <button 
              onClick={onClose}
              className="py-2.5 px-6 rounded-xl bg-gray-950 text-white font-semibold text-xs cursor-pointer hover:bg-opacity-90 shadow-md transition-all"
            >
              Apply and Close
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
