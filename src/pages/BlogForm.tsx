
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

interface BlogFormData {
  title: string;
  description: string;
  imageUrl: string;
  category: string;
}

const BlogForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState<BlogFormData>({
    title: '',
    description: '',
    imageUrl: '',
    category: BLOG_CATEGORIES[0]
  });
  
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [uploadingImage, setUploadingImage] = useState(false);

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
          category: blogData.category
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

  // Handle image upload to Cloudinary
  const handleImageUpload = async () => {
    if (!imageFile) return null;
    
    try {
      setUploadingImage(true);
      const imageUrl = await uploadToCloudinary(imageFile);
      
      if (imageUrl) {
        toast({
          title: "Success",
          description: "Image uploaded successfully."
        });
        setFormData(prev => ({ ...prev, imageUrl }));
      }
      return imageUrl;
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
      
      // Upload image if a new one is selected
      let finalImageUrl = formData.imageUrl;
      if (imageFile) {
        finalImageUrl = await handleImageUpload() || '';
        if (!finalImageUrl) return; // Stop if image upload failed
      }
      
      // Prepare final data
      const finalData = {
        ...formData,
        imageUrl: finalImageUrl
      };
      
      // Create or update blog post
      if (isEditMode && id) {
        await updateBlogPost(id, finalData);
        toast({
          title: "Success",
          description: "Blog post updated successfully!"
        });
      } else {
        await createBlogPost(finalData);
        toast({
          title: "Success",
          description: "New blog post created successfully!"
        });
      }
      
      // Navigate back to dashboard
      navigate('/admin');
      
    } catch (error) {
      console.error('Error saving blog:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: isEditMode 
          ? "Failed to update blog post. Please try again." 
          : "Failed to create blog post. Please try again."
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
        
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="title" className="block text-sm font-medium">
                  Title <span className="text-red-500">*</span>
                </label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Enter blog title"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="category" className="block text-sm font-medium">
                  Category <span className="text-red-500">*</span>
                </label>
                <Select 
                  value={formData.category} 
                  onValueChange={handleCategoryChange}
                >
                  <SelectTrigger>
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
                <label htmlFor="description" className="block text-sm font-medium">
                  Content <span className="text-red-500">*</span>
                </label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Write your blog content here..."
                  rows={8}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="image" className="block text-sm font-medium">
                  Featured Image
                </label>
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
                    className="cursor-pointer flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-4 w-full"
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
                      className="h-48 w-auto object-cover rounded-lg"
                    />
                  </div>
                )}
              </div>
              
              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/admin')}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading || uploadingImage}
                >
                  {(loading || uploadingImage) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {isEditMode ? 'Update' : 'Create'} Blog Post
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
