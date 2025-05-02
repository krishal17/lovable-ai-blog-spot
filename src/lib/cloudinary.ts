
import { supabase } from '@/integrations/supabase/client';

export const uploadToCloudinary = async (file: File): Promise<string> => {
  try {
    // Generate a unique file name
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `blog-images/${fileName}`;
    
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
