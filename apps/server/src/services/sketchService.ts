import { supabase } from '../config/supabase';
import { Sketch } from '@mangasketch/shared';

export class SketchService {
  /**
   * Uploads an image buffer to the 'sketches' Supabase storage bucket.
   * @param buffer Image buffer to upload
   * @param filepath Target file path inside the bucket (e.g. 'user-id/filename.png')
   * @returns Public URL of the uploaded image
   */
  static async uploadSketchToStorage(buffer: Buffer, filepath: string): Promise<string> {
    const { data, error } = await supabase.storage
      .from('sketches')
      .upload(filepath, buffer, {
        contentType: 'image/png',
        upsert: true
      });

    if (error) {
      console.error('[Sketch Service] Error uploading sketch to storage:', error);
      throw new Error('STORAGE_UPLOAD_ERROR');
    }

    // Retrieve the public URL for the uploaded sketch
    const { data: publicUrlData } = supabase.storage
      .from('sketches')
      .getPublicUrl(filepath);

    if (!publicUrlData || !publicUrlData.publicUrl) {
      console.error('[Sketch Service] Failed to retrieve public URL for uploaded sketch.');
      throw new Error('STORAGE_URL_ERROR');
    }

    return publicUrlData.publicUrl;
  }

  /**
   * Saves sketch metadata to the database.
   * @param sketchData Sketch information to save
   * @returns The saved Sketch record
   */
  static async saveSketchToDatabase(sketchData: {
    userId: string;
    prompt: string;
    mangaStyle: string;
    drawingStyle: string;
    imageUrl: string;
    seed: number;
    parentId?: string | null;
  }): Promise<Sketch> {
    const { data, error } = await supabase
      .from('sketches')
      .insert({
        user_id: sketchData.userId,
        prompt: sketchData.prompt,
        manga_style: sketchData.mangaStyle,
        drawing_style: sketchData.drawingStyle,
        image_url: sketchData.imageUrl,
        seed: sketchData.seed,
        parent_id: sketchData.parentId || null
      })
      .select()
      .single();

    if (error) {
      console.error('[Sketch Service] Error saving sketch to database:', error);
      throw new Error('DATABASE_SAVE_ERROR');
    }

    return data as Sketch;
  }
}
