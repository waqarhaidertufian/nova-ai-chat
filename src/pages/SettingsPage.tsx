import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Settings as SettingsIcon, User, Bell, Shield, Palette, Keyboard, Globe, Save, RotateCcw } from 'lucide-react';
import { useStore } from '../store/useStore';

export default function SettingsPage() {
  const theme = useStore((state) => state.theme);
  const setTheme = useStore((state) => state.setTheme);
  const fontSize = useStore((state) => state.fontSize);
  const setFontSize = useStore((state) => state.setFontSize);
  const selectedLanguage = useStore((state) => state.selectedLanguage);
  const setSelectedLanguage = useStore((state) => state.setSelectedLanguage);
  const streamingEnabled = useStore((state) => state.streamingEnabled);
  const setStreamingEnabled = useStore((state) => state.setStreamingEnabled);
  const systemPrompt = useStore((state) => state.systemPrompt);
  const setSystemPrompt = useStore((state) => state.setSystemPrompt);
  const temperature = useStore((state) => state.temperature);
  const setTemperature = useStore((state) => state.setTemperature);
  const maxTokens = useStore((state) => state.maxTokens);
  const setMaxTokens = useStore((state) => state.setMaxTokens);
  const topP = useStore((state) => state.topP);
  const setTopP = useStore((state) => state.setTopP);

  const [activeTab, setActiveTab] = useState('general');
  const [hasChanges, setHasChanges] = useState(false);

  const tabs = [
    { id: 'general', label: 'General', icon: SettingsIcon },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'model', label: 'Model Settings', icon: Globe },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy & Security', icon: Shield },
    { id: 'keyboard', label: 'Keyboard Shortcuts', icon: Keyboard },
  ];

  const handleReset = () => {
    setTheme('light');
    setFontSize('md');
    setSelectedLanguage('English');
    setStreamingEnabled(true);
    setTemperature(0.7);
    setMaxTokens(2048);
    setTopP(0.9);
    setHasChanges(false);
  };

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 border-r border-gray-200 bg-white flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">Settings</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-50 text-blue-700'
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-bold text-gray-900">
              {tabs.find(t => t.id === activeTab)?.label}
            </h1>
            {hasChanges && (
              <div className="flex gap-2">
                <button
                  onClick={handleReset}
                  className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset
                </button>
                <button
                  onClick={() => setHasChanges(false)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  Save Changes
                </button>
              </div>
            )}
          </div>

          {/* General Settings */}
          {activeTab === 'general' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Language</h3>
                <select
                  value={selectedLanguage}
                  onChange={(e) => {
                    setSelectedLanguage(e.target.value);
                    setHasChanges(true);
                  }}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="English">English</option>
                  <option value="Spanish">Spanish</option>
                  <option value="French">French</option>
                  <option value="German">German</option>
                  <option value="Chinese">Chinese</option>
                  <option value="Japanese">Japanese</option>
                </select>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Streaming</h3>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Enable streaming responses</p>
                    <p className="text-sm text-gray-500">Show responses as they are generated</p>
                  </div>
                  <button
                    onClick={() => {
                      setStreamingEnabled(!streamingEnabled);
                      setHasChanges(true);
                    }}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      streamingEnabled ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                        streamingEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Appearance Settings */}
          {activeTab === 'appearance' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Theme</h3>
                <div className="grid grid-cols-3 gap-4">
                  {['light', 'dark'].map((t) => (
                    <button
                      key={t}
                      onClick={() => {
                        setTheme(t as 'light' | 'dark');
                        setHasChanges(true);
                      }}
                      className={`p-4 rounded-lg border-2 transition-colors ${
                        theme === t
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className={`w-full h-8 rounded mb-2 ${t === 'light' ? 'bg-white border' : 'bg-gray-900'}`} />
                      <span className="text-sm font-medium capitalize">{t}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Font Size</h3>
                <div className="flex gap-2">
                  {(['sm', 'md', 'lg'] as const).map((size) => (
                    <button
                      key={size}
                      onClick={() => {
                        setFontSize(size);
                        setHasChanges(true);
                      }}
                      className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                        fontSize === size
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {size === 'sm' ? 'Small' : size === 'md' ? 'Medium' : 'Large'}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Model Settings */}
          {activeTab === 'model' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">System Prompt</h3>
                <textarea
                  value={systemPrompt}
                  onChange={(e) => {
                    setSystemPrompt(e.target.value);
                    setHasChanges(true);
                  }}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Enter system prompt..."
                />
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Temperature</h3>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => {
                    setTemperature(parseFloat(e.target.value));
                    setHasChanges(true);
                  }}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-gray-500 mt-2">
                  <span>0.0 (Focused)</span>
                  <span>{temperature}</span>
                  <span>1.0 (Creative)</span>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Max Tokens</h3>
                <input
                  type="number"
                  value={maxTokens}
                  onChange={(e) => {
                    setMaxTokens(parseInt(e.target.value));
                    setHasChanges(true);
                  }}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="1"
                  max="8192"
                />
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Top P</h3>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={topP}
                  onChange={(e) => {
                    setTopP(parseFloat(e.target.value));
                    setHasChanges(true);
                  }}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-gray-500 mt-2">
                  <span>0.0</span>
                  <span>{topP}</span>
                  <span>1.0</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Other tabs - placeholder */}
          {['notifications', 'privacy', 'keyboard'].includes(activeTab) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl border border-gray-200 p-6 text-center text-gray-500"
            >
              <p>Settings for this section are coming soon.</p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
