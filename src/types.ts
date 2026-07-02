export type ModelId = 
  | "gemini" 
  | "gpt5" 
  | "gpt4" 
  | "claude" 
  | "deepseek" 
  | "llama" 
  | "mistral" 
  | "qwen";

export interface ModelConfig {
  id: ModelId;
  name: string;
  provider: string;
  badgeColor: string;
  description: string;
  simulatedCostPer1kInput: number;
  simulatedCostPer1kOutput: number;
}

export interface FileAttachment {
  name: string;
  size: number;
  mimeType: string;
  base64Data?: string; // Standard base64 data for API processing
}

export interface ChatStats {
  responseTimeMs?: number;
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  totalCost?: number;
  isSimulated?: boolean;
  simulationReason?: string;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  attachment?: FileAttachment;
  stats?: ChatStats;
  isPinned?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  model: ModelId;
  systemPrompt: string;
  messages: Message[];
  isPinned: boolean;
  isFavorite?: boolean;
  createdAt: string;
  updatedAt: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
}

export interface PromptTemplate {
  id: string;
  title: string;
  category: "Code" | "Content" | "Creative" | "Business" | "Utility";
  description: string;
  promptText: string;
  iconName: string;
}

export interface SystemPromptPreset {
  id: string;
  name: string;
  prompt: string;
  avatar: string;
}
