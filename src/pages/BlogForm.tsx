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
        if (blogData) {
          setFormData({
            title: blogData.title,
            description: blogData.description,
            imageUrl: blogData.imageUrl,
            category: blogData.category,
            excerpt: blogData.excerpt || ''
          });
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

  // Upload image to Storage
  const handleImageUpload = async () => {
    if (!imageFile || !currentUser) return null;

    try {
      setUploadingImage(true);

      // Upload to Supabase Storage
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${currentUser.uid}/${Date.now()}.${fileExt}`;

      // First check if bucket exists
      const { data: buckets, error: bucketError } = await supabase
        .storage
        .listBuckets();

      if (bucketError) {
        console.error('Error checking buckets:', bucketError);
        throw bucketError;
      }

      // Create bucket if it doesn't exist
      if (!buckets?.some(bucket => bucket.name === 'blog_images')) {
        const { error: createError } = await supabase
          .storage
          .createBucket('blog_images', {
            public: true,
            fileSizeLimit: 5242880, // 5MB
            allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
          });

        if (createError) {
          console.error('Error creating bucket:', createError);
          throw createError;
        }
      }

      // Upload the file
      const { data: uploadData, error: uploadError } = await supabase
        .storage
        .from('blog_images')
        .upload(fileName, imageFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Supabase upload error:', uploadError);
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase
        .storage
        .from('blog_images')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to upload image. Please try again.",
        className: "bg-gradient-to-r from-red-500 to-rose-500 text-white",
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
        if (!finalImageUrl) {
          toast({
            variant: "destructive",
            title: "Error",
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
        is_featured: false
      };

      let updatedPost;
      if (isEditMode && id) {
        updatedPost = await updateBlogPost(id, blogData);
        toast({
          title: "Success!",
          description: "Blog post updated successfully.",
          className: "bg-gradient-to-r from-green-500 to-emerald-500 text-white",
        });
      } else {
        updatedPost = await createBlogPost(blogData);
        toast({
          title: "Success!",
          description: "Blog post created successfully.",
          className: "bg-gradient-to-r from-green-500 to-emerald-500 text-white",
        });
      }

      // Navigate to the updated/created post
      navigate(`/blog/${updatedPost.id}`);
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
              <label className="text-sm font-medium">Title</label>
              <Input
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Enter blog post title"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
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
              <label className="text-sm font-medium">Featured Image</label>
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
              <label className="text-sm font-medium">Excerpt (Optional)</label>
              <Textarea
                name="excerpt"
                value={formData.excerpt}
                onChange={handleChange}
                placeholder="Enter a short excerpt for your blog post"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Content</label>
              <Textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Write your blog post content here"
                rows={10}
                required
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
