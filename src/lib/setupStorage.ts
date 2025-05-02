
import { supabase } from '@/integrations/supabase/client';

export const setupStorage = async () => {
  try {
    // Check if blog_images bucket exists
    const { data: buckets } = await supabase.storage.listBuckets();
    
    if (!buckets?.some(bucket => bucket.name === 'blog_images')) {
      // Create bucket if it doesn't exist
      const { error } = await supabase.storage.createBucket('blog_images', {
        public: true,
        fileSizeLimit: 5242880 // 5MB
      });
      
      if (error) {
        console.error('Error creating storage bucket:', error);
      } else {
        console.log('Storage bucket "blog_images" created successfully');
      }
    }
  } catch (error) {
    console.error('Error setting up storage:', error);
  }
};
