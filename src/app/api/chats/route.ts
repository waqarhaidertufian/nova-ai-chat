import type { Request, Response } from "express";
import { ChatSession, Message } from "../../../types.js";

// In-memory storage (replace with database in production)
let chats: ChatSession[] = [];

// GET /api/chats - Get all chats
export async function GET(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.query.userId as string;
    
    if (userId) {
      // Filter by user if userId is provided
      const userChats = chats.filter(chat => (chat as any).userId === userId);
      res.json(userChats);
    } else {
      res.json(chats);
    }
  } catch (error) {
    console.error("Error fetching chats:", error);
    res.status(500).json({ error: "Failed to fetch chats" });
  }
}

// POST /api/chats - Create a new chat
export async function POST(req: Request, res: Response): Promise<void> {
  try {
    const body = req.body;
    
    const newChat: ChatSession = {
      id: body.id || `chat_${Date.now()}`,
      title: body.title || "Untitled Chat",
      model: body.model || "gemini",
      systemPrompt: body.systemPrompt || "",
      messages: body.messages || [],
      isPinned: body.isPinned || false,
      isFavorite: body.isFavorite || false,
      createdAt: body.createdAt || new Date().toISOString(),
      updatedAt: body.updatedAt || new Date().toISOString(),
      temperature: body.temperature,
      maxTokens: body.maxTokens,
      topP: body.topP,
      ...(body.userId && { userId: body.userId }),
    };
    
    chats.unshift(newChat);
    res.status(201).json(newChat);
  } catch (error) {
    console.error("Error creating chat:", error);
    res.status(500).json({ error: "Failed to create chat" });
  }
}
