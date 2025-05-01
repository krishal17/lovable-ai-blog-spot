
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

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

// Create a new blog post
export const createBlogPost = async (blogData: Omit<BlogPost, 'id' | 'createdAt' | 'updatedAt'>) => {
  const now = new Date().toISOString();
  
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
    .select()
    .single();
  
  if (error) throw error;
  
  return transformBlogPost(data);
};

// Update an existing blog post
export const updateBlogPost = async (id: string, blogData: Partial<Omit<BlogPost, 'id' | 'createdAt' | 'updatedAt'>>) => {
  const now = new Date().toISOString();
  
  const updateData: any = {
    updated_at: now
  };
  
  if (blogData.title) updateData.title = blogData.title;
  if (blogData.description) updateData.description = blogData.description;
  if (blogData.imageUrl) updateData.image_url = blogData.imageUrl;
  if (blogData.category) updateData.category = blogData.category;
  if (blogData.content_format) updateData.content_format = blogData.content_format;
  if (blogData.excerpt) updateData.excerpt = blogData.excerpt;
  if (blogData.is_featured !== undefined) updateData.is_featured = blogData.is_featured;
  
  const { data, error } = await supabase
    .from('blog_posts')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  
  return transformBlogPost(data);
};

// Delete a blog post
export const deleteBlogPost = async (id: string) => {
  const { error } = await supabase
    .from('blog_posts')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

// Get a single blog post by ID
export const getBlogPostById = async (id: string): Promise<BlogPost> => {
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  
  return transformBlogPost(data);
};

// Get all blog posts
export const getAllBlogPosts = async (): Promise<BlogPost[]> => {
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  
  return data.map(transformBlogPost);
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

// Comments related functions
export const addComment = async (blogId: string, content: string): Promise<Comment> => {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("User must be logged in to comment");
  
  const { data, error } = await supabase
    .from('comments')
    .insert({
      blog_id: blogId,
      user_id: userData.user.id,
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
    .select(`
      *,
      user_profiles(username, avatar_url)
    `)
    .eq('blog_id', blogId)
    .order('created_at', { ascending: false });
    
  if (error) throw error;
  
  return data.map(transformComment);
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
  
  // Check if already liked
  const { data: existingLike } = await supabase
    .from('likes')
    .select('id')
    .eq('blog_id', blogId)
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
        blog_id: blogId,
        user_id: userData.user.id
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
    .eq('blog_id', blogId)
    .eq('user_id', userData.user.id)
    .single();
    
  return !!data;
};

export const getLikesCount = async (blogId: string): Promise<number> => {
  const { count, error } = await supabase
    .from('likes')
    .select('id', { count: 'exact', head: true })
    .eq('blog_id', blogId);
    
  if (error) throw error;
  return count || 0;
};

// User profile functions
export const getUserProfile = async (userId: string): Promise<UserProfile> => {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
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

// Admin functions
export const getAllUsers = async (): Promise<UserProfile[]> => {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .order('created_at', { ascending: false });
    
  if (error) throw error;
  
  return data.map(user => ({
    id: user.id,
    username: user.username,
    avatarUrl: user.avatar_url,
    createdAt: user.created_at,
    updatedAt: user.updated_at
  }));
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
    blogId: comment.blog_id,
    userId: comment.user_id,
    content: comment.content,
    createdAt: comment.created_at,
    username: comment.user_profiles?.username,
    avatarUrl: comment.user_profiles?.avatar_url
  };
}
