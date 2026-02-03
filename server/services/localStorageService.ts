import { mkdir, writeFile, readFile, unlink } from 'fs/promises';
import { join } from 'path';
import { nanoid } from 'nanoid';

// Configuration from environment
const IMAGE_STORAGE_PATH = process.env.IMAGE_STORAGE_PATH || './uploads';
const ALLOWED_FILE_TYPES = (process.env.ALLOWED_FILE_TYPES || '.jpg,.jpeg,.png,.webp').split(',');
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '10485760'); // 10MB default

interface StoredFile {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  createdAt: Date;
}

class LocalStorageService {
  private initialized = false;

  async initialize() {
    if (this.initialized) return;
    
    try {
      await mkdir(IMAGE_STORAGE_PATH, { recursive: true });
      this.initialized = true;
      console.log('[LocalStorage] Initialized at:', IMAGE_STORAGE_PATH);
    } catch (error) {
      console.error('[LocalStorage] Failed to initialize:', error);
      throw error;
    }
  }

  async saveFile(buffer: Buffer, originalName: string, mimeType: string): Promise<StoredFile> {
    await this.initialize();
    
    // Validate file type
    const extension = originalName.split('.').pop()?.toLowerCase();
    if (!extension || !ALLOWED_FILE_TYPES.includes('.' + extension)) {
      throw new Error(`File type .${extension} not allowed. Allowed types: ${ALLOWED_FILE_TYPES.join(', ')}`);
    }

    // Validate file size
    if (buffer.length > MAX_FILE_SIZE) {
      throw new Error(`File too large. Maximum size: ${MAX_FILE_SIZE} bytes`);
    }

    const fileId = nanoid();
    const filename = `${fileId}.${extension}`;
    const filePath = join(IMAGE_STORAGE_PATH, filename);

    try {
      await writeFile(filePath, buffer);
      
      const storedFile: StoredFile = {
        id: fileId,
        filename,
        originalName,
        mimeType,
        size: buffer.length,
        path: filePath,
        createdAt: new Date()
      };

      // Save metadata
      const metadataPath = join(IMAGE_STORAGE_PATH, `${fileId}.json`);
      await writeFile(metadataPath, JSON.stringify(storedFile));

      console.log(`[LocalStorage] File saved: ${filename} (${buffer.length} bytes)`);
      return storedFile;
    } catch (error) {
      console.error('[LocalStorage] Failed to save file:', error);
      throw error;
    }
  }

  async getFile(fileId: string): Promise<{ buffer: Buffer; metadata: StoredFile } | null> {
    await this.initialize();
    
    try {
      const metadataPath = join(IMAGE_STORAGE_PATH, `${fileId}.json`);
      const metadataBuffer = await readFile(metadataPath, 'utf-8');
      const metadata: StoredFile = JSON.parse(metadataBuffer);

      const filePath = join(IMAGE_STORAGE_PATH, metadata.filename);
      const buffer = await readFile(filePath);

      return { buffer, metadata };
    } catch (error) {
      console.error(`[LocalStorage] Failed to retrieve file ${fileId}:`, error);
      return null;
    }
  }

  async deleteFile(fileId: string): Promise<boolean> {
    await this.initialize();
    
    try {
      const metadataPath = join(IMAGE_STORAGE_PATH, `${fileId}.json`);
      const metadataBuffer = await readFile(metadataPath, 'utf-8');
      const metadata: StoredFile = JSON.parse(metadataBuffer);

      const filePath = join(IMAGE_STORAGE_PATH, metadata.filename);
      
      await unlink(filePath);
      await unlink(metadataPath);

      console.log(`[LocalStorage] File deleted: ${metadata.filename}`);
      return true;
    } catch (error) {
      console.error(`[LocalStorage] Failed to delete file ${fileId}:`, error);
      return false;
    }
  }

  async listFiles(): Promise<StoredFile[]> {
    await this.initialize();
    
    try {
      // This would need to be implemented to list all files
      // For now, return empty array
      return [];
    } catch (error) {
      console.error('[LocalStorage] Failed to list files:', error);
      return [];
    }
  }
}

export const localStorageService = new LocalStorageService();