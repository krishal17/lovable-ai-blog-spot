
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getBlogPostById, BlogPost } from '@/lib/firestore';
import { formatDate } from '@/lib/utils';
import { ChevronLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

const BlogDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [blog, setBlog] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { isAdmin } = useAuth();

  useEffect(() => {
    const fetchBlog = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const blogData = await getBlogPostById(id);
        setBlog(blogData);
      } catch (error) {
        console.error('Error fetching blog:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load blog post. It may have been removed or doesn't exist."
        });
      } finally {
        setLoading(false);
      }
    };

    fetchBlog();
  }, [id, toast]);

  if (loading) {
    return (
      <div className="blog-container pt-8">
        <div className="max-w-3xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-blog-lavender rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-blog-lavender rounded w-1/4 mb-8"></div>
            <div className="h-64 bg-blog-lavender rounded mb-6"></div>
            <div className="space-y-3">
              <div className="h-4 bg-blog-lavender rounded"></div>
              <div className="h-4 bg-blog-lavender rounded"></div>
              <div className="h-4 bg-blog-lavender rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="blog-container">
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold mb-4">Blog post not found</h2>
          <p className="text-gray-600 mb-8">The blog post you're looking for doesn't exist or has been removed.</p>
          <Link to="/">
            <Button>Back to Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="blog-container pt-8">
      <div className="max-w-3xl mx-auto">
        <Link to="/" className="inline-flex items-center text-blog-purple hover:underline mb-6">
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back to all posts
        </Link>
        
        {isAdmin && (
          <div className="mb-6">
            <Link to={`/admin/edit/${blog.id}`}>
              <Button variant="outline" className="mr-2">Edit Post</Button>
            </Link>
          </div>
        )}
        
        <h1 className="text-3xl md:text-4xl font-bold mb-4">{blog.title}</h1>
        
        <div className="flex items-center space-x-4 mb-6">
          <span className="text-gray-600 text-sm">{formatDate(blog.createdAt)}</span>
          <span className="bg-blog-lavender text-blog-purple px-3 py-1 rounded-full text-xs">
            {blog.category}
          </span>
        </div>
        
        <div className="mb-8">
          <img
            src={blog.imageUrl || "/placeholder.svg"}
            alt={blog.title}
            className="w-full h-auto rounded-xl object-cover max-h-96"
          />
        </div>
        
        <div className="prose max-w-none">
          <p className="whitespace-pre-line">{blog.description}</p>
        </div>
      </div>
    </div>
  );
};

export default BlogDetail;
