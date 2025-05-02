
import { supabase } from '@/integrations/supabase/client';

/**
 * Uploads an image to Supabase Storage
 * @param file The file to upload
 * @returns The public URL of the uploaded file
 */
export const uploadImage = async (file: File): Promise<string> => {
  try {
    // Generate a unique file name
    const timestamp = new Date().getTime();
    const randomString = Math.random().toString(36).substring(2, 10);
    const fileExt = file.name.split('.').pop();
    const fileName = `${timestamp}_${randomString}.${fileExt}`;
    const filePath = `blog_images/${fileName}`;
    
    // Check if bucket exists
    const { data: buckets } = await supabase.storage.listBuckets();
    
    if (!buckets?.some(bucket => bucket.name === 'blog_images')) {
      // Create bucket if it doesn't exist
      await supabase.storage.createBucket('blog_images', {
        public: true,
        fileSizeLimit: 5242880 // 5MB
      });
    }
    
    // Upload file to Supabase Storage
    const { error: uploadError } = await supabase
      .storage
      .from('blog_images')
      .upload(filePath, file);
    
    if (uploadError) throw uploadError;
    
    // Get public URL for the uploaded file
    const { data } = supabase
      .storage
      .from('blog_images')
      .getPublicUrl(filePath);
    
    return data.publicUrl;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw new Error('Failed to upload image');
  }
}
