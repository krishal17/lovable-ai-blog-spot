
import { supabase } from "@/integrations/supabase/client";

export interface BlogPost {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  category: string;
  createdAt: string;
  updatedAt: string;
}

// Create a new blog post
export const createBlogPost = async (blogData: Omit<BlogPost, 'id' | 'createdAt' | 'updatedAt'>) => {
  const now = new Date().toISOString();
  
  const { data, error } = await supabase
    .from('blog_posts')
    .insert({
      ...blogData,
      created_at: now,
      updated_at: now
    })
    .select()
    .single();
  
  if (error) throw error;
  
  return transformBlogPost(data);
};

// Update an existing blog post
export const updateBlogPost = async (id: string, blogData: Partial<Omit<BlogPost, 'id' | 'createdAt' | 'updatedAt'>>) => {
  const now = new Date().toISOString();
  
  const { data, error } = await supabase
    .from('blog_posts')
    .update({
      ...blogData,
      updated_at: now
    })
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

// Helper function to transform database column names to camelCase for frontend consistency
function transformBlogPost(post: any): BlogPost {
  return {
    id: post.id,
    title: post.title,
    description: post.description,
    imageUrl: post.image_url || post.imageUrl, // Handle both naming conventions
    category: post.category,
    createdAt: post.created_at || post.createdAt,
    updatedAt: post.updated_at || post.updatedAt
  };
}
