import { supabase } from './supabase';

export interface ChatSession {
  id: string;
  user_id: string;
  title: string;
  model: string;
  system_prompt: string | null;
  created_at: string;
  updated_at: string;
  is_pinned: boolean;
  is_favorite: boolean;
}

export interface Message {
  id: string;
  session_id: string;
  role: 'user' | 'assistant';
  content: string;
  attachment: any;
  timestamp: string;
  stats: any;
  created_at: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

// Profile functions
export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data;
}

export async function updateProfile(userId: string, updates: Partial<Profile>): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Chat Session functions
export async function getChatSessions(userId: string): Promise<ChatSession[]> {
  const { data, error } = await supabase
    .from('chat_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getChatSession(sessionId: string): Promise<ChatSession | null> {
  const { data, error } = await supabase
    .from('chat_sessions')
    .select('*')
    .eq('id', sessionId)
    .single();

  if (error) throw error;
  return data;
}

export async function createChatSession(session: Omit<ChatSession, 'id' | 'created_at' | 'updated_at'>): Promise<ChatSession> {
  const { data, error } = await supabase
    .from('chat_sessions')
    .insert(session)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateChatSession(sessionId: string, updates: Partial<ChatSession>): Promise<ChatSession> {
  const { data, error } = await supabase
    .from('chat_sessions')
    .update(updates)
    .eq('id', sessionId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteChatSession(sessionId: string): Promise<void> {
  const { error } = await supabase
    .from('chat_sessions')
    .delete()
    .eq('id', sessionId);

  if (error) throw error;
}

// Message functions
export async function getMessages(sessionId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function createMessage(message: Omit<Message, 'id' | 'created_at'>): Promise<Message> {
  const { data, error } = await supabase
    .from('messages')
    .insert(message)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteMessage(messageId: string): Promise<void> {
  const { error } = await supabase
    .from('messages')
    .delete()
    .eq('id', messageId);

  if (error) throw error;
}

// Subscription functions
export async function getSubscription(userId: string) {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function createSubscription(subscription: any) {
  const { data, error } = await supabase
    .from('subscriptions')
    .insert(subscription)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateSubscription(subscriptionId: string, updates: any) {
  const { data, error } = await supabase
    .from('subscriptions')
    .update(updates)
    .eq('id', subscriptionId)
    .select()
    .single();

  if (error) throw error;
  return data;
}
