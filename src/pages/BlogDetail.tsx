
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getBlogPostById, BlogPost } from '@/lib/firestore';
import { formatDate } from '@/lib/utils';
import { ChevronLeft, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import CommentSection from '@/components/CommentSection';
import LikeButton from '@/components/LikeButton';

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

  // Determine which content style to apply based on blog's content_format
  const getContentStyle = () => {
    const format = blog.content_format || {};
    const styles: React.CSSProperties = {
      fontFamily: format.font === 'serif' ? 'Georgia, serif' : 
                  format.font === 'mono' ? 'monospace' : 
                  format.font === 'cursive' ? 'cursive' : 'inherit',
      fontSize: format.size === 'large' ? '1.2rem' : 
                format.size === 'small' ? '0.9rem' : '1rem',
      fontStyle: format.style === 'italic' ? 'italic' : 'normal',
      fontWeight: format.style === 'bold' ? 'bold' : 'normal'
    };
    return styles;
  };

  return (
    <div className="blog-container pt-8">
      <div className="max-w-3xl mx-auto">
        <Link to="/" className="inline-flex items-center text-blog-purple hover:underline mb-6">
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back to all posts
        </Link>
        
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-4">
            <Link to={`/categories?category=${encodeURIComponent(blog.category)}`}>
              <span className="bg-blog-lavender text-blog-purple px-3 py-1 rounded-full text-xs hover:bg-blog-purple hover:text-white transition-colors">
                {blog.category}
              </span>
            </Link>
            <LikeButton blogId={blog.id} />
          </div>
          
          {isAdmin && (
            <Link to={`/admin/edit/${blog.id}`}>
              <Button variant="outline" size="sm" className="flex items-center">
                <Edit className="w-4 h-4 mr-1" /> Edit Post
              </Button>
            </Link>
          )}
        </div>
        
        <h1 className="text-3xl md:text-5xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blog-purple to-blog-dark-purple">
          {blog.title}
        </h1>
        
        <p className="text-gray-600 text-sm mb-8">
          Published {formatDate(new Date(blog.createdAt))}
        </p>
        
        <div className="mb-8">
          <img
            src={blog.imageUrl || "/placeholder.svg"}
            alt={blog.title}
            className="w-full h-auto rounded-xl object-cover max-h-96"
          />
        </div>
        
        <article className="prose prose-lg max-w-none">
          {blog.excerpt && (
            <p className="text-lg font-semibold text-gray-700 mb-4 italic">
              {blog.excerpt}
            </p>
          )}
          
          <div 
            className="whitespace-pre-line"
            style={getContentStyle()}
          >
            {blog.description}
          </div>
        </article>
        
        <CommentSection blogId={blog.id} />
      </div>
    </div>
  );
};

export default BlogDetail;
