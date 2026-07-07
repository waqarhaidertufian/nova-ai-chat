import type { Request, Response } from "express";
import { ChatSession } from "../../../../types.js";

// In-memory storage (shared with the main chats route)
// In production, this would be a database
let chats: ChatSession[] = [];

// Helper to sync with the main chats storage
function syncChats(allChats: ChatSession[]) {
  chats = allChats;
}

// PUT /api/chats/:id - Update a chat
export async function PUT(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const chatIndex = chats.findIndex(chat => chat.id === id);
    
    if (chatIndex === -1) {
      res.status(404).json({ error: "Chat not found" });
      return;
    }
    
    const updatedChat: ChatSession = {
      ...chats[chatIndex],
      ...updates,
      id, // Ensure ID cannot be changed
      updatedAt: new Date().toISOString(),
    };
    
    chats[chatIndex] = updatedChat;
    res.json(updatedChat);
  } catch (error) {
    console.error("Error updating chat:", error);
    res.status(500).json({ error: "Failed to update chat" });
  }
}

// DELETE /api/chats/:id - Delete a chat
export async function DELETE(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    
    const chatIndex = chats.findIndex(chat => chat.id === id);
    
    if (chatIndex === -1) {
      res.status(404).json({ error: "Chat not found" });
      return;
    }
    
    chats.splice(chatIndex, 1);
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting chat:", error);
    res.status(500).json({ error: "Failed to delete chat" });
  }
}

// Export sync function for the main route to use
export { syncChats };
