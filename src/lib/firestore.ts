
import { supabase } from "@/integrations/supabase/client";

export interface BlogPost {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  category: string;
  createdAt: string;
  updatedAt: string;
  content_format?: any;
  excerpt?: string;
  is_featured?: boolean;
  comments?: Comment[];
}

export interface Comment {
  id: string;
  blogId: string;
  userId: string;
  content: string;
  createdAt: string;
  username?: string;
  avatarUrl?: string;
}

export interface UserProfile {
  id: string;
  username: string | null;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

// Get all users
export const getAllUsers = async (): Promise<UserProfile[]> => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching users:', error);
      throw new Error(error.message || 'Failed to fetch users');
    }

    return data.map(user => ({
      id: user.id,
      username: user.username,
      avatarUrl: user.avatar_url,
      createdAt: user.created_at,
      updatedAt: user.updated_at
    }));
  } catch (error: any) {
    console.error('Error in getAllUsers:', error);
    throw new Error(error.message || 'Failed to fetch users');
  }
};

// Create a new blog post
export const createBlogPost = async (blogData: Omit<BlogPost, 'id' | 'createdAt' | 'updatedAt'>) => {
  const now = new Date().toISOString();

  try {
    const { data, error } = await supabase
      .from('blog_posts')
      .insert({
        title: blogData.title,
        description: blogData.description,
        image_url: blogData.imageUrl,
        category: blogData.category,
        created_at: now,
        updated_at: now,
        content_format: blogData.content_format,
        excerpt: blogData.excerpt,
        is_featured: blogData.is_featured || false
      })
      .select();

    if (error) {
      console.error('Error creating blog post:', error);
      throw new Error(error.message || 'Failed to create blog post');
    }

    if (!data || data.length === 0) {
      throw new Error('No data returned after creating blog post');
    }

    return transformBlogPost(data[0]);
  } catch (error: any) {
    console.error('Error in createBlogPost:', error);
    throw new Error(error.message || 'Failed to create blog post');
  }
};

// Update an existing blog post
export const updateBlogPost = async (id: string, data: Partial<BlogPost>): Promise<BlogPost> => {
  try {
    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString()
    };
    
    // Map fields from the data object to database columns
    if (data.title) updateData.title = data.title;
    if (data.description) updateData.description = data.description;
    if (data.imageUrl) updateData.image_url = data.imageUrl;
    if (data.category) updateData.category = data.category;
    if (data.content_format) updateData.content_format = data.content_format;
    if (data.excerpt) updateData.excerpt = data.excerpt;
    if (data.is_featured !== undefined) updateData.is_featured = data.is_featured;

    console.log('Updating blog post with ID:', id);
    console.log('Update data:', updateData);

    // Now update the post
    const { data: updatedData, error: updateError } = await supabase
      .from('blog_posts')
      .update(updateData)
      .eq('id', id)
      .select();

    if (updateError) {
      console.error('Error updating blog post:', updateError);
      throw new Error(updateError.message || 'Failed to update blog post');
    }

    if (!updatedData || updatedData.length === 0) {
      // Try to fetch the post to see if it exists
      const { data: existingPost, error: fetchError } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('id', id)
        .maybeSingle();
        
      if (fetchError) {
        console.error('Error fetching blog post:', fetchError);
        throw new Error(fetchError.message || 'Failed to fetch blog post after update');
      }
      
      if (!existingPost) {
        throw new Error('No blog post found with the given ID');
      }
      
      return transformBlogPost(existingPost);
    }

    return transformBlogPost(updatedData[0]);
  } catch (error: any) {
    console.error('Error in updateBlogPost:', error);
    throw new Error(error.message || 'Failed to update blog post');
  }
};

// Delete a blog post
export const deleteBlogPost = async (id: string): Promise<void> => {
  try {
    console.log('Deleting blog post with ID:', id);
    
    // First, delete all comments associated with this blog post
    const { error: commentsError } = await supabase
      .from('comments')
      .delete()
      .eq('post_id', id);
      
    if (commentsError) {
      console.error('Error deleting comments:', commentsError);
    }
    
    // Then, delete all likes associated with this blog post
    const { error: likesError } = await supabase
      .from('likes')
      .delete()
      .eq('post_id', id);
      
    if (likesError) {
      console.error('Error deleting likes:', likesError);
    }

    // Finally, delete the blog post
    const { error: deleteError } = await supabase
      .from('blog_posts')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting blog post:', deleteError);
      throw new Error(deleteError.message || 'Failed to delete blog post');
    }
    
    console.log('Blog post deleted successfully');
  } catch (error: any) {
    console.error('Error in deleteBlogPost:', error);
    throw new Error(error.message || 'Failed to delete blog post');
  }
};

// Get a single blog post by ID
export const getBlogPostById = async (id: string): Promise<BlogPost> => {
  try {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching blog post:', error);
      throw new Error(error.message || 'Failed to fetch blog post');
    }

    if (!data) {
      throw new Error(`Blog post with ID ${id} not found`);
    }

    return transformBlogPost(data);
  } catch (error: any) {
    console.error('Error in getBlogPostById:', error);
    throw new Error(error.message || 'Failed to fetch blog post');
  }
};

// Get all blog posts
export const getAllBlogPosts = async (): Promise<BlogPost[]> => {
  try {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching blog posts:', error);
      throw new Error(error.message || 'Failed to fetch blog posts');
    }

    if (!data) return [];
    return data.map(transformBlogPost);
  } catch (error: any) {
    console.error('Error in getAllBlogPosts:', error);
    throw new Error(error.message || 'Failed to fetch blog posts');
  }
};

// Get blog posts by category
export const getBlogPostsByCategory = async (category: string): Promise<BlogPost[]> => {
  try {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('category', category)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching blog posts by category:', error);
      throw new Error(error.message || 'Failed to fetch blog posts by category');
    }

    if (!data) return [];
    return data.map(transformBlogPost);
  } catch (error: any) {
    console.error('Error in getBlogPostsByCategory:', error);
    throw new Error(error.message || 'Failed to fetch blog posts by category');
  }
};

// Get all unique categories
export const getAllCategories = async (): Promise<string[]> => {
  const { data, error } = await supabase
    .from('blog_posts')
    .select('category')
    .order('category');

  if (error) throw error;

  // Extract unique categories
  const uniqueCategories = [...new Set(data.map(item => item.category))];
  return uniqueCategories;
};

// Upload image to Supabase Storage
export const uploadImageToSupabase = async (file: File): Promise<string> => {
  try {
    // Check if the 'blog-images' bucket exists, create it if not
    const { data: buckets } = await supabase.storage.listBuckets();
    
    if (!buckets?.find(bucket => bucket.name === 'blog-images')) {
      const { data, error } = await supabase.storage.createBucket('blog-images', { 
        public: true,
        fileSizeLimit: 5242880 // 5MB
      });
      
      if (error) {
        console.error("Error creating bucket:", error);
        throw error;
      }
      
      console.log("Created new bucket:", data);
    }
    
    // Generate a unique file name
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    
    console.log('Uploading file:', fileName, 'type:', file.type);
    
    // Upload the file
    const { error: uploadError, data: uploadData } = await supabase.storage
      .from('blog-images')
      .upload(fileName, file, {
        contentType: file.type,
        cacheControl: '3600'
      });
    
    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw uploadError;
    }
    
    console.log('Upload successful:', uploadData);
    
    // Get the public URL
    const { data } = supabase.storage.from('blog-images').getPublicUrl(fileName);
    
    if (!data || !data.publicUrl) {
      throw new Error('Failed to get public URL for uploaded file');
    }
    
    console.log('Public URL:', data.publicUrl);
    return data.publicUrl;
  } catch (error) {
    console.error('Error uploading image to Supabase:', error);
    throw error;
  }
};

// Comments related functions
export const addComment = async (blogId: string, content: string): Promise<Comment> => {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("User must be logged in to comment");

  // Get user profile info
  const { data: profileData } = await supabase
    .from('user_profiles')
    .select('username, avatar_url')
    .eq('id', userData.user.id)
    .single();

  const username = profileData?.username || userData.user.email?.split('@')[0] || 'Anonymous';

  // Add the comment with user information
  const { data, error } = await supabase
    .from('comments')
    .insert({
      post_id: blogId,
      user_id: userData.user.id,
      user_name: username,
      user_avatar: profileData?.avatar_url || null,
      content: content,
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) throw error;

  return transformComment(data);
};

export const getCommentsByBlogId = async (blogId: string): Promise<Comment[]> => {
  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .eq('post_id', blogId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return data.map(comment => transformComment(comment));
};

export const deleteComment = async (commentId: string) => {
  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', commentId);

  if (error) throw error;
};

// Likes related functions
export const toggleLike = async (blogId: string): Promise<boolean> => {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("User must be logged in to like posts");

  // Get user profile info
  const { data: profileData } = await supabase
    .from('user_profiles')
    .select('username, avatar_url')
    .eq('id', userData.user.id)
    .single();

  const username = profileData?.username || userData.user.email?.split('@')[0] || 'Anonymous';

  // Check if already liked
  const { data: existingLike } = await supabase
    .from('likes')
    .select('id')
    .eq('post_id', blogId)
    .eq('user_id', userData.user.id)
    .single();

  if (existingLike) {
    // Unlike
    const { error } = await supabase
      .from('likes')
      .delete()
      .eq('id', existingLike.id);

    if (error) throw error;
    return false; // Now unliked
  } else {
    // Like
    const { error } = await supabase
      .from('likes')
      .insert({
        post_id: blogId,
        user_id: userData.user.id,
        user_name: username,
        user_avatar: profileData?.avatar_url || null,
        created_at: new Date().toISOString()
      });

    if (error) throw error;
    return true; // Now liked
  }
};

export const isPostLiked = async (blogId: string): Promise<boolean> => {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return false;

  const { data } = await supabase
    .from('likes')
    .select('id')
    .eq('post_id', blogId)
    .eq('user_id', userData.user.id)
    .single();

  return !!data;
};

export const getLikesCount = async (blogId: string): Promise<number> => {
  const { count, error } = await supabase
    .from('likes')
    .select('id', { count: 'exact', head: true })
    .eq('post_id', blogId);

  if (error) throw error;
  return count || 0;
};

// User profile functions
export const getUserProfile = async (userId: string): Promise<UserProfile> => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }

    return {
      id: data.id,
      username: data.username,
      avatarUrl: data.avatar_url,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  } catch (error) {
    console.error('Error in getUserProfile:', error);
    throw error;
  }
};

export const updateUserProfile = async (userId: string, profile: Partial<UserProfile>): Promise<UserProfile> => {
  const updateData: any = {};

  if (profile.username) updateData.username = profile.username;
  if (profile.avatarUrl) updateData.avatar_url = profile.avatarUrl;

  const { data, error } = await supabase
    .from('user_profiles')
    .update(updateData)
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    username: data.username,
    avatarUrl: data.avatar_url,
    createdAt: data.created_at,
    updatedAt: data.updated_at
  };
};

// Helper function to transform database column names to camelCase for frontend consistency
function transformBlogPost(post: any): BlogPost {
  return {
    id: post.id,
    title: post.title,
    description: post.description,
    imageUrl: post.image_url || post.imageUrl, // Handle both naming conventions
    category: post.category,
    createdAt: post.created_at || post.createdAt,
    updatedAt: post.updated_at || post.updatedAt,
    content_format: post.content_format,
    excerpt: post.excerpt,
    is_featured: post.is_featured
  };
}

function transformComment(comment: any): Comment {
  return {
    id: comment.id,
    blogId: comment.post_id,
    userId: comment.user_id,
    content: comment.content,
    createdAt: comment.created_at,
    username: comment.user_name,
    avatarUrl: comment.user_avatar
  };
}
