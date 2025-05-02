import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createBlogPost, updateBlogPost, getBlogPostById } from '@/lib/firestore';
import { uploadImage } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Bold, 
  Italic, 
  Underline, 
  AlignLeft, 
  AlignCenter, 
  AlignRight,
  ChevronLeft, 
  Upload, 
  Loader2 
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Toggle } from "@/components/ui/toggle";
import { supabase } from '@/integrations/supabase/client';

interface BlogFormData {
  title: string;
  description: string;
  imageUrl: string;
  category: string;
  excerpt?: string;
  content_format?: {
    font: string;
    size: string;
    style: string;
    alignment?: string;
  };
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
    category: '',
    excerpt: '',
    content_format: {
      font: 'default',
      size: 'normal',
      style: 'normal',
      alignment: 'left'
    }
  });

  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedTextFormat, setSelectedTextFormat] = useState<{
    bold: boolean;
    italic: boolean;
    underline: boolean;
    alignment: 'left' | 'center' | 'right';
  }>({
    bold: false,
    italic: false,
    underline: false,
    alignment: 'left'
  });

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
        console.log("Retrieved blog data:", blogData);
        
        if (blogData) {
          setFormData({
            title: blogData.title,
            description: blogData.description,
            imageUrl: blogData.imageUrl,
            category: blogData.category,
            excerpt: blogData.excerpt || '',
            content_format: blogData.content_format || {
              font: 'default',
              size: 'normal',
              style: 'normal',
              alignment: 'left'
            }
          });
          
          // Set text formatting options based on content_format
          if (blogData.content_format) {
            const style = blogData.content_format.style || 'normal';
            setSelectedTextFormat({
              bold: style.includes('bold'),
              italic: style.includes('italic'),
              underline: style.includes('underline'),
              alignment: (blogData.content_format.alignment as 'left' | 'center' | 'right') || 'left'
            });
          }
          
          setImagePreview(blogData.imageUrl);
        }
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

  // Handle text formatting
  const handleFormatChange = (format: 'bold' | 'italic' | 'underline') => {
    setSelectedTextFormat(prev => {
      const updated = { ...prev, [format]: !prev[format] };
      
      // Update content_format style
      let style = 'normal';
      if (updated.bold) style += ' bold';
      if (updated.italic) style += ' italic';
      if (updated.underline) style += ' underline';
      
      setFormData(prevData => ({
        ...prevData,
        content_format: {
          ...prevData.content_format!,
          style
        }
      }));
      
      return updated;
    });
  };

  // Handle alignment change
  const handleAlignmentChange = (alignment: 'left' | 'center' | 'right') => {
    setSelectedTextFormat(prev => ({ ...prev, alignment }));
    setFormData(prev => ({
      ...prev,
      content_format: {
        ...prev.content_format!,
        alignment
      }
    }));
  };

  // Handle image selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.match(/image\/(jpeg|png|gif|webp)/)) {
      toast({
        variant: "destructive",
        title: "Invalid file type",
        description: "Please upload an image file (JPEG, PNG, GIF, or WebP)."
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "File too large",
        description: "Please upload an image smaller than 5MB."
      });
      return;
    }

    setImageFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Upload image to Supabase Storage
  const handleImageUpload = async () => {
    if (!imageFile) return null;

    try {
      setUploadingImage(true);
      // Check if the 'blog-images' bucket exists, create it if not
      const { data: buckets } = await supabase.storage.listBuckets();
      
      if (!buckets?.find(bucket => bucket.name === 'blog-images')) {
        await supabase.storage.createBucket('blog-images', { 
          public: true,
          fileSizeLimit: 5242880 // 5MB
        });
      }
      
      // Generate a unique file name
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      
      // Upload the file
      const { error: uploadError } = await supabase.storage
        .from('blog-images')
        .upload(fileName, imageFile);
      
      if (uploadError) {
        throw uploadError;
      }
      
      // Get the public URL
      const { data } = supabase.storage.from('blog-images').getPublicUrl(fileName);
      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
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
        try {
          const imageUrl = await handleImageUpload();
          if (imageUrl) {
            finalImageUrl = imageUrl;
          }
        } catch (error) {
          console.error('Image upload error:', error);
          toast({
            variant: "destructive",
            title: "Image Upload Failed",
            description: "Failed to upload image. Please try again."
          });
          return;
        }
      }

      // Prepare final data
      const blogData = {
        title: formData.title,
        description: formData.description,
        imageUrl: finalImageUrl,
        category: formData.category,
        excerpt: formData.excerpt,
        content_format: formData.content_format
      };

      console.log('Submitting blog data:', blogData);

      let updatedPost;
      if (isEditMode && id) {
        try {
          updatedPost = await updateBlogPost(id, blogData);
          toast({
            title: "Success!",
            description: "Blog post updated successfully.",
            className: "bg-gradient-to-r from-green-500 to-emerald-500 text-white",
          });
        } catch (error: any) {
          console.error('Failed to update post:', error);
          toast({
            variant: "destructive",
            title: "Update Failed",
            description: error.message || "Failed to update blog post. Please try again."
          });
          return;
        }
      } else {
        updatedPost = await createBlogPost(blogData);
        toast({
          title: "Success!",
          description: "Blog post created successfully.",
          className: "bg-gradient-to-r from-green-500 to-emerald-500 text-white",
        });
      }

      // Navigate to the blog post view or admin dashboard
      if (updatedPost) {
        navigate(`/blog/${updatedPost.id}`);
      } else {
        // Fallback if no post was returned
        navigate('/admin');
      }
    } catch (error: any) {
      console.error('Error submitting form:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to save blog post. Please try again.",
        className: "bg-gradient-to-r from-red-500 to-rose-500 text-white",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/admin')}
          className="mr-4"
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
        <h1 className="text-2xl font-bold">
          {isEditMode ? 'Edit Blog Post' : 'Create New Blog Post'}
        </h1>
      </div>

      <Card className="p-6">
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Enter blog post title"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={handleCategoryChange}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {['Technology', 'Lifestyle', 'Travel', 'Food', 'Fashion', 'Health', 'Sports', 'Business', 'Entertainment', 'Other'].map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="image-upload">Featured Image</Label>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="cursor-pointer"
                  >
                    <Button variant="outline" className="w-full">
                      <Upload className="h-4 w-4 mr-2" />
                      {imageFile ? 'Change Image' : 'Upload Image'}
                    </Button>
                  </label>
                </div>
                {uploadingImage && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
              </div>
              {imagePreview && (
                <div className="mt-4">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="max-h-48 rounded-lg object-cover"
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="excerpt">Excerpt (Optional)</Label>
              <Textarea
                id="excerpt"
                name="excerpt"
                value={formData.excerpt}
                onChange={handleChange}
                placeholder="Enter a short excerpt for your blog post"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Text Formatting</Label>
              <div className="flex items-center space-x-2 border rounded-md p-2">
                <Toggle
                  pressed={selectedTextFormat.bold}
                  onPressedChange={() => handleFormatChange('bold')}
                  aria-label="Toggle bold"
                >
                  <Bold className="h-4 w-4" />
                </Toggle>
                <Toggle
                  pressed={selectedTextFormat.italic}
                  onPressedChange={() => handleFormatChange('italic')}
                  aria-label="Toggle italic"
                >
                  <Italic className="h-4 w-4" />
                </Toggle>
                <Toggle
                  pressed={selectedTextFormat.underline}
                  onPressedChange={() => handleFormatChange('underline')}
                  aria-label="Toggle underline"
                >
                  <Underline className="h-4 w-4" />
                </Toggle>
                <div className="border-l h-6 mx-2" />
                <Toggle
                  pressed={selectedTextFormat.alignment === 'left'}
                  onPressedChange={() => handleAlignmentChange('left')}
                  aria-label="Align left"
                >
                  <AlignLeft className="h-4 w-4" />
                </Toggle>
                <Toggle
                  pressed={selectedTextFormat.alignment === 'center'}
                  onPressedChange={() => handleAlignmentChange('center')}
                  aria-label="Align center"
                >
                  <AlignCenter className="h-4 w-4" />
                </Toggle>
                <Toggle
                  pressed={selectedTextFormat.alignment === 'right'}
                  onPressedChange={() => handleAlignmentChange('right')}
                  aria-label="Align right"
                >
                  <AlignRight className="h-4 w-4" />
                </Toggle>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Write your blog post content here"
                rows={10}
                required
                className={`${selectedTextFormat.bold ? 'font-bold' : ''} 
                           ${selectedTextFormat.italic ? 'italic' : ''} 
                           ${selectedTextFormat.underline ? 'underline' : ''} 
                           text-${selectedTextFormat.alignment}`}
              />
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={loading || uploadingImage}
                className="w-full sm:w-auto"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {isEditMode ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  isEditMode ? 'Update Blog Post' : 'Create Blog Post'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default BlogForm;
