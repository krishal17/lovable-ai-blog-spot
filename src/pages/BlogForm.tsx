
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createBlogPost, updateBlogPost, getBlogPostById, BlogPost } from '@/lib/firestore';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BLOG_CATEGORIES } from '@/lib/utils';
import { ChevronLeft, Upload, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface BlogFormData {
  title: string;
  description: string;
  imageUrl: string;
  category: string;
  excerpt?: string;
}

const BlogForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;
  const navigate = useNavigate();
  const { toast } = useToast();
  const { currentUser, isAdmin } = useAuth();
  
  const [formData, setFormData] = useState<BlogFormData>({
    title: '',
    description: '',
    imageUrl: '',
    category: BLOG_CATEGORIES[0],
    excerpt: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [uploadingImage, setUploadingImage] = useState(false);

  // Ensure user is authorized
  useEffect(() => {
    if (!currentUser) {
      toast({
        variant: "destructive",
        title: "Unauthorized",
        description: "You must be logged in to create or edit blog posts."
      });
      navigate('/login');
    }
  }, [currentUser, navigate, toast]);

  // Fetch blog data if in edit mode
  useEffect(() => {
    const fetchBlog = async () => {
      if (!isEditMode) return;
      
      try {
        setLoading(true);
        const blogData = await getBlogPostById(id);
        setFormData({
          title: blogData.title,
          description: blogData.description,
          imageUrl: blogData.imageUrl,
          category: blogData.category,
          excerpt: blogData.excerpt || ''
        });
        setImagePreview(blogData.imageUrl);
      } catch (error) {
        console.error('Error fetching blog:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load blog post for editing."
        });
        navigate('/admin');
      } finally {
        setLoading(false);
      }
    };

    fetchBlog();
  }, [id, isEditMode, navigate, toast]);

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle category change
  const handleCategoryChange = (value: string) => {
    setFormData(prev => ({ ...prev, category: value }));
  };

  // Handle image selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Upload image to Storage
  const handleImageUpload = async () => {
    if (!imageFile || !currentUser) return null;
    
    try {
      setUploadingImage(true);
      
      // Try Cloudinary first if available
      try {
        const cloudinaryUrl = await uploadToCloudinary(imageFile);
        if (cloudinaryUrl) {
          return cloudinaryUrl;
        }
      } catch (cloudinaryError) {
        console.log('Cloudinary upload failed, falling back to Supabase storage');
      }
      
      // Fall back to Supabase Storage
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `blog-images/${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase
        .storage
        .from('profile_images')
        .upload(fileName, imageFile);
      
      if (uploadError) throw uploadError;
      
      const { data } = supabase
        .storage
        .from('profile_images')
        .getPublicUrl(fileName);
      
      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to upload image. Please try again."
      });
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      // Validate form
      if (!formData.title.trim()) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Please enter a title for your blog post."
        });
        return;
      }
      
      if (!formData.description.trim()) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Please enter content for your blog post."
        });
        return;
      }
      
      if (!formData.category) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Please select a category for your blog post."
        });
        return;
      }
      
      // Upload image if a new one is selected
      let finalImageUrl = formData.imageUrl;
      if (imageFile) {
        finalImageUrl = await handleImageUpload() || '';
        if (!finalImageUrl) return; // Stop if image upload failed
      }
      
      // Check if user is authenticated
      if (!currentUser) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "You must be logged in to create or edit blog posts."
        });
        navigate('/login');
        return;
      }

      // Prepare final data
      const blogData = {
        ...formData,
        imageUrl: finalImageUrl,
        // Generate an excerpt if not provided
        excerpt: formData.excerpt || formData.description.substring(0, 150) + '...'
      };
      
      console.log('Submitting blog data:', blogData);
      
      // Create or update blog post
      if (isEditMode && id) {
        await updateBlogPost(id, blogData);
        toast({
          title: "Success",
          description: "Blog post updated successfully!"
        });
      } else {
        await createBlogPost(blogData);
        toast({
          title: "Success",
          description: "New blog post created successfully!"
        });
      }
      
      // Navigate back to dashboard
      navigate('/admin');
      
    } catch (error: any) {
      console.error('Error saving blog:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error?.message || (isEditMode 
          ? "Failed to update blog post. Please try again." 
          : "Failed to create blog post. Please try again.")
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditMode) {
    return (
      <div className="blog-container">
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-blog-purple" />
        </div>
      </div>
    );
  }

  return (
    <div className="blog-container">
      <div className="max-w-3xl mx-auto">
        <button 
          onClick={() => navigate('/admin')}
          className="inline-flex items-center text-blog-purple hover:underline mb-6"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back to dashboard
        </button>
        
        <h1 className="text-2xl font-bold mb-6">
          {isEditMode ? 'Edit Blog Post' : 'Create New Blog Post'}
        </h1>
        
        <Card className="shadow-lg border-none">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title" className="block text-sm font-medium">
                  Title <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Enter blog title"
                  className="h-12"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="excerpt" className="block text-sm font-medium">
                  Excerpt <span className="text-gray-400 text-xs">(optional)</span>
                </Label>
                <Input
                  id="excerpt"
                  name="excerpt"
                  value={formData.excerpt || ''}
                  onChange={handleChange}
                  placeholder="A short summary of your blog post"
                  className="h-12"
                />
                <p className="text-xs text-muted-foreground">
                  If left empty, an excerpt will be generated from your content
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="category" className="block text-sm font-medium">
                  Category <span className="text-red-500">*</span>
                </Label>
                <Select 
                  value={formData.category} 
                  onValueChange={handleCategoryChange}
                >
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {BLOG_CATEGORIES.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description" className="block text-sm font-medium">
                  Content <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Write your blog content here..."
                  rows={10}
                  className="resize-y"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="image" className="block text-sm font-medium">
                  Featured Image
                </Label>
                <div className="mt-1 flex items-center">
                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="image"
                    className="cursor-pointer flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-4 w-full hover:border-blog-purple transition-colors"
                  >
                    <div className="space-y-1 text-center">
                      <Upload className="mx-auto h-10 w-10 text-gray-400" />
                      <div className="text-sm text-gray-600">
                        <span className="font-medium text-blog-purple">
                          Click to upload
                        </span>{" "}
                        or drag and drop
                      </div>
                      <p className="text-xs text-gray-500">
                        PNG, JPG, GIF up to 10MB
                      </p>
                    </div>
                  </label>
                </div>
                
                {imagePreview && (
                  <div className="mt-3">
                    <p className="text-sm text-gray-600 mb-2">Image Preview:</p>
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="h-48 w-auto object-cover rounded-lg border border-gray-200"
                    />
                  </div>
                )}
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/admin')}
                  className="px-6"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading || uploadingImage}
                  className="px-8 bg-blog-purple hover:bg-blog-dark-purple"
                >
                  {(loading || uploadingImage) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {isEditMode ? 'Update' : 'Publish'} Post
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BlogForm;
