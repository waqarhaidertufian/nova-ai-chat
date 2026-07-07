import type { Request, Response } from "express";

export interface StoredImage {
  id: string;
  url: string;
  prompt: string;
  createdAt: string;
  sessionId?: string;
  userId?: string;
}

// In-memory storage
let images: StoredImage[] = [];

// DELETE /api/images/:id - Delete an image
export async function DELETE(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    
    const imageIndex = images.findIndex(img => img.id === id);
    
    if (imageIndex === -1) {
      res.status(404).json({ error: "Image not found" });
      return;
    }
    
    images.splice(imageIndex, 1);
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting image:", error);
    res.status(500).json({ error: "Failed to delete image" });
  }
}
