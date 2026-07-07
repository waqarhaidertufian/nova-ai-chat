import type { Request, Response } from "express";

export interface StoredImage {
  id: string;
  url: string;
  prompt: string;
  createdAt: string;
  sessionId?: string;
  userId?: string;
}

// In-memory storage (replace with database in production)
let images: StoredImage[] = [];

// GET /api/images - Get all images
export async function GET(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.query.userId as string;
    const sessionId = req.query.sessionId as string;
    
    let filteredImages = images;
    
    if (userId) {
      filteredImages = filteredImages.filter(img => img.userId === userId);
    }
    
    if (sessionId) {
      filteredImages = filteredImages.filter(img => img.sessionId === sessionId);
    }
    
    res.json(filteredImages);
  } catch (error) {
    console.error("Error fetching images:", error);
    res.status(500).json({ error: "Failed to fetch images" });
  }
}

// POST /api/images - Create a new image
export async function POST(req: Request, res: Response): Promise<void> {
  try {
    const body = req.body;
    
    const newImage: StoredImage = {
      id: body.id || `image_${Date.now()}`,
      url: body.url,
      prompt: body.prompt || "",
      sessionId: body.sessionId,
      createdAt: body.createdAt || new Date().toISOString(),
      ...(body.userId && { userId: body.userId }),
    };
    
    images.unshift(newImage);
    res.status(201).json(newImage);
  } catch (error) {
    console.error("Error creating image:", error);
    res.status(500).json({ error: "Failed to create image" });
  }
}
