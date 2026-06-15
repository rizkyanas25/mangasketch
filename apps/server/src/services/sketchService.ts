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
   * Resolves the original root parent ID for a sketch in the version chain.
   * If the sketch has no parent, returns the ID itself.
   */
  static async getRootParentId(sketchId: string): Promise<string> {
    let currentId = sketchId;
    while (true) {
      const { data, error } = await supabase
        .from('sketches')
        .select('id, parent_id')
        .eq('id', currentId)
        .single();
      
      if (error || !data) {
        return currentId;
      }
      
      if (data.parent_id) {
        currentId = data.parent_id;
      } else {
        return data.id;
      }
    }
  }

  /**
   * Saves sketch metadata to the database.
   * Resolves parentId to the absolute root parent to keep the tree flat and easy to query.
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
    let resolvedParentId: string | null = null;
    if (sketchData.parentId) {
      resolvedParentId = await this.getRootParentId(sketchData.parentId);
    }

    const { data, error } = await supabase
      .from('sketches')
      .insert({
        user_id: sketchData.userId,
        prompt: sketchData.prompt,
        manga_style: sketchData.mangaStyle,
        drawing_style: sketchData.drawingStyle,
        image_url: sketchData.imageUrl,
        seed: sketchData.seed,
        parent_id: resolvedParentId
      })
      .select()
      .single();

    if (error) {
      console.error('[Sketch Service] Error saving sketch to database:', error);
      throw new Error('DATABASE_SAVE_ERROR');
    }

    return data as Sketch;
  }

  /**
   * Retrieves all sketches belonging to a specific user, sorted from newest to oldest.
   * @param userId User's UUID
   * @returns Array of Sketch records
   */
  static async getUserSketches(userId: string): Promise<Sketch[]> {
    const { data, error } = await supabase
      .from('sketches')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Sketch Service] Error fetching user sketches:', error);
      throw new Error('DATABASE_FETCH_ERROR');
    }

    return (data || []) as Sketch[];
  }

  /**
   * Retrieves a sketch by ID and all its related versions (parents and descendants).
   * @param sketchId Sketch ID
   * @param userId User ID for ownership verification
   * @returns The main sketch and all its versions
   */
  static async getSketchWithHistory(
    sketchId: string,
    userId: string
  ): Promise<{ sketch: Sketch; versions: Sketch[] }> {
    // 1. Fetch target sketch to verify existence & ownership
    const { data: targetSketch, error: targetError } = await supabase
      .from('sketches')
      .select('*')
      .eq('id', sketchId)
      .eq('user_id', userId)
      .single();

    if (targetError || !targetSketch) {
      console.error('[Sketch Service] Sketch not found or access denied:', targetError);
      throw new Error('SKETCH_NOT_FOUND');
    }

    // 2. Resolve root parent ID (if target parent_id is null, it is root itself; otherwise it points to root)
    const rootId = targetSketch.parent_id || targetSketch.id;

    // 3. Fetch all sketches in the family tree (either the root or descendants pointing to the root)
    const { data: versions, error: versionsError } = await supabase
      .from('sketches')
      .select('*')
      .or(`id.eq.${rootId},parent_id.eq.${rootId}`)
      .order('created_at', { ascending: true }); // chronological order

    if (versionsError) {
      console.error('[Sketch Service] Error fetching version history:', versionsError);
      throw new Error('DATABASE_FETCH_ERROR');
    }

    return {
      sketch: targetSketch as Sketch,
      versions: (versions || []) as Sketch[]
    };
  }
}
