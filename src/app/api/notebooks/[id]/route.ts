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

// In-memory storage
let notebooks: Notebook[] = [];

// PUT /api/notebooks/:id - Update a notebook
export async function PUT(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const notebookIndex = notebooks.findIndex(nb => nb.id === id);
    
    if (notebookIndex === -1) {
      res.status(404).json({ error: "Notebook not found" });
      return;
    }
    
    const updatedNotebook: Notebook = {
      ...notebooks[notebookIndex],
      ...updates,
      id, // Ensure ID cannot be changed
      updatedAt: new Date().toISOString(),
    };
    
    notebooks[notebookIndex] = updatedNotebook;
    res.json(updatedNotebook);
  } catch (error) {
    console.error("Error updating notebook:", error);
    res.status(500).json({ error: "Failed to update notebook" });
  }
}

// DELETE /api/notebooks/:id - Delete a notebook
export async function DELETE(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    
    const notebookIndex = notebooks.findIndex(nb => nb.id === id);
    
    if (notebookIndex === -1) {
      res.status(404).json({ error: "Notebook not found" });
      return;
    }
    
    notebooks.splice(notebookIndex, 1);
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting notebook:", error);
    res.status(500).json({ error: "Failed to delete notebook" });
  }
}
