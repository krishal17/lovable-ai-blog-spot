
import { supabase } from '@/integrations/supabase/client';

export const setupStorage = async () => {
  try {
    console.log('Setting up storage buckets...');
    
    // Check if blog_images bucket exists
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('Error checking storage buckets:', bucketsError);
      return;
    }
    
    const hasBlogImagesBucket = buckets?.some(bucket => bucket.name === 'blog_images');
    
    if (!hasBlogImagesBucket) {
      console.log('Creating blog_images bucket...');
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
    } else {
      console.log('Blog images bucket already exists');
    }
  } catch (error) {
    console.error('Error setting up storage:', error);
    throw error;
  }
};
