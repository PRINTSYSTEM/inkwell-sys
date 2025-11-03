import { Design, DesignProgressImage, DesignComment } from '@/types';
import { mockDesigns, mockProgressImages, mockComments } from '../data/designs';

export class DesignService {
  private designs: Design[] = [...mockDesigns];

  // Get all designs
  async getAll(): Promise<Design[]> {
    await this.delay(300);
    return this.designs.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  // Get designs assigned to user
  async getMyDesigns(userId: string): Promise<Design[]> {
    await this.delay(300);
    return this.designs
      .filter(design => design.assignedTo === userId)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  // Get design by ID
  async getById(id: string): Promise<Design | null> {
    await this.delay(200);
    return this.designs.find(design => design.id === id) || null;
  }

  // Update design status
  async updateStatus(id: string, status: Design['status']): Promise<Design> {
    await this.delay(300);
    const index = this.designs.findIndex(design => design.id === id);
    if (index === -1) throw new Error('Design not found');
    
    this.designs[index] = {
      ...this.designs[index],
      status,
      updatedAt: new Date().toISOString(),
      ...(status === 'approved' ? { completedAt: new Date().toISOString() } : {})
    };
    
    return this.designs[index];
  }

  // Update entire design (partial) - allows updating fields like designCode
  async updateDesign(id: string, patch: Partial<Design>): Promise<Design> {
    await this.delay(300);
    const index = this.designs.findIndex(design => design.id === id);
    if (index === -1) throw new Error('Design not found');

    this.designs[index] = {
      ...this.designs[index],
      ...patch,
      updatedAt: new Date().toISOString(),
    };

    return this.designs[index];
  }

  // Upload progress image
  async uploadProgressImage(designId: string, imageData: Omit<DesignProgressImage, 'id' | 'designId'>): Promise<DesignProgressImage> {
    await this.delay(500);
    
    const newImage: DesignProgressImage = {
      id: Math.random().toString(36).substring(2, 15),
      designId,
      ...imageData,
    };

    const designIndex = this.designs.findIndex(d => d.id === designId);
    if (designIndex !== -1) {
      this.designs[designIndex].progressImages.push(newImage);
      this.designs[designIndex].updatedAt = new Date().toISOString();
    }

    return newImage;
  }

  // Add comment
  async addComment(designId: string, commentData: Omit<DesignComment, 'id' | 'designId'>): Promise<DesignComment> {
    await this.delay(300);
    
    const newComment: DesignComment = {
      id: Math.random().toString(36).substring(2, 15),
      designId,
      ...commentData,
    };

    const designIndex = this.designs.findIndex(d => d.id === designId);
    if (designIndex !== -1) {
      this.designs[designIndex].comments.push(newComment);
      this.designs[designIndex].updatedAt = new Date().toISOString();
    }

    return newComment;
  }

  // Utility function to simulate API delay
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const designService = new DesignService();