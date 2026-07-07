import type { Request, Response } from "express";

export interface Notebook {
  id: string;
  title: string;
  content: string;
  folderId?: string;
  createdAt: string;
  updatedAt: string;
  isPinned?: boolean;
  userId?: string;
}

// In-memory storage (replace with database in production)
let notebooks: Notebook[] = [];

// GET /api/notebooks - Get all notebooks
export async function GET(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.query.userId as string;
    
    if (userId) {
      const userNotebooks = notebooks.filter(nb => nb.userId === userId);
      res.json(userNotebooks);
    } else {
      res.json(notebooks);
    }
  } catch (error) {
    console.error("Error fetching notebooks:", error);
    res.status(500).json({ error: "Failed to fetch notebooks" });
  }
}

// POST /api/notebooks - Create a new notebook
export async function POST(req: Request, res: Response): Promise<void> {
  try {
    const body = req.body;
    
    const newNotebook: Notebook = {
      id: body.id || `notebook_${Date.now()}`,
      title: body.title || "Untitled Notebook",
      content: body.content || "",
      folderId: body.folderId,
      isPinned: body.isPinned || false,
      createdAt: body.createdAt || new Date().toISOString(),
      updatedAt: body.updatedAt || new Date().toISOString(),
      ...(body.userId && { userId: body.userId }),
    };
    
    notebooks.unshift(newNotebook);
    res.status(201).json(newNotebook);
  } catch (error) {
    console.error("Error creating notebook:", error);
    res.status(500).json({ error: "Failed to create notebook" });
  }
}
